import { revalidatePath } from "next/cache";
import { requireSalesAuth, canAccessLead } from "@/lib/sales-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { tbilisiDayStart } from "@/lib/time";
import { teardownDemosForLead } from "@/lib/demo-pipeline-trigger";
import {
  success,
  successWithPagination,
  error,
  validationError,
  forbidden,
  notFound,
  authErrorResponse,
  getPaginationParams,
  createPaginationMeta,
} from "@/lib/api-response";
import { createCallSchema } from "@/lib/validations/activity";
import { idParamSchema } from "@/lib/validations";
import { logger } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { salesUser } = await requireSalesAuth();
    const { id } = await params;

    const idResult = idParamSchema.safeParse({ id });
    if (!idResult.success) return validationError(idResult.error);

    const { page, limit, offset } = getPaginationParams(request.url);

    const supabase = createAdminClient();

    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("sales_user_id")
      .eq("id", id)
      .single();

    if (leadError) {
      if (leadError.code === "PGRST116") return notFound("Lead");
      return error("Failed to fetch lead");
    }

    if (!canAccessLead(salesUser, lead)) return forbidden();

    const {
      data,
      error: dbError,
      count,
    } = await supabase
      .from("calls")
      .select("*", { count: "exact" })
      .eq("lead_id", id)
      .order("occurred_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (dbError) {
      logger.error("Failed to fetch calls", {
        error: dbError.message,
        userId: salesUser.id,
        resourceId: id,
      });
      return error("Failed to fetch calls");
    }

    return successWithPagination(
      data || [],
      createPaginationMeta(page, limit, count),
    );
  } catch (err) {
    return authErrorResponse(err);
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { salesUser } = await requireSalesAuth();
    const { id } = await params;
    const body = await request.json();

    const idResult = idParamSchema.safeParse({ id });
    if (!idResult.success) return validationError(idResult.error);

    const result = createCallSchema.safeParse(body);
    if (!result.success) return validationError(result.error);

    const supabase = createAdminClient();

    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("sales_user_id, status")
      .eq("id", id)
      .single();

    if (leadError) {
      if (leadError.code === "PGRST116") return notFound("Lead");
      return error("Failed to fetch lead");
    }

    if (!canAccessLead(salesUser, lead)) return forbidden();

    const validated = result.data;

    const { data, error: dbError } = await supabase
      .from("calls")
      .insert({
        lead_id: id,
        sales_user_id: salesUser.id,
        outcome: validated.outcome,
        disposition: validated.disposition ?? null,
        direction: validated.direction,
        duration_seconds: validated.duration_seconds ?? null,
        notes: validated.notes,
        ...(validated.occurred_at
          ? { occurred_at: validated.occurred_at }
          : {}),
      })
      .select()
      .single();

    if (dbError) {
      logger.error("Failed to create call", {
        error: dbError.message,
        userId: salesUser.id,
        resourceId: id,
      });
      return error("Failed to create call");
    }

    // Auto-sync the lead from a reached call. A "Contacted" call must never
    // leave a lead on 'New' — the disposition refines it further. Best-effort:
    // never fail the recorded call over this.
    if (validated.outcome === "contacted") {
      const status = lead.status as string;
      const now = new Date().toISOString();
      let newStatus: string | null = null;
      const extra: Record<string, unknown> = {};
      try {
        if (validated.disposition === "not_interested") {
          // Never overwrite a closed lead (won/lost).
          if (status !== "won" && status !== "lost") {
            newStatus = "lost";
            extra.lost_reason = "not_interested";
          }
        } else if (validated.disposition === "interested") {
          // Advance-only — never regress Proposal/On-hold/Won back to Interested.
          if (status === "new" || status === "in_process") newStatus = "interested";
        } else if (status === "new") {
          // Callback or no disposition: contact was made, so take it off 'New'.
          newStatus = "in_process";
        }

        // A callback always schedules a follow-up task for tomorrow 10:00 Tbilisi.
        if (validated.disposition === "callback_requested") {
          const due = new Date(
            tbilisiDayStart().getTime() + 24 * 3600_000 + 10 * 3600_000,
          );
          await supabase.from("tasks").insert({
            lead_id: id,
            sales_user_id: salesUser.id,
            title: "Callback",
            due_at: due.toISOString(),
          });
        }

        if (newStatus) {
          await supabase
            .from("leads")
            .update({ status: newStatus, ...extra, updated_at: now })
            .eq("id", id);
          // Mirror the per-lead PUT: entering 'lost' tears down any live demo.
          if (newStatus === "lost") teardownDemosForLead(id).catch(() => {});
          // A status change must refresh cached views.
          revalidatePath("/sales/leads");
          revalidatePath("/sales");
        }
      } catch (syncErr) {
        logger.error("Lead auto-sync from call disposition failed", {
          error: syncErr instanceof Error ? syncErr.message : String(syncErr),
          resourceId: id,
          disposition: validated.disposition,
        });
      }
    }

    return success(data, 201);
  } catch (err) {
    return authErrorResponse(err);
  }
}
