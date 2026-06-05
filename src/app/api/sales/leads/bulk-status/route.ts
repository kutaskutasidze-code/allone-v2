import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSalesAuth } from "@/lib/sales-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AuthError } from "@/lib/auth";
import {
  success,
  error,
  validationError,
  unauthorized,
  forbidden,
} from "@/lib/api-response";
import { leadStatusSchema, lostReasonSchema } from "@/lib/validations/leads";
import { logger } from "@/lib/logger";

const bodySchema = z.object({
  leadIds: z.array(z.string().uuid()).min(1).max(500),
  status: leadStatusSchema,
  lost_reason: lostReasonSchema.optional(),
});

// Bulk status change for the sales portal. A salesperson may only touch leads
// they own; supervisors/admins may touch any. (Deletion stays single-lead +
// manager-only — reps never bulk-delete.)
export async function POST(request: Request) {
  try {
    const { salesUser } = await requireSalesAuth();

    const json = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) return validationError(parsed.error);
    const { leadIds, status, lost_reason } = parsed.data;

    const admin = createAdminClient();
    const canSeeAll =
      salesUser.role === "supervisor" || salesUser.role === "admin";

    // Reps may only act on their own leads — reject the whole batch if any of
    // the requested ids isn't theirs (mirrors the per-lead PUT's forbidden()).
    if (!canSeeAll) {
      const { data: owned, error: ownErr } = await admin
        .from("leads")
        .select("id")
        .in("id", leadIds)
        .eq("sales_user_id", salesUser.id);
      if (ownErr) {
        logger.error("sales bulk-status: ownership check failed", {
          error: ownErr.message,
        });
        return error("Failed to update leads");
      }
      if ((owned?.length ?? 0) !== leadIds.length) return forbidden();
    }

    const update: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };
    // Moving to 'lost' records the reason; anything else must CLEAR it, or the
    // leads_lost_reason_requires_lost CHECK rejects the update.
    if (status === "lost") update.lost_reason = lost_reason ?? null;
    else update.lost_reason = null;

    let query = admin
      .from("leads")
      .update(update, { count: "exact" })
      .in("id", leadIds);
    // Race guard: even if ownership shifted after the check, a rep only writes
    // their own rows.
    if (!canSeeAll) query = query.eq("sales_user_id", salesUser.id);

    const { error: dbError, count } = await query;
    if (dbError) {
      logger.error("Failed to bulk-update sales lead status", {
        error: dbError.message,
      });
      return error("Failed to update leads");
    }

    revalidatePath("/sales/leads");
    revalidatePath("/sales");

    logger.audit("bulk_status", "leads", leadIds.join(","), salesUser.email, {
      status,
      count: count ?? 0,
    });
    return success({ updated: count ?? 0 });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error("Unexpected error in POST /api/sales/leads/bulk-status", {
      error: String(err),
    });
    return error("Internal server error");
  }
}
