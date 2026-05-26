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
      .order("relevance_score", { ascending: false })
      .order("created_at", { ascending: false });

    if (url.searchParams.get("scope") === "today") {
      const startOfDay = new Date();
      startOfDay.setUTCHours(0, 0, 0, 0);
      query = query.gte("assigned_at", startOfDay.toISOString());
    }

    if (status && status !== "all") query = query.eq("status", status);

    const service = url.searchParams.get("service");
    if (service && service !== "all")
      query = query.eq("matched_service", service);

    const industry = url.searchParams.get("industry");
    if (industry && industry !== "all") query = query.eq("industry", industry);

    const source = url.searchParams.get("source");
    if (source) query = query.eq("source", source);

    const infoshopLike = `%${INFOSHOP_DOMAIN}%`;
    const hasWebsite = url.searchParams.get("has_website");
    if (hasWebsite === "yes") {
      query = query
        .not("website", "is", null)
        .not("website", "ilike", infoshopLike);
    } else if (hasWebsite === "no") {
      query = query.or(`website.is.null,website.ilike.${infoshopLike}`);
    }

    const hasSource = url.searchParams.get("has_source");
    if (hasSource === "yes") query = query.not("source", "is", null);
    else if (hasSource === "no") query = query.is("source", null);

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
    const { supabase, salesUser } = await requireSalesAuth();
    const body = await request.json();

    const result = createLeadSchema.safeParse(body);
    if (!result.success) return validationError(result.error);

    const validated = result.data;

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
