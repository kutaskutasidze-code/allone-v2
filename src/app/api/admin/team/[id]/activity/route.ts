import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/sales-auth';
import { AuthError } from '@/lib/auth';
import { getPeriod, round2 } from '@/lib/commissions';
import { success, error, authErrorResponse, notFound } from '@/lib/api-response';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const CALL_OUTCOMES = [
  'connected',
  'no_answer',
  'voicemail',
  'busy',
  'wrong_number',
  'callback_requested',
  'not_interested',
] as const;

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(['admin', 'supervisor']);

    const { id } = await ctx.params;
    const period = getPeriod(request.nextUrl.searchParams.get('period') || 'month');
    const admin = createAdminClient();

    const { data: rep, error: repErr } = await admin
      .from('sales_users')
      .select('id, name, email, role, is_active, daily_target, industries')
      .eq('id', id)
      .maybeSingle();

    if (repErr) {
      logger.error('Failed to load rep for activity', { error: repErr.message, id });
      return error('Failed to load rep');
    }
    if (!rep) return notFound('Rep');

    const startIso = period.start.toISOString();
    const endIso = period.end.toISOString();

    // Today bucket (for "due today" tasks) — independent of the period range.
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);
    const nowIso = new Date().toISOString();
    const todayIso = startOfDay.toISOString();
    const tomorrowIso = endOfDay.toISOString();

    // Calls for this rep in the period — grouped by outcome in JS.
    const { data: periodCalls, error: callsErr } = await admin
      .from('calls')
      .select('outcome, occurred_at')
      .eq('sales_user_id', id)
      .gte('occurred_at', startIso)
      .lt('occurred_at', endIso);

    if (callsErr) {
      logger.error('Failed to load calls for rep activity', { error: callsErr.message, id });
      return error('Failed to load calls');
    }

    const byOutcome: Record<string, number> = {};
    for (const o of CALL_OUTCOMES) byOutcome[o] = 0;
    let callsTotal = 0;
    let callsToday = 0;
    for (const c of periodCalls || []) {
      callsTotal++;
      if (c.outcome in byOutcome) byOutcome[c.outcome]++;
      if (c.occurred_at >= todayIso && c.occurred_at < tomorrowIso) callsToday++;
    }
    const connectedCalls = byOutcome['connected'] || 0;

    // Tasks for this rep: open (due today / overdue / total open), plus
    // completed within the period.
    const { data: openTasks, error: openErr } = await admin
      .from('tasks')
      .select('due_at')
      .eq('sales_user_id', id)
      .eq('status', 'open');

    if (openErr) {
      logger.error('Failed to load open tasks for rep activity', { error: openErr.message, id });
      return error('Failed to load tasks');
    }

    let tasksOpen = 0;
    let tasksDueToday = 0;
    let tasksOverdue = 0;
    for (const t of openTasks || []) {
      tasksOpen++;
      if (!t.due_at) continue;
      if (t.due_at < nowIso) tasksOverdue++;
      if (t.due_at >= todayIso && t.due_at < tomorrowIso) tasksDueToday++;
    }

    const { count: tasksCompletedInPeriod } = await admin
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('sales_user_id', id)
      .eq('status', 'done')
      .gte('completed_at', startIso)
      .lt('completed_at', endIso);

    // Won leads in the period for conversion.
    const { data: wonLeads, error: wonErr } = await admin
      .from('leads')
      .select('value')
      .eq('sales_user_id', id)
      .eq('status', 'won')
      .gte('won_at', startIso)
      .lt('won_at', endIso);

    if (wonErr) {
      logger.error('Failed to load won leads for rep activity', { error: wonErr.message, id });
      return error('Failed to load won leads');
    }

    const wonCount = (wonLeads || []).length;
    const wonRevenue = (wonLeads || []).reduce((s, l) => s + Number(l.value || 0), 0);
    const conversionRate = connectedCalls > 0 ? wonCount / connectedCalls : 0;

    return success({
      rep: {
        id: rep.id,
        name: rep.name,
        email: rep.email,
        role: rep.role,
        isActive: rep.is_active ?? true,
        dailyTarget: rep.daily_target ?? 80,
        industries: rep.industries ?? [],
      },
      period: { start: startIso, end: endIso, label: period.label },
      calls: {
        total: callsTotal,
        today: callsToday,
        connected: connectedCalls,
        byOutcome,
      },
      tasks: {
        open: tasksOpen,
        dueToday: tasksDueToday,
        overdue: tasksOverdue,
        completedInPeriod: tasksCompletedInPeriod ?? 0,
      },
      results: {
        wonCount,
        wonRevenue: round2(wonRevenue),
        conversionRate: Math.round(conversionRate * 1000) / 1000,
      },
    });
  } catch (err) {
    if (err instanceof AuthError) return authErrorResponse(err);
    logger.error('Unexpected error in GET /api/admin/team/[id]/activity', { error: String(err) });
    return error('Internal server error');
  }
}
