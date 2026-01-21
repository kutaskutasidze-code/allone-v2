import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import RAGBotsContent from './RAGBotsContent';

async function getRAGBots() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/dashboard/rag');

  const { data: projects } = await supabase
    .from('user_products')
    .select('*')
    .eq('user_id', user.id)
    .eq('type', 'rag_bot')
    .neq('status', 'deleted')
    .order('created_at', { ascending: false });

  // Check subscription for limits
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('limits')
    .eq('user_id', user.id)
    .in('status', ['active', 'past_due'])
    .single();

  const limits = subscription?.limits || { rag_bots: 5 };

  return {
    projects: projects || [],
    limit: limits.rag_bots || 5,
  };
}

export default async function RAGBotsPage() {
  const data = await getRAGBots();
  return <RAGBotsContent {...data} />;
}
