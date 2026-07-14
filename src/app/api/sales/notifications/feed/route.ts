import { requireSalesAuth } from "@/lib/sales-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { success, error, authErrorResponse } from "@/lib/api-response";
import { logger } from "@/lib/logger";

// GET /api/sales/notifications/feed — the signed-in rep's recent notifications
// plus their unread count (drives the header bell).
export async function GET() {
  try {
    const { salesUser } = await requireSalesAuth();
    const supabase = createAdminClient();

    const [{ data, error: listError }, { count, error: countError }] =
      await Promise.all([
        supabase
          .from("notifications")
          .select("id, type, title, body, href, read_at, created_at")
          .eq("sales_user_id", salesUser.id)
          .order("created_at", { ascending: false })
          .limit(30),
        supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("sales_user_id", salesUser.id)
          .is("read_at", null),
      ]);

    if (listError || countError) {
      logger.error("Failed to fetch notifications", {
        error: (listError || countError)?.message,
        userId: salesUser.id,
      });
      return error("Failed to fetch notifications");
    }

    const items = (data ?? []).map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body ?? "",
      at: n.created_at,
      unread: n.read_at === null,
      href: n.href ?? undefined,
      kind: n.type === "followup_due" ? "followup" : "system",
    }));

    return success({ items, unread: count ?? 0 });
  } catch (err) {
    return authErrorResponse(err);
  }
}

// POST /api/sales/notifications/feed — mark notifications read.
//   body { all: true }  → mark every unread one read
//   body { id: "<uuid>" } → mark one read
export async function POST(request: Request) {
  try {
    const { salesUser } = await requireSalesAuth();
    const body = await request.json().catch(() => ({}));
    const supabase = createAdminClient();
    const nowIso = new Date().toISOString();

    let query = supabase
      .from("notifications")
      .update({ read_at: nowIso })
      .eq("sales_user_id", salesUser.id)
      .is("read_at", null);

    if (body?.all !== true) {
      if (typeof body?.id !== "string") {
        return error("Provide { all: true } or { id }", 400);
      }
      query = query.eq("id", body.id);
    }

    const { error: updateError } = await query;
    if (updateError) {
      logger.error("Failed to mark notifications read", {
        error: updateError.message,
        userId: salesUser.id,
      });
      return error("Failed to update notifications");
    }

    return success({ ok: true });
  } catch (err) {
    return authErrorResponse(err);
  }
}
