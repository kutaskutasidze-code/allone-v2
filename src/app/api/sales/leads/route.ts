import { revalidatePath } from "next/cache";
import { requireSalesAuth } from "@/lib/sales-auth";
import { AuthError } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  success,
  successWithPagination,
  error,
  validationError,
  unauthorized,
  getPaginationParams,
  createPaginationMeta,
} from "@/lib/api-response";
import {
  createLeadSchema,
  INFOSHOP_DOMAIN,
  parsePhonePrefixes,
} from "@/lib/validations/leads";
import { logger } from "@/lib/logger";
import { enqueueDemoJob } from "@/lib/demo-pipeline-trigger";
import { fetchAllRows } from "@/lib/supabase/paginate";

export async function GET(request: Request) {
  try {
    const { salesUser } = await requireSalesAuth();
    const { page, limit, offset } = getPaginationParams(request.url);
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search");

    const supabase = createAdminClient();

    let query = supabase
      .from("leads")
      .select("*", { count: "exact" })
      .eq("sales_user_id", salesUser.id)
      .order("lead_score", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (url.searchParams.get("scope") === "today") {
      const startOfDay = new Date();
      startOfDay.setUTCHours(0, 0, 0, 0);
      query = query.gte("assigned_at", startOfDay.toISOString());
    }

    // "Follow-ups" scope: only leads with an open follow-up task owed by this
    // rep (replaces the old status=in_process proxy for the Callbacks tab).
    if (url.searchParams.get("scope") === "followups") {
      const taskRows = await fetchAllRows<{ lead_id: string | null }>((from, to) =>
        supabase
          .from("tasks")
          .select("lead_id")
          .eq("sales_user_id", salesUser.id)
          .eq("status", "open")
          .range(from, to),
      );
      const leadIds = [
        ...new Set(taskRows.map((t) => t.lead_id).filter(Boolean)),
      ] as string[];
      if (leadIds.length === 0) {
        return successWithPagination([], createPaginationMeta(page, limit, 0));
      }
      query = query.in("id", leadIds);
    }

    if (status && status !== "all") query = query.eq("status", status);

    const service = url.searchParams.get("service");
    if (service && service !== "all")
      query = query.eq("matched_service", service);

    const industry = url.searchParams.get("industry");
    if (industry && industry !== "all") query = query.eq("industry", industry);

    const source = url.searchParams.get("source");
    if (source) query = query.eq("source", source);

    // Lead origin: infoshop directory vs the scraper (google/automation = any
    // non-infoshop source, including the unlabeled NULL ones).
    const origin = url.searchParams.get("origin");
    if (origin === "infoshop") query = query.eq("source", INFOSHOP_DOMAIN);
    else if (origin === "google")
      query = query.or(`source.is.null,source.neq.${INFOSHOP_DOMAIN}`);

    const infoshopLike = `%${INFOSHOP_DOMAIN}%`;
    const hasWebsite = url.searchParams.get("has_website");
    if (hasWebsite === "yes") {
      query = query
        .not("website", "is", null)
        .not("website", "ilike", infoshopLike);
    } else if (hasWebsite === "no") {
      query = query.or(`website.is.null,website.ilike.${infoshopLike}`);
    }

    // "Has source" = a real research handle: website, Facebook, or non-infoshop
    // source_url (e.g. Google Maps). Mirrors admin's has_any_source — the old
    // version filtered the `source` text column ('infoshop.ge'/'manual'), which
    // matched ~every lead.
    const hasSource = url.searchParams.get("has_source");
    if (hasSource === "yes") {
      query = query.or(
        `and(website.not.is.null,website.not.ilike.${infoshopLike}),facebook_url.not.is.null,and(source_url.not.is.null,source_url.not.ilike.${infoshopLike})`,
      );
    } else if (hasSource === "no") {
      query = query
        .or(`website.is.null,website.ilike.${infoshopLike}`)
        .is("facebook_url", null)
        .or(`source_url.is.null,source_url.ilike.${infoshopLike}`);
    }

    const includePrefixes = parsePhonePrefixes(
      url.searchParams.get("phone_prefix"),
    );
    if (includePrefixes.length === 1) {
      query = query.ilike("phone", `${includePrefixes[0]}%`);
    } else if (includePrefixes.length > 1) {
      query = query.or(
        includePrefixes.map((p) => `phone.ilike.${p}%`).join(","),
      );
    }

    const excludePrefixes = parsePhonePrefixes(
      url.searchParams.get("exclude_phone_prefix"),
    );
    if (excludePrefixes.length === 1) {
      query = query.or(`phone.is.null,phone.not.ilike.${excludePrefixes[0]}%`);
    } else if (excludePrefixes.length > 1) {
      const andClause = excludePrefixes
        .map((p) => `phone.not.ilike.${p}%`)
        .join(",");
      query = query.or(`phone.is.null,and(${andClause})`);
    }

    if (search) {
      const sanitized = search.replace(/[%_,()]/g, "").slice(0, 100);
      if (sanitized.length > 0) {
        query = query.or(
          `name.ilike.%${sanitized}%,email.ilike.%${sanitized}%,company.ilike.%${sanitized}%`,
        );
      }
    }

    const {
      data,
      error: dbError,
      count,
    } = await query.range(offset, offset + limit - 1);

    if (dbError) {
      logger.error("Failed to fetch leads", {
        error: dbError.message,
        userId: salesUser.id,
      });
      return error("Failed to fetch leads");
    }

    return successWithPagination(
      data || [],
      createPaginationMeta(page, limit, count),
    );
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error("Unexpected error in GET /api/sales/leads", {
      error: String(err),
    });
    return error("Internal server error");
  }
}

export async function POST(request: Request) {
  try {
    const { salesUser } = await requireSalesAuth();
    const body = await request.json();

    const result = createLeadSchema.safeParse(body);
    if (!result.success) return validationError(result.error);

    const validated = result.data;

    // Service-role client (RLS-bypassing), consistent with the GET + every other
    // sales lead route — the user-session client tripped RLS on the lead
    // triggers (status history), which blocked salespeople from creating leads.
    const supabase = createAdminClient();
    const { data, error: dbError } = await supabase
      .from("leads")
      .insert({
        sales_user_id: salesUser.id,
        name: validated.name,
        email: validated.email,
        phone: validated.phone,
        company: validated.company,
        status: validated.status,
        value: validated.value,
        source: validated.source,
        notes: validated.notes,
      })
      .select()
      .single();

    if (dbError) {
      logger.error("Failed to create lead", {
        error: dbError.message,
        userId: salesUser.id,
      });
      return error("Failed to create lead");
    }

    logger.audit("create", "leads", data.id, salesUser.id, {
      name: validated.name,
    });
    revalidatePath("/sales/leads");
    revalidatePath("/sales");

    // Auto-trigger personalized demo pipeline unless source signals bulk import.
    const sourceLower = (validated.source ?? "").toLowerCase();
    const skipDemo =
      sourceLower.includes("bulk") || sourceLower.includes("import");
    if (!skipDemo) {
      enqueueDemoJob({ lead_id: data.id, sales_user_id: salesUser.id })
        .then((r) => {
          if (!r.ok) {
            logger.error("Demo enqueue failed for new lead", {
              lead_id: data.id,
              error: r.error,
            });
          }
        })
        .catch((err) => {
          logger.error("Demo enqueue threw", {
            lead_id: data.id,
            error: err instanceof Error ? err.message : String(err),
          });
        });
    }

    return success(data, 201);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error("Unexpected error in POST /api/sales/leads", {
      error: String(err),
    });
    return error("Internal server error");
  }
}
