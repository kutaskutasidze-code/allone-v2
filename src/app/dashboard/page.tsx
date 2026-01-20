import { createClient } from '@/lib/supabase/server';
import { Metadata } from 'next';
import DashboardContent from './DashboardContent';

export const metadata: Metadata = {
  title: 'Dashboard | ALLONE',
  description: 'Manage your purchases, subscriptions, and account settings.',
};

async function getDashboardData(userId: string) {
  const supabase = await createClient();

  // Get user's purchases
  const { data: purchases } = await supabase
    .from('purchases')
    .select('*, products(*)')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('purchased_at', { ascending: false })
    .limit(5);

  // Get user's subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  // Get counts
  const { count: purchaseCount } = await supabase
    .from('purchases')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'completed');

  return {
    purchases: purchases || [],
    subscription,
    stats: {
      totalPurchases: purchaseCount || 0,
      hasActiveSubscription: !!subscription,
    },
  };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const dashboardData = await getDashboardData(user.id);

  return <DashboardContent data={dashboardData} />;
}
