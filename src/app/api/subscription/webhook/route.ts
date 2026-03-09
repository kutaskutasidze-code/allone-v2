import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID;
const PAYPAL_API_BASE = process.env.NODE_ENV === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function verifyPayPalWebhook(request: NextRequest, body: unknown): Promise<boolean> {
  if (!PAYPAL_WEBHOOK_ID) {
    console.warn('PAYPAL_WEBHOOK_ID not set — skipping webhook verification');
    return false;
  }

  try {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    const tokenRes = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`,
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenRes.ok) return false;
    const tokenData = await tokenRes.json();

    const verifyRes = await fetch(`${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
      body: JSON.stringify({
        auth_algo: request.headers.get('paypal-auth-algo'),
        cert_url: request.headers.get('paypal-cert-url'),
        transmission_id: request.headers.get('paypal-transmission-id'),
        transmission_sig: request.headers.get('paypal-transmission-sig'),
        transmission_time: request.headers.get('paypal-transmission-time'),
        webhook_id: PAYPAL_WEBHOOK_ID,
        webhook_event: body,
      }),
    });

    if (!verifyRes.ok) return false;
    const verifyData = await verifyRes.json();
    return verifyData.verification_status === 'SUCCESS';
  } catch (e) {
    console.error('PayPal webhook verification error:', e);
    return false;
  }
}

// PayPal Webhook handler for subscription events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const eventType = body.event_type;

    // Verify webhook signature
    const isValid = await verifyPayPalWebhook(request, body);
    if (!isValid) {
      console.error('PayPal webhook signature verification failed');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    console.log('PayPal webhook verified:', eventType);

    const adminClient = createAdminClient();

    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED': {
        const subscriptionId = body.resource?.id;
        if (subscriptionId) {
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
        }
        break;
      }

      case 'BILLING.SUBSCRIPTION.CANCELLED': {
        const subscriptionId = body.resource?.id;
        if (subscriptionId) {
          await adminClient
            .from('subscriptions')
            .update({
              status: 'cancelled',
              cancel_at_period_end: true,
            })
            .eq('paypal_subscription_id', subscriptionId);
        }
        break;
      }

      case 'BILLING.SUBSCRIPTION.SUSPENDED': {
        const subscriptionId = body.resource?.id;
        if (subscriptionId) {
          await adminClient
            .from('subscriptions')
            .update({ status: 'paused' })
            .eq('paypal_subscription_id', subscriptionId);
        }
        break;
      }

      case 'PAYMENT.SALE.COMPLETED': {
        // Subscription payment completed - extend period
        const subscriptionId = body.resource?.billing_agreement_id;
        if (subscriptionId) {
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
        }
        break;
      }

      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED': {
        const subscriptionId = body.resource?.id;
        if (subscriptionId) {
          await adminClient
            .from('subscriptions')
            .update({ status: 'past_due' })
            .eq('paypal_subscription_id', subscriptionId);
        }
        break;
      }

      default:
        console.log('Unhandled webhook event:', eventType);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Return 500 so PayPal retries on failure
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
