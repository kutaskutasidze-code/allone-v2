import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import ProductDetail from '@/components/dashboard/ProductDetail';

export default async function VoiceAgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login?redirect=/dashboard/voice');

  const { data: product } = await supabase
    .from('user_products')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!product) notFound();

  return <ProductDetail product={product} backHref="/dashboard/voice" backLabel="Voice AI" />;
}
