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

async function getLeadStats(salesUserId: string) {
  const supabase = await createClient();

  const { data: leads } = await supabase
    .from('leads')
    .select('status, value')
    .eq('sales_user_id', salesUserId);

  const stats = {
    new: 0,
    contacted: 0,
    qualified: 0,
    won: 0,
    lost: 0,
    pipelineValue: 0,
    wonValue: 0,
  };

  if (leads) {
    leads.forEach(lead => {
      stats[lead.status as keyof typeof stats]++;
      if (lead.status === 'qualified' || lead.status === 'contacted') {
        stats.pipelineValue += lead.value || 0;
      }
      if (lead.status === 'won') {
        stats.wonValue += lead.value || 0;
      }
    });
  }

  return stats;
}

async function getRecentLeads(salesUserId: string) {
  const supabase = await createClient();

  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .eq('sales_user_id', salesUserId)
    .order('created_at', { ascending: false })
    .limit(5);

  return leads || [];
}

export default async function SalesDashboard() {
  const salesUser = await getSalesUser();
  const [stats, recentLeads] = await Promise.all([
    getLeadStats(salesUser.id),
    getRecentLeads(salesUser.id),
  ]);

  return (
    <SalesDashboardContent
      salesUser={salesUser}
      stats={stats}
      recentLeads={recentLeads}
    />
  );
}
