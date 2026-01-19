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

  const data = await response.json();
  return data.access_token;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('subscription_id');
    const userId = searchParams.get('user_id');

    if (!subscriptionId || !userId) {
      return NextResponse.redirect(new URL('/products?error=missing_params', request.url));
    }

    // Get subscription details from PayPal
    const accessToken = await getPayPalAccessToken();
    const subscriptionResponse = await fetch(
      `${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    const subscription = await subscriptionResponse.json();

    if (subscription.status !== 'ACTIVE') {
      return NextResponse.redirect(new URL('/products?error=subscription_not_active', request.url));
    }

    // Update subscription in database
    const adminClient = createAdminClient();
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await adminClient
      .from('subscriptions')
      .update({
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
      })
      .eq('paypal_subscription_id', subscriptionId);

    // Redirect to dashboard with success
    const origin = request.headers.get('origin') || 'https://allone.ge';
    return NextResponse.redirect(new URL('/dashboard?subscribed=true', origin));
  } catch (error) {
    console.error('Activate subscription error:', error);
    return NextResponse.redirect(new URL('/products?error=activation_failed', request.url));
  }
}
