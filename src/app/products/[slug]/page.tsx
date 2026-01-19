import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import ProductDetailContent from './ProductDetailContent';

interface Props {
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string) {
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (error || !product) {
    return null;
  }

  return product;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return { title: 'Product Not Found | ALLONE' };
  }

  return {
    title: `${product.name} | ALLONE`,
    description: product.short_description || product.description,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  return <ProductDetailContent product={product} />;
}
