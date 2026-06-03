import { requireSalesAuth } from "@/lib/sales-auth";
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
import { createTaskSchema } from "@/lib/validations/activity";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  try {
    const { salesUser } = await requireSalesAuth();
    const { page, limit, offset } = getPaginationParams(request.url);
    const url = new URL(request.url);

    const canSeeAll =
      salesUser.role === "supervisor" || salesUser.role === "admin";
    const wantsAll = canSeeAll && url.searchParams.get("all") === "1";

    const scope = url.searchParams.get("scope") || "all";
    const leadId = url.searchParams.get("lead_id");

    const supabase = createAdminClient();

    let query = supabase
      .from("tasks")
      .select("*", { count: "exact" })
      .order("due_at", { ascending: true, nullsFirst: false });

    if (!wantsAll) query = query.eq("sales_user_id", salesUser.id);

    if (leadId) query = query.eq("lead_id", leadId);

    const now = new Date().toISOString();

    if (scope === "due") {
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      query = query.eq("status", "open").lte("due_at", endOfToday.toISOString());
    } else if (scope === "overdue") {
      query = query.eq("status", "open").lt("due_at", now);
    } else if (scope === "open") {
      query = query.eq("status", "open");
    }

    const {
      data,
      error: dbError,
      count,
    } = await query.range(offset, offset + limit - 1);

    if (dbError) {
      logger.error("Failed to fetch tasks", {
        error: dbError.message,
        userId: salesUser.id,
      });
      return error("Failed to fetch tasks");
    }

    return successWithPagination(
      data || [],
      createPaginationMeta(page, limit, count),
    );
  } catch (err) {
    return authErrorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const { salesUser } = await requireSalesAuth();
    const body = await request.json();

    const result = createTaskSchema.safeParse(body);
    if (!result.success) return validationError(result.error);

    const validated = result.data;

    const supabase = createAdminClient();

    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("sales_user_id")
      .eq("id", validated.lead_id)
      .single();

    if (leadError) {
      if (leadError.code === "PGRST116") return notFound("Lead");
      return error("Failed to fetch lead");
    }

    const canSeeAll =
      salesUser.role === "supervisor" || salesUser.role === "admin";
    const isOwn = lead.sales_user_id === salesUser.id;
    const isUnassigned = !lead.sales_user_id;
    if (!canSeeAll && !isOwn && !isUnassigned) return forbidden();

    const { data, error: dbError } = await supabase
      .from("tasks")
      .insert({
        lead_id: validated.lead_id,
        sales_user_id: salesUser.id,
        title: validated.title,
        due_at: validated.due_at ?? null,
        notes: validated.notes,
      })
      .select()
      .single();

    if (dbError) {
      logger.error("Failed to create task", {
        error: dbError.message,
        userId: salesUser.id,
        resourceId: validated.lead_id,
      });
      return error("Failed to create task");
    }

    return success(data, 201);
  } catch (err) {
    return authErrorResponse(err);
  }
}
