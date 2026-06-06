import { z } from "zod";
import { requireSalesAuth, canAccessLead } from "@/lib/sales-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  success,
  error,
  validationError,
  forbidden,
  notFound,
  authErrorResponse,
} from "@/lib/api-response";
import { updatePaymentSchema } from "@/lib/validations/payments";
import { logger } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ id: string; paymentId: string }>;
}

const paramsSchema = z.object({
  id: z.string().uuid("Invalid ID format"),
  paymentId: z.string().uuid("Invalid ID format"),
});

// Access is decided by the PARENT lead (managers any, rep their own); mutations
// are scoped to (paymentId AND lead_id) so a payment can't be touched via the
// wrong lead.
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { salesUser } = await requireSalesAuth();
    const { id, paymentId } = await params;

    const p = paramsSchema.safeParse({ id, paymentId });
    if (!p.success) return validationError(p.error);

    const result = updatePaymentSchema.safeParse(await request.json());
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

    const v = result.data;
    const updateData: Record<string, unknown> = {};
    if (v.amount !== undefined) updateData.amount = v.amount;
    if (v.due_date !== undefined) updateData.due_date = v.due_date;
    if (v.label !== undefined) updateData.label = v.label;
    if (v.note !== undefined) updateData.note = v.note;
    if (v.paid !== undefined)
      updateData.paid_at = v.paid ? new Date().toISOString() : null;

    const { data, error: dbError } = await supabase
      .from("lead_payments")
      .update(updateData)
      .eq("id", paymentId)
      .eq("lead_id", id)
      .select()
      .maybeSingle();

    if (dbError) {
      logger.error("Failed to update payment", {
        error: dbError.message,
        userId: salesUser.id,
        resourceId: paymentId,
      });
      return error("Failed to update payment");
    }
    if (!data) return notFound("Payment");

    return success(data);
  } catch (err) {
    return authErrorResponse(err);
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { salesUser } = await requireSalesAuth();
    const { id, paymentId } = await params;

    const p = paramsSchema.safeParse({ id, paymentId });
    if (!p.success) return validationError(p.error);

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

    const { error: dbError } = await supabase
      .from("lead_payments")
      .delete()
      .eq("id", paymentId)
      .eq("lead_id", id);

    if (dbError) {
      logger.error("Failed to delete payment", {
        error: dbError.message,
        userId: salesUser.id,
        resourceId: paymentId,
      });
      return error("Failed to delete payment");
    }

    return success({ id: paymentId });
  } catch (err) {
    return authErrorResponse(err);
  }
}
