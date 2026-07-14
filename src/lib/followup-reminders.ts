import type { SupabaseClient } from "@supabase/supabase-js";
import { sendFollowupReminderEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

export interface FollowupReminderSummary {
  due: number;
  notified: number;
  emailed: number;
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
  rep: { name: string | null; email: string | null } | null;
}

/**
 * Deliver follow-up reminders for tasks whose due_at has passed and that have
 * not been reminded yet. For each: claim it (set reminded_at once), create an
 * in-app notification for the owning rep, and email them. Idempotent — the
 * reminded_at claim guarantees a task fires at most once even if this runs
 * concurrently or is retried.
 */
export async function runFollowupReminders(
  supabase: SupabaseClient,
  nowIso: string = new Date().toISOString(),
): Promise<FollowupReminderSummary> {
  const summary: FollowupReminderSummary = {
    due: 0,
    notified: 0,
    emailed: 0,
    skipped: 0,
    errors: 0,
  };

  const { data, error } = await supabase
    .from("tasks")
    .select(
      "id, title, due_at, lead_id, sales_user_id, lead:leads(company, name), rep:sales_users(name, email)",
    )
    .eq("status", "open")
    .lte("due_at", nowIso)
    .is("reminded_at", null)
    .not("due_at", "is", null)
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

    // In-app notification (drives the bell). Best-effort per task.
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

    // Email the rep at their own inbox. Never let a send failure abort the batch.
    if (task.rep?.email) {
      try {
        await sendFollowupReminderEmail({
          to: task.rep.email,
          repName: task.rep.name,
          leadLabel,
          taskTitle,
          dueAt: task.due_at,
          leadUrl: href,
        });
        summary.emailed++;
      } catch (err) {
        logger.error("Follow-up reminders: email failed", {
          error: err instanceof Error ? err.message : String(err),
          resourceId: task.id,
        });
        summary.errors++;
      }
    }
  }

  return summary;
}
