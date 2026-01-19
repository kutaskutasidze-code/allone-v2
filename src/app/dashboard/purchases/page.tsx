import { createClient } from '@/lib/supabase/server';
import { Metadata } from 'next';
import PurchasesContent from './PurchasesContent';

export const metadata: Metadata = {
  title: 'My Purchases | ALLONE',
  description: 'View and download your purchased products.',
};

async function getPurchases(userId: string) {
  const supabase = await createClient();

  const { data: purchases, error } = await supabase
    .from('purchases')
    .select('*, products(*)')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('purchased_at', { ascending: false });

  if (error) {
    console.error('Error fetching purchases:', error);
    return [];
  }

  return purchases || [];
}

export default async function PurchasesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const purchases = await getPurchases(user.id);

  return <PurchasesContent purchases={purchases} />;
}
