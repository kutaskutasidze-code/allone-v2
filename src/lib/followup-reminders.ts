import type { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

export interface FollowupReminderSummary {
  due: number;
  notified: number;
  skipped: number;
  errors: number;
}

interface DueTaskRow {
  id: string;
  title: string | null;
  due_at: string | null;
  lead_id: string | null;
  sales_user_id: string | null;
  lead: { company: string | null; name: string | null } | null;
}

/**
 * Create in-app notifications for follow-up tasks whose due_at has passed and
 * that have not been reminded yet. For each: claim it (set reminded_at once)
 * and create an in-app notification for the owning rep — this drives the bell.
 * No email is sent. Idempotent: the reminded_at claim guarantees a task fires
 * at most once even if this runs concurrently or is retried.
 */
export async function runFollowupReminders(
  supabase: SupabaseClient,
  nowIso: string = new Date().toISOString(),
): Promise<FollowupReminderSummary> {
  const summary: FollowupReminderSummary = {
    due: 0,
    notified: 0,
    skipped: 0,
    errors: 0,
  };

  // Only remind for follow-ups that came due recently. Anything older than this
  // grace window is stale backlog — reminding it would surface the whole overdue
  // queue at once, which is never what we want. New follow-ups get reminded as
  // they come due (the cron runs every few minutes); the window only tolerates
  // cron downtime.
  const GRACE_MS = 12 * 60 * 60 * 1000; // 12h
  const graceIso = new Date(Date.parse(nowIso) - GRACE_MS).toISOString();

  const { data, error } = await supabase
    .from("tasks")
    .select(
      "id, title, due_at, lead_id, sales_user_id, lead:leads(company, name)",
    )
    .eq("status", "open")
    .lte("due_at", nowIso)
    .gte("due_at", graceIso)
    .is("reminded_at", null)
    .not("sales_user_id", "is", null)
    .order("due_at", { ascending: true })
    .limit(200);

  if (error) {
    logger.error("Follow-up reminders: query failed", { error: error.message });
    throw new Error(error.message);
  }

  const tasks = (data ?? []) as unknown as DueTaskRow[];
  summary.due = tasks.length;

  for (const task of tasks) {
    if (!task.sales_user_id) {
      summary.skipped++;
      continue;
    }

    // Claim the task: only proceed if we win the reminded_at race. This makes
    // the whole thing safe against overlapping runs / retries.
    const { data: claimed, error: claimError } = await supabase
      .from("tasks")
      .update({ reminded_at: nowIso })
      .eq("id", task.id)
      .is("reminded_at", null)
      .select("id");

    if (claimError) {
      logger.error("Follow-up reminders: claim failed", {
        error: claimError.message,
        resourceId: task.id,
      });
      summary.errors++;
      continue;
    }
    if (!claimed || claimed.length === 0) {
      // Another run already claimed it.
      summary.skipped++;
      continue;
    }

    const leadLabel =
      task.lead?.company?.trim() || task.lead?.name?.trim() || "a lead";
    const taskTitle = task.title?.trim() || "Follow up";
    const href = task.lead_id ? `/sales/leads/${task.lead_id}` : "/sales/follow-ups";

    // In-app notification only (drives the bell). No email.
    const { error: notifyError } = await supabase.from("notifications").insert({
      sales_user_id: task.sales_user_id,
      type: "followup_due",
      title: `Time to follow up: ${leadLabel}`,
      body: taskTitle,
      lead_id: task.lead_id,
      href,
    });
    if (notifyError) {
      logger.error("Follow-up reminders: notification insert failed", {
        error: notifyError.message,
        resourceId: task.id,
      });
      summary.errors++;
    } else {
      summary.notified++;
    }
  }

  return summary;
}
