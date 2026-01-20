import { createClient } from '@/lib/supabase/server';
import { Metadata } from 'next';
import DashboardContent from './DashboardContent';

export const metadata: Metadata = {
  title: 'Home | ALLONE',
  description: 'Manage your AI products, subscriptions, and account settings.',
};

async function getDashboardData(userId: string) {
  const supabase = await createClient();

  // Get user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, company, avatar_url')
    .eq('id', userId)
    .single();

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

  // Get AI projects counts
  const [voiceAgents, ragBots, automations] = await Promise.all([
    supabase.from('voice_agents').select('id, name, status, created_at', { count: 'exact' }).eq('user_id', userId),
    supabase.from('rag_bots').select('id, name, status, created_at', { count: 'exact' }).eq('user_id', userId),
    supabase.from('automations').select('id, name, status, created_at', { count: 'exact' }).eq('user_id', userId),
  ]);

  // Get recent projects (combine and sort)
  const recentProjects = [
    ...(voiceAgents.data || []).map(p => ({ ...p, type: 'voice_agent' as const })),
    ...(ragBots.data || []).map(p => ({ ...p, type: 'rag_bot' as const })),
    ...(automations.data || []).map(p => ({ ...p, type: 'automation' as const })),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  // Get counts
  const { count: purchaseCount } = await supabase
    .from('purchases')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'completed');

  return {
    profile,
    purchases: purchases || [],
    subscription,
    projects: {
      voiceAgents: voiceAgents.count || 0,
      ragBots: ragBots.count || 0,
      automations: automations.count || 0,
      recent: recentProjects,
    },
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
