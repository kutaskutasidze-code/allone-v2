import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

// Shared helper for the in-app notification bell (the `notifications` table).
// Until now the only writer was the follow-up reminder cron; these let event
// handlers (new bot response, auto-generated offer, …) notify the owning rep.

export interface NewNotification {
  salesUserId: string;
  type: string;
  title: string;
  body?: string | null;
  leadId?: string | null;
  href?: string | null;
}

/**
 * Insert one in-app notification. Best-effort: never throws — a notification
 * failure must not break the flow that triggered it. Returns whether it wrote.
 */
export async function notifySalesUser(
  n: NewNotification,
  db: SupabaseClient = createAdminClient(),
): Promise<boolean> {
  try {
    const { error } = await db.from("notifications").insert({
      sales_user_id: n.salesUserId,
      type: n.type,
      title: n.title,
      body: n.body ?? null,
      lead_id: n.leadId ?? null,
      href: n.href ?? null,
    });
    if (error) {
      logger.error("notifySalesUser: insert failed", { error: error.message });
      return false;
    }
    return true;
  } catch (err) {
    logger.error("notifySalesUser: threw", {
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

/**
 * Resolve the rep who owns a lead, plus a human label for it. `salesUserId` is
 * null when the lead is unassigned or missing — callers skip notifying then
 * (the notifications table requires a sales_user_id).
 */
export async function ownerForLead(
  leadId: string | null | undefined,
  db: SupabaseClient = createAdminClient(),
): Promise<{ salesUserId: string | null; label: string }> {
  if (!leadId) return { salesUserId: null, label: "" };
  try {
    const { data } = await db
      .from("leads")
      .select("sales_user_id, company, name")
      .eq("id", leadId)
      .maybeSingle();
    const label =
      (data?.company as string | null)?.trim() ||
      (data?.name as string | null)?.trim() ||
      "";
    return {
      salesUserId: (data?.sales_user_id as string | null) ?? null,
      label,
    };
  } catch (err) {
    logger.error("ownerForLead: lookup failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return { salesUserId: null, label: "" };
  }
}
