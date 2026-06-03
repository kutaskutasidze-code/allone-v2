import { requireSalesAuth } from "@/lib/sales-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  success,
  error,
  validationError,
  forbidden,
  notFound,
  authErrorResponse,
} from "@/lib/api-response";
import { updateTaskSchema } from "@/lib/validations/activity";
import { idParamSchema } from "@/lib/validations";
import { logger } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { salesUser } = await requireSalesAuth();
    const { id } = await params;
    const body = await request.json();

    const idResult = idParamSchema.safeParse({ id });
    if (!idResult.success) return validationError(idResult.error);

    const result = updateTaskSchema.safeParse(body);
    if (!result.success) return validationError(result.error);

    const supabase = createAdminClient();

    const { data: existingTask, error: fetchError } = await supabase
      .from("tasks")
      .select("sales_user_id")
      .eq("id", id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") return notFound("Task");
      return error("Failed to fetch task");
    }

    const canSeeAll =
      salesUser.role === "supervisor" || salesUser.role === "admin";
    if (!canSeeAll && existingTask.sales_user_id !== salesUser.id)
      return forbidden();

    const validated = result.data;
    const updateData: Record<string, unknown> = {};

    if (validated.title !== undefined) updateData.title = validated.title;
    if (validated.due_at !== undefined) updateData.due_at = validated.due_at;
    if (validated.status !== undefined) updateData.status = validated.status;
    if (validated.notes !== undefined) updateData.notes = validated.notes;

    const { data, error: dbError } = await supabase
      .from("tasks")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (dbError) {
      logger.error("Failed to update task", {
        error: dbError.message,
        userId: salesUser.id,
        resourceId: id,
      });
      return error("Failed to update task");
    }

    return success(data);
  } catch (err) {
    return authErrorResponse(err);
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { salesUser } = await requireSalesAuth();
    const { id } = await params;

    const idResult = idParamSchema.safeParse({ id });
    if (!idResult.success) return validationError(idResult.error);

    const supabase = createAdminClient();

    const { data: existingTask, error: fetchError } = await supabase
      .from("tasks")
      .select("sales_user_id")
      .eq("id", id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") return notFound("Task");
      return error("Failed to fetch task");
    }

    const canSeeAll =
      salesUser.role === "supervisor" || salesUser.role === "admin";
    if (!canSeeAll && existingTask.sales_user_id !== salesUser.id)
      return forbidden();

    const { error: dbError } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id);

    if (dbError) {
      logger.error("Failed to delete task", {
        error: dbError.message,
        userId: salesUser.id,
        resourceId: id,
      });
      return error("Failed to delete task");
    }

    return success({ id });
  } catch (err) {
    return authErrorResponse(err);
  }
}
