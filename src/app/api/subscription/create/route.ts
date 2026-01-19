import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_API_BASE = process.env.NODE_ENV === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

// ALLONE AI Platform subscription plan
const PLAN_PRICE = '100.00';
const PLAN_NAME = 'ALLONE AI Platform';
const PLAN_DESCRIPTION = 'Access to Voice AI, RAG Chatbots, and Automation builders';

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

  const data = await response.json();
  return data.access_token;
}

// Create or get existing PayPal product
async function getOrCreateProduct(accessToken: string) {
  // Check if we have a stored product ID
  const adminClient = createAdminClient();
  const { data: setting } = await adminClient
    .from('contact_info')
    .select('*')
    .limit(1)
    .single();

  // For simplicity, store PayPal product ID in a metadata field or create new each time
  // In production, you'd store this in a settings table

  // Create product
  const productResponse = await fetch(`${PAYPAL_API_BASE}/v1/catalogs/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      name: PLAN_NAME,
      description: PLAN_DESCRIPTION,
      type: 'SERVICE',
      category: 'SOFTWARE',
    }),
  });

  const product = await productResponse.json();
  return product.id;
}

// Create or get existing billing plan
async function getOrCreatePlan(accessToken: string, productId: string) {
  const planResponse = await fetch(`${PAYPAL_API_BASE}/v1/billing/plans`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      product_id: productId,
      name: `${PLAN_NAME} - Monthly`,
      description: PLAN_DESCRIPTION,
      billing_cycles: [
        {
          frequency: {
            interval_unit: 'MONTH',
            interval_count: 1,
          },
          tenure_type: 'REGULAR',
          sequence: 1,
          total_cycles: 0, // Infinite
          pricing_scheme: {
            fixed_price: {
              value: PLAN_PRICE,
              currency_code: 'USD',
            },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee: {
          value: '0',
          currency_code: 'USD',
        },
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 3,
      },
    }),
  });

  const plan = await planResponse.json();
  return plan.id;
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if user already has an active subscription
    const adminClient = createAdminClient();
    const { data: existingSubscription } = await adminClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (existingSubscription) {
      return NextResponse.json({ error: 'Already subscribed' }, { status: 400 });
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Get or create product and plan
    const productId = await getOrCreateProduct(accessToken);
    const planId = await getOrCreatePlan(accessToken, productId);

    // Create subscription
    const origin = request.headers.get('origin') || 'https://allone.ge';
    const subscriptionResponse = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        plan_id: planId,
        subscriber: {
          email_address: user.email,
        },
        application_context: {
          brand_name: 'ALLONE',
          locale: 'en-US',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'SUBSCRIBE_NOW',
          return_url: `${origin}/api/subscription/activate?user_id=${user.id}`,
          cancel_url: `${origin}/products?cancelled=true`,
        },
      }),
    });

    const subscription = await subscriptionResponse.json();

    if (!subscriptionResponse.ok) {
      console.error('PayPal subscription creation failed:', subscription);
      return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
    }

    // Find approval URL
    const approvalUrl = subscription.links?.find(
      (link: { rel: string; href: string }) => link.rel === 'approve'
    )?.href;

    // Store pending subscription
    await adminClient.from('subscriptions').insert({
      user_id: user.id,
      plan: 'platform',
      paypal_subscription_id: subscription.id,
      status: 'pending',
      limits: { voice_agents: 3, rag_bots: 5, automations: 10 },
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
      approvalUrl,
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
