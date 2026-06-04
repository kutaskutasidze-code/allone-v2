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
import { createMeetingSchema } from "@/lib/validations/activity";
import { idParamSchema } from "@/lib/validations";
import { logger } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { salesUser } = await requireSalesAuth();
    const { id } = await params;
    const body = await request.json();

    const idResult = idParamSchema.safeParse({ id });
    if (!idResult.success) return validationError(idResult.error);

    const result = createMeetingSchema.safeParse(body);
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
      .from("meetings")
      .insert({
        lead_id: id,
        sales_user_id: salesUser.id,
        title: validated.title,
        starts_at: validated.starts_at,
        ends_at: validated.ends_at ?? null,
        location: validated.location,
        notes: validated.notes,
      })
      .select()
      .single();

    if (dbError) {
      logger.error("Failed to create meeting", {
        error: dbError.message,
        userId: salesUser.id,
        resourceId: id,
      });
      return error("Failed to create meeting");
    }

    return success(data, 201);
  } catch (err) {
    return authErrorResponse(err);
  }
}
