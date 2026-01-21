import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AutomationsContent from './AutomationsContent';

async function getAutomations() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/dashboard/bots');

  const { data: projects } = await supabase
    .from('user_products')
    .select('*')
    .eq('user_id', user.id)
    .eq('type', 'automation')
    .neq('status', 'deleted')
    .order('created_at', { ascending: false });

  // Check subscription for limits
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('limits')
    .eq('user_id', user.id)
    .in('status', ['active', 'past_due'])
    .single();

  const limits = subscription?.limits || { automations: 10 };

  return {
    projects: projects || [],
    limit: limits.automations || 10,
  };
}

export default async function AutomationsPage() {
  const data = await getAutomations();
  return <AutomationsContent {...data} />;
}
