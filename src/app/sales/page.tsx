import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { SalesDashboardContent } from './SalesDashboardContent';

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
    .eq('email', user.email)
    .maybeSingle();

  if (!salesUser) {
    redirect('/');
  }

  return salesUser;
}

// Returns this rep's own stats. Supervisors get the same view (their personal
// pipeline) — they can still drill into the team via /sales/team and /sales/leads?all=true.
async function getLeadStats(salesUserId: string, canSeeAll: boolean) {
  const supabase = createAdminClient();
  const statuses = ['new', 'contacted', 'qualified', 'won', 'lost'];

  const scope = <T extends ReturnType<typeof supabase.from>>(q: T) =>
    canSeeAll ? q : q.eq('sales_user_id', salesUserId);

  const results = await Promise.all(
    statuses.map(s =>
      scope(supabase.from('leads').select('id', { count: 'exact', head: true })).eq('status', s)
    )
  );

  const { data: pipelineData } = await scope(supabase.from('leads').select('value'))
    .in('status', ['contacted', 'qualified']);

  const { data: wonData } = await scope(supabase.from('leads').select('value'))
    .eq('status', 'won');

  const stats: Record<string, number> = {
    new: 0, contacted: 0, qualified: 0, won: 0, lost: 0,
    pipelineValue: 0, wonValue: 0,
  };

  statuses.forEach((s, i) => { stats[s] = results[i].count || 0; });
  stats.pipelineValue = (pipelineData || []).reduce((sum, l) => sum + (l.value || 0), 0);
  stats.wonValue = (wonData || []).reduce((sum, l) => sum + (l.value || 0), 0);

  return stats;
}

async function getRecentLeads(salesUserId: string, canSeeAll: boolean) {
  const supabase = createAdminClient();

  let query = supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(5);
  if (!canSeeAll) query = query.eq('sales_user_id', salesUserId);

  const { data: leads } = await query;
  return leads || [];
}

// Today's queue: leads assigned to this rep today.
async function getTodaysQueueCount(salesUserId: string) {
  const supabase = createAdminClient();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

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
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const { count } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('sales_user_id', salesUserId)
    .neq('status', 'new')
    .gte('status_changed_at', today.toISOString());

  return count || 0;
}

async function getOverdueCallbacks() {
  // callback_date column will be added via Supabase dashboard
  // For now return empty to avoid errors
  return [];
}

export default async function SalesDashboard() {
  const salesUser = await getSalesUser();
  const canSeeAll = salesUser.role === 'supervisor' || salesUser.role === 'admin';

  const [stats, recentLeads, todaysQueue, todaysCalls, overdueCallbacks] = await Promise.all([
    getLeadStats(salesUser.id, false),       // personal stats always (own pipeline)
    getRecentLeads(salesUser.id, canSeeAll), // supervisors see team recents
    getTodaysQueueCount(salesUser.id),
    getTodaysCallsByMe(salesUser.id),
    getOverdueCallbacks(),
  ]);

  return (
    <SalesDashboardContent
      salesUser={salesUser}
      stats={stats}
      recentLeads={recentLeads}
      todaysCalls={todaysCalls}
      todaysQueue={todaysQueue}
      overdueCallbacks={overdueCallbacks}
    />
  );
}
