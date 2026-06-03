import { requireRole } from "@/lib/sales-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  validationError,
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
    await requireRole(["admin", "supervisor"]);
    const { id } = await params;

    const idResult = idParamSchema.safeParse({ id });
    if (!idResult.success) return validationError(idResult.error);

    const { page, limit, offset } = getPaginationParams(request.url);

    const supabase = createAdminClient();

    // Role grants access to every lead — no per-lead ownership filter.
    const { events, total } = await buildLeadStream(supabase, id, {
      limit,
      offset,
    });

    return successWithPagination(events, createPaginationMeta(page, limit, total));
  } catch (err) {
    return authErrorResponse(err);
  }
}
