import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_API_BASE = process.env.NODE_ENV === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

// Subscription tiers configuration
const TIERS = {
  starter: {
    name: 'Starter',
    price: '29.00',
    description: 'Perfect for individuals and small projects',
    limits: { voice_agents: 5, rag_bots: 2, automations: 10, api_calls: 500 }
  },
  pro: {
    name: 'Pro',
    price: '99.00',
    description: 'For growing teams and businesses',
    limits: { voice_agents: 20, rag_bots: 10, automations: 50, api_calls: 2500 }
  },
  business: {
    name: 'Business',
    price: '299.00',
    description: 'Unlimited access for enterprises',
    limits: { voice_agents: -1, rag_bots: -1, automations: -1, api_calls: 10000 }
  }
} as const;

type TierKey = keyof typeof TIERS;

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

// Get or create PayPal product (only once)
async function getOrCreateProduct(accessToken: string, adminClient: ReturnType<typeof createAdminClient>) {
  // Check if we have stored product ID
  const { data: config } = await adminClient
    .from('contact_info')
    .select('id, paypal_product_id')
    .single();

  if (config?.paypal_product_id) {
    return config.paypal_product_id;
  }

  // Create new product
  const response = await fetch(`${PAYPAL_API_BASE}/v1/catalogs/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      name: 'ALLONE AI Platform',
      description: 'AI-powered Voice Agents, RAG Chatbots, and Automation tools',
      type: 'SERVICE',
      category: 'SOFTWARE',
    }),
  });

  const product = await response.json();

  // Store product ID for future use
  await adminClient
    .from('contact_info')
    .update({ paypal_product_id: product.id })
    .eq('id', config?.id);

  return product.id;
}

// Get or create plan for a specific tier
async function getOrCreatePlan(
  accessToken: string,
  productId: string,
  tierKey: TierKey,
  adminClient: ReturnType<typeof createAdminClient>
) {
  const tier = TIERS[tierKey];
  const planIdField = `paypal_plan_${tierKey}`;

  // Check if we have stored plan ID
  const { data: config } = await adminClient
    .from('contact_info')
    .select('*')
    .single();

  const storedPlanId = config?.[planIdField as keyof typeof config];
  if (storedPlanId) {
    return storedPlanId as string;
  }

  // Create new plan
  const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/plans`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      product_id: productId,
      name: `ALLONE ${tier.name} - Monthly`,
      description: tier.description,
      billing_cycles: [{
        frequency: { interval_unit: 'MONTH', interval_count: 1 },
        tenure_type: 'REGULAR',
        sequence: 1,
        total_cycles: 0,
        pricing_scheme: {
          fixed_price: { value: tier.price, currency_code: 'USD' }
        }
      }],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee: { value: '0', currency_code: 'USD' },
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 3
      }
    }),
  });

  const plan = await response.json();

  // Store plan ID
  await adminClient
    .from('contact_info')
    .update({ [planIdField]: plan.id })
    .eq('id', config?.id);

  return plan.id;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const tierKey = body.tier as TierKey;

    if (!tierKey || !TIERS[tierKey]) {
      return NextResponse.json({
        error: 'Invalid tier. Choose: starter, pro, or business'
      }, { status: 400 });
    }

    const tier = TIERS[tierKey];
    const adminClient = createAdminClient();

    // Check for existing active subscription
    const { data: existing } = await adminClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'pending'])
      .single();

    if (existing?.status === 'active') {
      return NextResponse.json({
        error: 'You already have an active subscription. Cancel it first to change plans.'
      }, { status: 400 });
    }

    // Get PayPal tokens
    const accessToken = await getPayPalAccessToken();
    const productId = await getOrCreateProduct(accessToken, adminClient);
    const planId = await getOrCreatePlan(accessToken, productId, tierKey, adminClient);

    // Create subscription
    const origin = request.headers.get('origin') || 'https://allone.ge';
    const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        plan_id: planId,
        subscriber: { email_address: user.email },
        application_context: {
          brand_name: 'ALLONE',
          locale: 'en-US',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'SUBSCRIBE_NOW',
          return_url: `${origin}/api/subscription/activate?subscription_id={subscription_id}`,
          cancel_url: `${origin}/dashboard/billing?cancelled=true`,
        },
      }),
    });

    const subscription = await response.json();

    if (!response.ok) {
      console.error('PayPal error:', subscription);
      return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
    }

    const approvalUrl = subscription.links?.find(
      (link: { rel: string; href: string }) => link.rel === 'approve'
    )?.href;

    // Delete any pending subscription and create new one
    await adminClient
      .from('subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('status', 'pending');

    await adminClient.from('subscriptions').insert({
      user_id: user.id,
      plan: tierKey,
      paypal_subscription_id: subscription.id,
      status: 'pending',
      limits: tier.limits,
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
      approvalUrl,
      tier: tierKey,
      price: tier.price,
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET endpoint to fetch available tiers
export async function GET() {
  return NextResponse.json({
    tiers: Object.entries(TIERS).map(([key, tier]) => ({
      id: key,
      ...tier,
    })),
  });
}
