import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { buildPipeline } from '@/lib/pipeline';
import { weightedForecast } from '@/lib/forecasting';
import { tbilisiDayStart } from '@/lib/time';
import { SalesDashboardContent } from '../SalesDashboardContent';

async function getSalesUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect('/sales/login');
  }

  const admin = createAdminClient();
  const { data: salesUser } = await admin
    .from('sales_users')
    .select('*')
    .eq('email', (user.email||'').toLowerCase())
    .maybeSingle();

  if (!salesUser) {
    redirect('/');
  }

  return salesUser;
}

// Every sales user — including supervisors/admins — only sees their own
// pipeline on /sales/*. Team-wide views live behind /admin.
//
// One GROUP BY round-trip via the sales_lead_stats RPC (see
// 20260709000001_sales_perf_functions.sql). Falls back to the previous
// per-status count fan-out if the function isn't present yet.
async function getLeadStats(salesUserId: string) {
  const supabase = createAdminClient();

  const stats: Record<string, number> = {
    new: 0, in_process: 0, interested: 0, proposal: 0, won: 0, lost: 0, on_hold: 0,
    pipelineValue: 0, wonValue: 0,
  };

  const { data: rows, error } = await supabase.rpc('sales_lead_stats', {
    p_uid: salesUserId,
  });

  if (error || !rows) {
    return getLeadStatsFanout(salesUserId, stats);
  }

  const PIPELINE = new Set(['in_process', 'interested', 'proposal']);
  for (const row of rows as Array<{ status: string; cnt: number; total_value: number }>) {
    if (row.status in stats) stats[row.status] = Number(row.cnt) || 0;
    const value = Number(row.total_value) || 0;
    if (PIPELINE.has(row.status)) stats.pipelineValue += value;
    if (row.status === 'won') stats.wonValue = value;
  }

  return stats;
}

// Fallback: the original per-status count fan-out (9 round-trips). Retained so
// the dashboard keeps working before the sales_lead_stats migration is applied.
async function getLeadStatsFanout(salesUserId: string, stats: Record<string, number>) {
  const supabase = createAdminClient();
  const statuses = ['new', 'in_process', 'interested', 'proposal', 'won', 'lost', 'on_hold'];

  const results = await Promise.all(
    statuses.map(s =>
      supabase.from('leads').select('id', { count: 'exact', head: true })
        .eq('sales_user_id', salesUserId)
        .eq('status', s)
    )
  );

  const { data: pipelineData } = await supabase.from('leads').select('value')
    .eq('sales_user_id', salesUserId)
    .in('status', ['in_process', 'interested', 'proposal']);

  const { data: wonData } = await supabase.from('leads').select('value')
    .eq('sales_user_id', salesUserId)
    .eq('status', 'won');

  statuses.forEach((s, i) => { stats[s] = results[i].count || 0; });
  stats.pipelineValue = (pipelineData || []).reduce((sum, l) => sum + (l.value || 0), 0);
  stats.wonValue = (wonData || []).reduce((sum, l) => sum + (l.value || 0), 0);

  return stats;
}

async function getRecentLeads(salesUserId: string) {
  const supabase = createAdminClient();
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .eq('sales_user_id', salesUserId)
    .order('created_at', { ascending: false })
    .limit(5);
  return leads || [];
}

// Today's queue: leads assigned to this rep today.
async function getTodaysQueueCount(salesUserId: string) {
  const supabase = createAdminClient();
  const today = tbilisiDayStart();

  const { count } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('sales_user_id', salesUserId)
    .gte('assigned_at', today.toISOString());

  return count || 0;
}

// Today's calls by this rep: leads they own whose status moved off 'new' since midnight.
async function getTodaysCallsByMe(salesUserId: string) {
  const supabase = createAdminClient();
  const today = tbilisiDayStart();

  const { count } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('sales_user_id', salesUserId)
    .neq('status', 'new')
    .gte('status_changed_at', today.toISOString());

  return count || 0;
}

// Open follow-up tasks for this rep: overdue (past due) and coming up today.
async function getFollowupCounts(salesUserId: string) {
  const supabase = createAdminClient();
  const now = new Date();
  const tomorrow = new Date(tbilisiDayStart().getTime() + 24 * 3600_000);

  const [overdueRes, dueTodayRes] = await Promise.all([
    supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('sales_user_id', salesUserId)
      .eq('status', 'open')
      .lt('due_at', now.toISOString()),
    supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('sales_user_id', salesUserId)
      .eq('status', 'open')
      .gte('due_at', now.toISOString())
      .lt('due_at', tomorrow.toISOString()),
  ]);

  return { overdue: overdueRes.count || 0, dueToday: dueTodayRes.count || 0 };
}

// Weighted "expected to close" for this rep's open pipeline (server-side).
async function getForecast(salesUserId: string) {
  const { stages } = await buildPipeline(createAdminClient(), { salesUserId });
  return weightedForecast(stages);
}

export default async function SalesDashboard() {
  const salesUser = await getSalesUser();

  const [stats, recentLeads, todaysQueue, todaysCalls, followups, forecast] =
    await Promise.all([
      getLeadStats(salesUser.id),
      getRecentLeads(salesUser.id),
      getTodaysQueueCount(salesUser.id),
      getTodaysCallsByMe(salesUser.id),
      getFollowupCounts(salesUser.id),
      getForecast(salesUser.id),
    ]);

  return (
    <SalesDashboardContent
      salesUser={salesUser}
      stats={stats}
      recentLeads={recentLeads}
      todaysCalls={todaysCalls}
      todaysQueue={todaysQueue}
      dailyTarget={salesUser.daily_target ?? 80}
      followups={followups}
      forecast={forecast}
    />
  );
}
