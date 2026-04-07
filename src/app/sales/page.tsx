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

async function getLeadStats() {
  const supabase = createAdminClient();

  const statuses = ['new', 'contacted', 'qualified', 'won', 'lost'];
  const results = await Promise.all(
    statuses.map(s => supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', s))
  );

  const { data: pipelineData } = await supabase
    .from('leads')
    .select('value')
    .in('status', ['contacted', 'qualified']);

  const { data: wonData } = await supabase
    .from('leads')
    .select('value')
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

async function getRecentLeads() {
  const supabase = createAdminClient();

  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  return leads || [];
}

export default async function SalesDashboard() {
  const salesUser = await getSalesUser();
  const [stats, recentLeads] = await Promise.all([
    getLeadStats(),
    getRecentLeads(),
  ]);

  return (
    <SalesDashboardContent
      salesUser={salesUser}
      stats={stats}
      recentLeads={recentLeads}
    />
  );
}
