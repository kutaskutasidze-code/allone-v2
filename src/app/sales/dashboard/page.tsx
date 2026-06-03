import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
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
async function getLeadStats(salesUserId: string) {
  const supabase = createAdminClient();
  const statuses = ['new', 'in_process', 'interested', 'won', 'lost'];

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

  const stats: Record<string, number> = {
    new: 0, in_process: 0, interested: 0, won: 0, lost: 0,
    pipelineValue: 0, wonValue: 0,
  };

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

  const [stats, recentLeads, todaysQueue, todaysCalls, overdueCallbacks] = await Promise.all([
    getLeadStats(salesUser.id),
    getRecentLeads(salesUser.id),
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
      dailyTarget={salesUser.daily_target ?? 80}
      overdueCallbacks={overdueCallbacks}
    />
  );
}
