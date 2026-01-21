import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import VoiceAIContent from './VoiceAIContent';

async function getVoiceAgents() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/dashboard/voice');

  const { data: projects } = await supabase
    .from('user_products')
    .select('*')
    .eq('user_id', user.id)
    .eq('type', 'voice_agent')
    .neq('status', 'deleted')
    .order('created_at', { ascending: false });

  // Check subscription for limits
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('limits')
    .eq('user_id', user.id)
    .in('status', ['active', 'past_due'])
    .single();

  const limits = subscription?.limits || { voice_agents: 3 };

  return {
    projects: projects || [],
    limit: limits.voice_agents || 3,
  };
}

export default async function VoiceAIPage() {
  const data = await getVoiceAgents();
  return <VoiceAIContent {...data} />;
}
