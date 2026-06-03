import type { SupabaseClient } from '@supabase/supabase-js';
import { LEAD_STATUS_LABELS } from '@/lib/validations/leads';
import { CALL_OUTCOME_LABELS } from '@/lib/validations/activity';

/**
 * A single normalized entry in a lead's unified activity timeline.
 * Several heterogeneous source tables (status history, calls, tasks, meetings,
 * emails, demos, the lead note) are each mapped to this shape, then merged and
 * sorted by `at` DESC. This is the data contract consumed by the Stream UI.
 */
export interface StreamEvent {
  id: string;
  kind: 'status' | 'call' | 'task' | 'meeting' | 'email' | 'demo' | 'note';
  at: string; // ISO timestamp
  actorId: string | null;
  actorName: string | null;
  title: string;
  detail?: string;
  meta?: Record<string, unknown>;
}

function statusLabel(s: string | null | undefined): string {
  if (!s) return '—';
  return LEAD_STATUS_LABELS[s] ?? s;
}

const MEETING_STATUS_LABELS: Record<string, string> = {
  scheduled: 'scheduled',
  held: 'held',
  no_show: 'no-show',
  cancelled: 'cancelled',
};

interface StatusRow {
  id: string;
  from_status: string | null;
  to_status: string;
  changed_at: string;
}

interface CallRow {
  id: string;
  sales_user_id: string | null;
  direction: string;
  outcome: string;
  duration_seconds: number | null;
  notes: string | null;
  occurred_at: string;
}

interface TaskRow {
  id: string;
  sales_user_id: string | null;
  title: string;
  due_at: string | null;
  status: string;
  completed_at: string | null;
  created_at: string;
  notes: string | null;
}

interface MeetingRow {
  id: string;
  sales_user_id: string | null;
  title: string;
  starts_at: string;
  status: string;
  notes: string | null;
}

interface EmailLogRow {
  id: string;
  status: string;
  subject: string | null;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  replied_at: string | null;
}

interface EmailDraftRow {
  id: string;
  sales_user_id: string | null;
  status: string;
  subject: string | null;
  created_at: string;
  sent_at: string | null;
}

interface DemoJobRow {
  id: string;
  sales_user_id: string | null;
  status: string;
  created_at: string;
  demo_url: string | null;
}

interface DemoEngagementRow {
  id: string;
  demo_job_id: string;
  event_type: string;
  occurred_at: string;
}

interface LeadRow {
  notes: string | null;
  updated_at: string;
}

/**
 * Tolerant fetch helper: returns rows, or [] if the source errors (e.g. a table
 * is missing in this environment). One bad source must not sink the whole stream.
 */
