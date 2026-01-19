import { createClient } from '@/lib/supabase/server';
import { Metadata } from 'next';
import ProductsPage from './ProductsPage';

export const metadata: Metadata = {
  title: 'AI Products | ALLONE - Build Voice AI, RAG Chatbots & Automations',
  description: 'Create AI-powered products without code. Build voice assistants, knowledge chatbots, and automation bots with our AI platform.',
};

async function getSubscriptionStatus() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { isAuthenticated: false, hasSubscription: false, subscription: null, projects: [] };
  }

  // Check for active subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['active', 'past_due'])
    .single();

  // Get user's projects
  const { data: projects } = await supabase
    .from('user_projects')
    .select('*')
    .eq('user_id', user.id)
    .neq('status', 'deleted')
    .order('created_at', { ascending: false });

  return {
    isAuthenticated: true,
    hasSubscription: !!subscription,
    subscription,
    projects: projects || [],
  };
}

export default async function Page() {
  const status = await getSubscriptionStatus();

  return <ProductsPage {...status} />;
}
