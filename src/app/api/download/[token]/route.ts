import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface Props {
  params: Promise<{ token: string }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  const { token } = await params;

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();

    // Get purchase by download token
    const { data: purchase, error } = await supabase
      .from('purchases')
      .select('*, products(*)')
      .eq('download_token', token)
      .eq('status', 'completed')
      .single();

    if (error || !purchase) {
      return NextResponse.json({ error: 'Invalid or expired download link' }, { status: 404 });
    }

    const product = purchase.products;

    if (!product?.file_url) {
      return NextResponse.json({ error: 'No file available for this product' }, { status: 404 });
    }

    // Increment download count
    await supabase
      .from('purchases')
      .update({ download_count: (purchase.download_count || 0) + 1 })
      .eq('id', purchase.id);

    // Log download
    await supabase.from('download_logs').insert({
      purchase_id: purchase.id,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
    });

    // If file is in Supabase Storage, generate signed URL
    if (product.file_url.startsWith('products/') || product.file_url.startsWith('/products/')) {
      const { data: signedUrl, error: signError } = await supabase.storage
        .from('files')
        .createSignedUrl(product.file_url.replace(/^\//, ''), 3600); // 1 hour expiry

      if (signError || !signedUrl) {
        return NextResponse.json({ error: 'Failed to generate download link' }, { status: 500 });
      }

      return NextResponse.redirect(signedUrl.signedUrl);
    }

    // External URL - redirect directly
    return NextResponse.redirect(product.file_url);

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
