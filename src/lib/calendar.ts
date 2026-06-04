import type { SupabaseClient } from '@supabase/supabase-js';

export interface CalendarEvent {
  id: string;
  type: 'task' | 'meeting';
  title: string;
  at: string; // ISO — task due_at or meeting starts_at
  status: string;
  leadId: string;
  leadName: string | null;
}

interface LeadRef {
  name: string | null;
  company: string | null;
}

/**
 * Builds calendar events (open follow-up tasks by `due_at` + meetings by
 * `starts_at`) within [start, end). One read per source, scoped to a rep when
 * `salesUserId` is given. (tasks/meetings each have a single FK to leads, so the
 * `lead:leads(...)` embed is unambiguous.)
 */
export async function buildCalendar(
  admin: SupabaseClient,
  opts: { start: string; end: string; salesUserId?: string },
): Promise<{ events: CalendarEvent[] }> {
  let taskQ = admin
    .from('tasks')
    .select('id, title, due_at, status, lead_id, lead:leads(name, company)')
    .eq('status', 'open')
    .not('due_at', 'is', null)
    .gte('due_at', opts.start)
    .lt('due_at', opts.end);
  if (opts.salesUserId) taskQ = taskQ.eq('sales_user_id', opts.salesUserId);

  let meetQ = admin
    .from('meetings')
    .select('id, title, starts_at, status, lead_id, lead:leads(name, company)')
    .gte('starts_at', opts.start)
    .lt('starts_at', opts.end);
  if (opts.salesUserId) meetQ = meetQ.eq('sales_user_id', opts.salesUserId);

  const [taskRes, meetRes] = await Promise.all([taskQ, meetQ]);
  if (taskRes.error) throw new Error(taskRes.error.message);
  if (meetRes.error) throw new Error(meetRes.error.message);

  const nameOf = (lead: LeadRef | null) => lead?.company || lead?.name || null;
  const toEvent = (
    type: 'task' | 'meeting',
    r: { id: string; title: string; status: string; lead_id: string; lead: LeadRef | null },
    at: string,
  ): CalendarEvent => ({
    id: `${type}:${r.id}`,
    type,
    title: r.title,
    at,
    status: r.status,
    leadId: r.lead_id,
    leadName: nameOf(r.lead),
  });

  const taskRows = (taskRes.data ?? []) as unknown as Array<{
    id: string;
    title: string;
    due_at: string;
    status: string;
    lead_id: string;
    lead: LeadRef | null;
  }>;
  const meetRows = (meetRes.data ?? []) as unknown as Array<{
    id: string;
    title: string;
    starts_at: string;
    status: string;
    lead_id: string;
    lead: LeadRef | null;
  }>;

  const events: CalendarEvent[] = [
    ...taskRows.map((t) => toEvent('task', t, t.due_at)),
    ...meetRows.map((m) => toEvent('meeting', m, m.starts_at)),
  ];

  return { events };
}
