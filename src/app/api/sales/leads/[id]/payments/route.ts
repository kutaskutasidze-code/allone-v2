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
import { createPaymentsSchema } from "@/lib/validations/payments";
import { idParamSchema } from "@/lib/validations";
import { logger } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// List a lead's installments (owed + collected). A deal has only a handful,
// so this returns them all, ordered by due date.
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { salesUser } = await requireSalesAuth();
    const { id } = await params;

    const idResult = idParamSchema.safeParse({ id });
    if (!idResult.success) return validationError(idResult.error);

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

    const { data, error: dbError } = await supabase
      .from("lead_payments")
      .select("*")
      .eq("lead_id", id)
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });

    if (dbError) {
      logger.error("Failed to fetch payments", {
        error: dbError.message,
        userId: salesUser.id,
        resourceId: id,
      });
      return error("Failed to fetch payments");
    }

    return success(data || []);
  } catch (err) {
    return authErrorResponse(err);
  }
}

// Create one or more installments (single add, 30/70 split, or monthly plan).
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { salesUser } = await requireSalesAuth();
    const { id } = await params;
    const body = await request.json();

    const idResult = idParamSchema.safeParse({ id });
    if (!idResult.success) return validationError(idResult.error);

    const result = createPaymentsSchema.safeParse(body);
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

    const now = new Date().toISOString();
    const rows = result.data.installments.map((i) => ({
      lead_id: id,
      created_by: salesUser.id,
      amount: i.amount,
      due_date: i.due_date ?? null,
      label: i.label,
      note: i.note,
      paid_at: i.paid ? now : null,
    }));

    const { data, error: dbError } = await supabase
      .from("lead_payments")
      .insert(rows)
      .select();

    if (dbError) {
      logger.error("Failed to create payments", {
        error: dbError.message,
        userId: salesUser.id,
        resourceId: id,
      });
      return error("Failed to create payments");
    }

    return success(data, 201);
  } catch (err) {
    return authErrorResponse(err);
  }
}