async function safeRows<T>(p: PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  try {
    const { data, error } = await p;
    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}

/**
 * Builds the unified, time-ordered activity stream for a single lead by querying
 * every event source, normalizing each row to a `StreamEvent`, merging, sorting
 * by `at` DESC, and paginating.
 *
 * @param admin a service-role Supabase client (RLS-bypassing)
 */
export async function buildLeadStream(
  admin: SupabaseClient,
  leadId: string,
  opts: { limit?: number; offset?: number } = {},
): Promise<{ events: StreamEvent[]; total: number }> {
  const limit = opts.limit ?? 50;
  const offset = opts.offset ?? 0;

  // --- Fetch every source for this lead in parallel (each tolerant of failure) ---
  const [
    statusRows,
    callRows,
    taskRows,
    meetingRows,
    emailLogRows,
    emailDraftRows,
    demoJobRows,
    leadRows,
  ] = await Promise.all([
    safeRows<StatusRow>(
      admin
        .from('lead_status_history')
        .select('id, from_status, to_status, changed_at')
        .eq('lead_id', leadId),
    ),
    safeRows<CallRow>(
      admin
        .from('calls')
        .select('id, sales_user_id, direction, outcome, duration_seconds, notes, occurred_at')
        .eq('lead_id', leadId),
    ),
    safeRows<TaskRow>(
      admin
        .from('tasks')
        .select('id, sales_user_id, title, due_at, status, completed_at, created_at, notes')
        .eq('lead_id', leadId),
    ),
    safeRows<MeetingRow>(
      admin
        .from('meetings')
        .select('id, sales_user_id, title, starts_at, status, notes')
        .eq('lead_id', leadId),
    ),
    safeRows<EmailLogRow>(
      admin
        .from('email_logs')
        .select('id, status, subject, sent_at, opened_at, clicked_at, replied_at')
        .eq('lead_id', leadId),
    ),
    safeRows<EmailDraftRow>(
      admin
        .from('email_drafts')
        .select('id, sales_user_id, status, subject, created_at, sent_at')
        .eq('lead_id', leadId),
    ),
    safeRows<DemoJobRow>(
      admin
        .from('demo_jobs')
        .select('id, sales_user_id, status, created_at, demo_url')
        .eq('lead_id', leadId),
    ),
    safeRows<LeadRow>(
      admin.from('leads').select('notes, updated_at').eq('id', leadId),
    ),
  ]);

  // Demo engagements are a 2nd hop off the lead's demo jobs.
  const demoJobIds = demoJobRows.map(d => d.id);
  const demoEngagementRows: DemoEngagementRow[] = demoJobIds.length
    ? await safeRows<DemoEngagementRow>(
        admin
          .from('demo_engagements')
          .select('id, demo_job_id, event_type, occurred_at')
          .in('demo_job_id', demoJobIds),
      )
    : [];

  const events: StreamEvent[] = [];

  // --- status transitions ---
  for (const r of statusRows) {
    events.push({
      id: `status:${r.id}`,
      kind: 'status',
      at: r.changed_at,
      actorId: null,
      actorName: null,
      title: r.from_status
        ? `Status: ${statusLabel(r.from_status)} → ${statusLabel(r.to_status)}`
        : `Status: ${statusLabel(r.to_status)}`,
      meta: { fromStatus: r.from_status, toStatus: r.to_status },
    });
  }

  // --- calls ---
  for (const r of callRows) {
    const outcome = CALL_OUTCOME_LABELS[r.outcome] ?? r.outcome;
    events.push({
      id: `call:${r.id}`,
      kind: 'call',
      at: r.occurred_at,
      actorId: r.sales_user_id,
      actorName: null,
      title: `Call — ${outcome}`,
      detail: r.notes ?? undefined,
      meta: {
        direction: r.direction,
        outcome: r.outcome,
        durationSeconds: r.duration_seconds,
      },
    });
  }

  // --- tasks: a "created" event always, plus a "completed" event when done ---
  for (const r of taskRows) {
    events.push({
      id: `task-created:${r.id}`,
      kind: 'task',
      at: r.created_at,
      actorId: r.sales_user_id,
      actorName: null,
      title: `Follow-up created: ${r.title}`,
      detail: r.notes ?? undefined,
      meta: { event: 'created', status: r.status, dueAt: r.due_at },
    });
    if (r.status === 'done' && r.completed_at) {
      events.push({
        id: `task-completed:${r.id}`,
        kind: 'task',
        at: r.completed_at,
        actorId: r.sales_user_id,
        actorName: null,
        title: `Follow-up completed: ${r.title}`,
        detail: r.notes ?? undefined,
        meta: { event: 'completed', status: r.status, dueAt: r.due_at },
      });
    }
  }

  // --- meetings ---
  for (const r of meetingRows) {
    const statusText = MEETING_STATUS_LABELS[r.status] ?? r.status;
    events.push({
      id: `meeting:${r.id}`,
      kind: 'meeting',
      at: r.starts_at,
      actorId: r.sales_user_id,
      actorName: null,
      title: `Meeting (${statusText}): ${r.title}`,
      detail: r.notes ?? undefined,
      meta: { status: r.status },
    });
  }

  // --- email logs: emit one event for the furthest milestone reached ---
  for (const r of emailLogRows) {
    let at: string | null = null;
    let label = 'Email sent';
    if (r.replied_at) {
      at = r.replied_at;
      label = 'Email replied';
    } else if (r.clicked_at) {
      at = r.clicked_at;
      label = 'Email clicked';
    } else if (r.opened_at) {
      at = r.opened_at;
      label = 'Email opened';
    } else if (r.sent_at) {
      at = r.sent_at;
      label = 'Email sent';
    }
    if (!at) continue; // queued/unsent — no timeline anchor yet
    events.push({
      id: `email-log:${r.id}`,
      kind: 'email',
      at,
      actorId: null,
      actorName: null,
      title: label,
      detail: r.subject ?? undefined,
      meta: { status: r.status, source: 'email_log' },
    });
  }

  // --- email drafts: drafted, and sent when applicable ---
  for (const r of emailDraftRows) {
    events.push({
      id: `email-draft:${r.id}`,
      kind: 'email',
      at: r.created_at,
      actorId: r.sales_user_id,
      actorName: null,
      title: 'Email drafted',
      detail: r.subject ?? undefined,
      meta: { status: r.status, source: 'email_draft' },
    });
    if (r.sent_at) {
      events.push({
        id: `email-draft-sent:${r.id}`,
        kind: 'email',
        at: r.sent_at,
        actorId: r.sales_user_id,
        actorName: null,
        title: 'Email sent',
        detail: r.subject ?? undefined,
        meta: { status: r.status, source: 'email_draft' },
      });
    }
  }

  // --- demo jobs (milestones) ---
  for (const r of demoJobRows) {
    const sent = r.status === 'sent';
    events.push({
      id: `demo-job:${r.id}`,
      kind: 'demo',
      at: r.created_at,
      actorId: r.sales_user_id,
      actorName: null,
      title: sent ? 'Demo sent' : 'Demo created',
      meta: { status: r.status, demoUrl: r.demo_url },
    });
  }

  // --- demo engagements (opens / views) ---
  const DEMO_EVENT_TITLES: Record<string, string> = {
    email_open: 'Demo email opened',
    demo_view: 'Demo viewed',
    admin_view: 'Demo admin viewed',
  };
  const demoJobActor = new Map(demoJobRows.map(d => [d.id, d.sales_user_id]));
  for (const r of demoEngagementRows) {
    events.push({
      id: `demo-engagement:${r.id}`,
      kind: 'demo',
      at: r.occurred_at,
      actorId: demoJobActor.get(r.demo_job_id) ?? null,
      actorName: null,
      title: DEMO_EVENT_TITLES[r.event_type] ?? `Demo ${r.event_type}`,
      meta: { eventType: r.event_type, demoJobId: r.demo_job_id },
    });
  }

  // --- lead note (single text field; timestamped at the lead's updated_at) ---
  const lead = leadRows[0];
  if (lead && lead.notes && lead.notes.trim()) {
    events.push({
      id: `note:${leadId}`,
      kind: 'note',
      at: lead.updated_at,
      actorId: null,
      actorName: null,
      title: 'Note',
      detail: lead.notes,
    });
  }

  // --- enrich actors: batch-fetch sales_users, map id → name (2-phase) ---
  const actorIds = Array.from(
    new Set(events.map(e => e.actorId).filter((x): x is string => !!x)),
  );
  if (actorIds.length) {
    const users = await safeRows<{ id: string; name: string }>(
      admin.from('sales_users').select('id, name').in('id', actorIds),
    );
    const userMap = new Map(users.map(u => [u.id, u.name]));
    for (const e of events) {
      if (e.actorId) e.actorName = userMap.get(e.actorId) ?? null;
    }
  }

  // --- merge: sort newest-first, then paginate ---
  events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  const total = events.length;
  const page = events.slice(offset, offset + limit);

  return { events: page, total };
}
