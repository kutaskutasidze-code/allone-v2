import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_API_BASE = process.env.NODE_ENV === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getPayPalAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${auth}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error(`PayPal auth failed: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

export async function POST(request: NextRequest) {
  try {
    const { productId, email } = await request.json();

    if (!productId || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get product from database
    const supabase = createAdminClient();
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL || 'https://allone.ge';

    // Create PayPal order
    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: productId,
          description: product.name,
          amount: {
            currency_code: product.currency || 'USD',
            value: product.price.toFixed(2),
          },
          custom_id: JSON.stringify({ email, productId }),
        },
      ],
      application_context: {
        brand_name: 'ALLONE',
        landing_page: 'LOGIN',
        user_action: 'PAY_NOW',
        return_url: `${siteOrigin}/api/checkout/paypal/capture`,
        cancel_url: `${siteOrigin}/products/${product.slug}?cancelled=true`,
      },
    };

    const orderResponse = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(orderPayload),
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.text();
      console.error('PayPal order creation failed:', errorData);
      return NextResponse.json({ error: 'Failed to create PayPal order' }, { status: 500 });
    }

    const orderData = await orderResponse.json();

    // Find approval URL
    const approvalUrl = orderData.links?.find(
      (link: { rel: string; href: string }) => link.rel === 'approve'
    )?.href;

    // Store pending purchase in database
    await supabase.from('purchases').insert({
      product_id: productId,
      email,
      paypal_order_id: orderData.id,
      amount: product.price,
      currency: product.currency || 'USD',
      status: 'pending',
    });

    return NextResponse.json({
      orderId: orderData.id,
      approvalUrl,
    });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
