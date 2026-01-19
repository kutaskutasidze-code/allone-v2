import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// PayPal Webhook handler for subscription events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const eventType = body.event_type;

    console.log('PayPal webhook received:', eventType);

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
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
