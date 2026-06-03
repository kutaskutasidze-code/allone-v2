import { requireSalesAuth } from "@/lib/sales-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  error,
  validationError,
  forbidden,
  notFound,
  authErrorResponse,
  successWithPagination,
  getPaginationParams,
  createPaginationMeta,
} from "@/lib/api-response";
import { idParamSchema } from "@/lib/validations";
import { buildLeadStream } from "@/lib/lead-stream";

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

    const canSeeAll =
      salesUser.role === "supervisor" || salesUser.role === "admin";
    const isOwn = lead.sales_user_id === salesUser.id;
    const isUnassigned = !lead.sales_user_id;
    if (!canSeeAll && !isOwn && !isUnassigned) return forbidden();

    const { events, total } = await buildLeadStream(supabase, id, {
      limit,
      offset,
    });

    return successWithPagination(events, createPaginationMeta(page, limit, total));
  } catch (err) {
    return authErrorResponse(err);
  }
}
