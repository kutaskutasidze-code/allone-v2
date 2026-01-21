import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AIStudioContent from './AIStudioContent';

export const metadata = {
  title: 'AI Studio | Allone',
  description: 'Build AI ecosystems through conversation',
};

export default async function AIStudioPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/dashboard/studio');
  }

  // Fetch user's existing products
  const { data: products } = await supabase
    .from('user_products')
    .select('id, name, type, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  // Fetch user's profile with tier info
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, pricing_tiers(*)')
    .eq('id', user.id)
    .single();

  return (
    <AIStudioContent
      user={user}
      products={products || []}
      profile={profile}
    />
  );
}
