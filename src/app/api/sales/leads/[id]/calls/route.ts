import { requireSalesAuth, canAccessLead } from "@/lib/sales-auth";
import { createAdminClient } from "@/lib/supabase/admin";
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
      .select("sales_user_id")
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

    return success(data, 201);
  } catch (err) {
    return authErrorResponse(err);
  }
}
