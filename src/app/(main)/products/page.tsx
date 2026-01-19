import { createClient } from '@/lib/supabase/server';
import { Metadata } from 'next';
import ProductsContent from './ProductsContent';

export const metadata: Metadata = {
  title: 'Templates & Resources | ALLONE - AI Automation',
  description: 'Ready-to-use automation templates, workflows, and courses for your business.',
};

async function getProducts() {
  const supabase = await createClient();

  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_published', true)
    .order('is_featured', { ascending: false })
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  return products || [];
}

export default async function ProductsPage() {
  const products = await getProducts();

  return <ProductsContent products={products} />;
}
