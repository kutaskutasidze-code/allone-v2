import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import BillingContent from './BillingContent';

export const metadata = {
  title: 'Billing - ALLONE',
  description: 'Manage your subscription and billing',
};

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/dashboard/billing');
  }

  // Get subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  // Get purchase history
  const { data: purchases } = await supabase
    .from('purchases')
    .select('*, products(name, slug, category)')
    .eq('user_id', user.id)
    .order('purchased_at', { ascending: false })
    .limit(10);

  return (
    <BillingContent
      subscription={subscription}
      purchases={purchases || []}
      userEmail={user.email || ''}
    />
  );
}
