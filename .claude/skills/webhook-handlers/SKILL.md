---
name: webhook-handlers
description: Patterns for handling incoming webhooks from third-party services. Covers signature verification, event processing, and reliability. Use when receiving callbacks from Stripe, GitHub, Slack, etc.
---

# Webhook Handler Patterns

## Overview

Webhooks are HTTP callbacks that notify your application of events. This skill covers:
- Signature verification
- Event processing
- Idempotency
- Retry handling
- Queue-based processing

---

## Pattern 1: Generic Webhook Handler

### Base Handler Structure

```typescript
// lib/webhooks/base-handler.ts

export interface WebhookEvent<T = unknown> {
  id: string;
  type: string;
  data: T;
  timestamp: Date;
  signature?: string;
}

export interface WebhookResult {
  success: boolean;
  message?: string;
  error?: string;
}

export abstract class WebhookHandler<T = unknown> {
  abstract readonly provider: string;

  // Verify webhook signature
  abstract verifySignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean;

  // Parse raw payload into event
  abstract parseEvent(payload: string): WebhookEvent<T>;

  // Process the event
  abstract handleEvent(event: WebhookEvent<T>): Promise<WebhookResult>;

  // Main entry point
  async process(
    payload: string,
    signature: string,
    secret: string
  ): Promise<WebhookResult> {
    // Verify signature
    if (!this.verifySignature(payload, signature, secret)) {
      return { success: false, error: 'Invalid signature' };
    }

    // Parse event
    const event = this.parseEvent(payload);

    // Check idempotency (prevent duplicate processing)
    const isDuplicate = await this.checkDuplicate(event.id);
    if (isDuplicate) {
      return { success: true, message: 'Already processed' };
    }

    // Process event
    try {
      const result = await this.handleEvent(event);
      await this.markProcessed(event.id);
      return result;
    } catch (error) {
      console.error(`Webhook processing failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Idempotency checks
  private async checkDuplicate(eventId: string): Promise<boolean> {
    const { createClient } = await import('@/lib/supabase/admin');
    const supabase = createClient();

    const { data } = await supabase
      .from('webhook_events')
      .select('id')
      .eq('event_id', eventId)
      .eq('provider', this.provider)
      .single();

    return !!data;
  }

  private async markProcessed(eventId: string): Promise<void> {
    const { createClient } = await import('@/lib/supabase/admin');
    const supabase = createClient();

    await supabase.from('webhook_events').insert({
      event_id: eventId,
      provider: this.provider,
      processed_at: new Date().toISOString(),
    });
  }
}
```

### Database Schema for Webhooks

```sql
-- Track processed webhook events (idempotency)
CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    event_type TEXT,
    payload JSONB,
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, provider)
);

-- Webhook delivery logs
CREATE TABLE webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL,
    event_type TEXT NOT NULL,
    status TEXT NOT NULL,  -- 'success', 'failed', 'pending'
    request_body JSONB,
    response_body JSONB,
    error_message TEXT,
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhook_events_lookup ON webhook_events(event_id, provider);
CREATE INDEX idx_webhook_logs_provider ON webhook_logs(provider, created_at DESC);
```

---

## Pattern 2: Stripe Webhook Handler

```typescript
// lib/webhooks/stripe-handler.ts
import Stripe from 'stripe';
import { WebhookHandler, WebhookEvent, WebhookResult } from './base-handler';
import { createClient } from '@/lib/supabase/admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

type StripeEventType =
  | 'checkout.session.completed'
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'invoice.paid'
  | 'invoice.payment_failed';

export class StripeWebhookHandler extends WebhookHandler<Stripe.Event> {
  readonly provider = 'stripe';

  verifySignature(payload: string, signature: string, secret: string): boolean {
    try {
      stripe.webhooks.constructEvent(payload, signature, secret);
      return true;
    } catch {
      return false;
    }
  }

  parseEvent(payload: string): WebhookEvent<Stripe.Event> {
    const event = JSON.parse(payload) as Stripe.Event;
    return {
      id: event.id,
      type: event.type,
      data: event,
      timestamp: new Date(event.created * 1000),
    };
  }

  async handleEvent(event: WebhookEvent<Stripe.Event>): Promise<WebhookResult> {
    const stripeEvent = event.data;

    switch (stripeEvent.type as StripeEventType) {
      case 'checkout.session.completed':
        return this.handleCheckoutComplete(
          stripeEvent.data.object as Stripe.Checkout.Session
        );

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        return this.handleSubscriptionChange(
          stripeEvent.data.object as Stripe.Subscription
        );

      case 'customer.subscription.deleted':
        return this.handleSubscriptionCanceled(
          stripeEvent.data.object as Stripe.Subscription
        );

      case 'invoice.payment_failed':
        return this.handlePaymentFailed(
          stripeEvent.data.object as Stripe.Invoice
        );

      default:
        return { success: true, message: `Unhandled event: ${stripeEvent.type}` };
    }
  }

  private async handleCheckoutComplete(
    session: Stripe.Checkout.Session
  ): Promise<WebhookResult> {
    const supabase = createClient();
    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;

    // Update user with subscription info
    const { error } = await supabase
      .from('users')
      .update({
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        subscription_status: 'active',
      })
      .eq('id', session.metadata?.user_id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, message: 'Checkout processed' };
  }

  private async handleSubscriptionChange(
    subscription: Stripe.Subscription
  ): Promise<WebhookResult> {
    const supabase = createClient();

    const { error } = await supabase
      .from('users')
      .update({
        subscription_status: subscription.status,
        subscription_plan: subscription.items.data[0]?.price.id,
        current_period_end: new Date(
          subscription.current_period_end * 1000
        ).toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, message: 'Subscription updated' };
  }

  private async handleSubscriptionCanceled(
    subscription: Stripe.Subscription
  ): Promise<WebhookResult> {
    const supabase = createClient();

    const { error } = await supabase
      .from('users')
      .update({
        subscription_status: 'canceled',
        subscription_plan: null,
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, message: 'Subscription canceled' };
  }

  private async handlePaymentFailed(
    invoice: Stripe.Invoice
  ): Promise<WebhookResult> {
    // Send notification email, update status, etc.
    console.log('Payment failed for:', invoice.customer);

    // You might want to send an email here
    // await sendEmail(...)

    return { success: true, message: 'Payment failure logged' };
  }
}

export const stripeWebhookHandler = new StripeWebhookHandler();
```

### Stripe Webhook API Route

```typescript
// app/api/webhooks/stripe/route.ts
import { NextResponse } from 'next/server';
import { stripeWebhookHandler } from '@/lib/webhooks/stripe-handler';

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  const result = await stripeWebhookHandler.process(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  if (!result.success) {
    console.error('Stripe webhook failed:', result.error);
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ received: true });
}

// Disable body parsing - we need raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};
```

---

## Pattern 3: GitHub Webhook Handler

```typescript
// lib/webhooks/github-handler.ts
import { createHmac, timingSafeEqual } from 'crypto';
import { WebhookHandler, WebhookEvent, WebhookResult } from './base-handler';

interface GitHubPushEvent {
  ref: string;
  repository: {
    full_name: string;
  };
  commits: Array<{
    id: string;
    message: string;
    author: { name: string; email: string };
  }>;
}

interface GitHubPREvent {
  action: string;
  pull_request: {
    number: number;
    title: string;
    state: string;
    merged: boolean;
  };
  repository: {
    full_name: string;
  };
}

type GitHubEvent = GitHubPushEvent | GitHubPREvent;

export class GitHubWebhookHandler extends WebhookHandler<GitHubEvent> {
  readonly provider = 'github';

  verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = `sha256=${createHmac('sha256', secret)
      .update(payload)
      .digest('hex')}`;

    try {
      return timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch {
      return false;
    }
  }

  parseEvent(payload: string): WebhookEvent<GitHubEvent> {
    const data = JSON.parse(payload);
    return {
      id: data.delivery ?? crypto.randomUUID(),
      type: data.action ? `pull_request.${data.action}` : 'push',
      data,
      timestamp: new Date(),
    };
  }

  async handleEvent(event: WebhookEvent<GitHubEvent>): Promise<WebhookResult> {
    if (event.type === 'push') {
      return this.handlePush(event.data as GitHubPushEvent);
    }

    if (event.type.startsWith('pull_request')) {
      return this.handlePullRequest(event.data as GitHubPREvent);
    }

    return { success: true, message: `Unhandled event: ${event.type}` };
  }

  private async handlePush(event: GitHubPushEvent): Promise<WebhookResult> {
    console.log(`Push to ${event.repository.full_name}: ${event.ref}`);
    console.log(`Commits: ${event.commits.length}`);

    // Trigger deployment, notify team, etc.
    // await triggerDeployment(event.repository.full_name, event.ref);

    return { success: true, message: 'Push processed' };
  }

  private async handlePullRequest(event: GitHubPREvent): Promise<WebhookResult> {
    const { action, pull_request, repository } = event;

    console.log(
      `PR #${pull_request.number} ${action} on ${repository.full_name}`
    );

    if (action === 'opened') {
      // Run CI, add labels, notify reviewers
    }

    if (action === 'closed' && pull_request.merged) {
      // Trigger deployment, update changelog
    }

    return { success: true, message: `PR ${action} processed` };
  }
}

export const githubWebhookHandler = new GitHubWebhookHandler();
```

### GitHub Webhook API Route

```typescript
// app/api/webhooks/github/route.ts
import { NextResponse } from 'next/server';
import { githubWebhookHandler } from '@/lib/webhooks/github-handler';

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get('x-hub-signature-256');
  const event = request.headers.get('x-github-event');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  console.log(`GitHub webhook: ${event}`);

  const result = await githubWebhookHandler.process(
    payload,
    signature,
    process.env.GITHUB_WEBHOOK_SECRET!
  );

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ received: true });
}
```

---

## Pattern 4: Slack Webhook Handler

```typescript
// lib/webhooks/slack-handler.ts
import { createHmac, timingSafeEqual } from 'crypto';
import { WebhookHandler, WebhookEvent, WebhookResult } from './base-handler';

interface SlackEvent {
  type: string;
  challenge?: string; // URL verification
  event?: {
    type: string;
    user: string;
    text?: string;
    channel?: string;
    ts: string;
  };
}

export class SlackWebhookHandler extends WebhookHandler<SlackEvent> {
  readonly provider = 'slack';

  verifySignature(payload: string, signature: string, secret: string): boolean {
    // Slack uses: v0=HMAC-SHA256(secret, "v0:timestamp:body")
    const [, timestamp, sig] = signature.match(/v0=(\d+):(.+)/) ?? [];

    if (!timestamp || !sig) {
      // Try standard format
      const expectedSig = createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      return signature === `v0=${expectedSig}`;
    }

    const baseString = `v0:${timestamp}:${payload}`;
    const expectedSig = createHmac('sha256', secret)
      .update(baseString)
      .digest('hex');

    try {
      return timingSafeEqual(
        Buffer.from(sig),
        Buffer.from(expectedSig)
      );
    } catch {
      return false;
    }
  }

  parseEvent(payload: string): WebhookEvent<SlackEvent> {
    const data = JSON.parse(payload);
    return {
      id: data.event?.ts ?? crypto.randomUUID(),
      type: data.type === 'url_verification' ? 'challenge' : data.event?.type ?? 'unknown',
      data,
      timestamp: new Date(),
    };
  }

  async handleEvent(event: WebhookEvent<SlackEvent>): Promise<WebhookResult> {
    const data = event.data;

    // Handle URL verification challenge
    if (data.type === 'url_verification' && data.challenge) {
      return {
        success: true,
        message: data.challenge, // Return challenge for verification
      };
    }

    // Handle actual events
    switch (data.event?.type) {
      case 'message':
        return this.handleMessage(data.event);

      case 'app_mention':
        return this.handleMention(data.event);

      default:
        return { success: true, message: `Unhandled: ${data.event?.type}` };
    }
  }

  private async handleMessage(event: SlackEvent['event']): Promise<WebhookResult> {
    if (!event) return { success: false, error: 'No event data' };

    console.log(`Message from ${event.user}: ${event.text}`);

    // Process message, respond, etc.

    return { success: true, message: 'Message processed' };
  }

  private async handleMention(event: SlackEvent['event']): Promise<WebhookResult> {
    if (!event) return { success: false, error: 'No event data' };

    console.log(`Mentioned by ${event.user}: ${event.text}`);

    // Respond to mention

    return { success: true, message: 'Mention processed' };
  }
}

export const slackWebhookHandler = new SlackWebhookHandler();
```

---

## Pattern 5: Queue-Based Webhook Processing

For high-volume webhooks, process asynchronously:

```typescript
// lib/webhooks/queue-processor.ts
import { createQueue, createWorker } from '@/lib/queue/config';

interface WebhookJob {
  provider: string;
  payload: string;
  signature: string;
  headers: Record<string, string>;
  receivedAt: string;
}

// Queue for webhook processing
export const webhookQueue = createQueue<WebhookJob>('webhooks');

// Worker
export const webhookWorker = createWorker<WebhookJob>('webhooks', async (job) => {
  const { provider, payload, signature } = job.data;

  // Get appropriate handler
  const handler = getHandler(provider);
  if (!handler) {
    throw new Error(`Unknown provider: ${provider}`);
  }

  // Process
  const secret = getSecret(provider);
  const result = await handler.process(payload, signature, secret);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result;
});

function getHandler(provider: string) {
  const handlers: Record<string, WebhookHandler> = {
    stripe: stripeWebhookHandler,
    github: githubWebhookHandler,
    slack: slackWebhookHandler,
  };
  return handlers[provider];
}

function getSecret(provider: string): string {
  const secrets: Record<string, string> = {
    stripe: process.env.STRIPE_WEBHOOK_SECRET!,
    github: process.env.GITHUB_WEBHOOK_SECRET!,
    slack: process.env.SLACK_SIGNING_SECRET!,
  };
  return secrets[provider];
}
```

### Queue-Based API Route

```typescript
// app/api/webhooks/[provider]/route.ts
import { NextResponse } from 'next/server';
import { webhookQueue } from '@/lib/webhooks/queue-processor';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const payload = await request.text();
  const headers = Object.fromEntries(request.headers.entries());

  // Get signature header based on provider
  const signatureHeaders: Record<string, string> = {
    stripe: 'stripe-signature',
    github: 'x-hub-signature-256',
    slack: 'x-slack-signature',
  };

  const signature = headers[signatureHeaders[provider]] ?? '';

  // Queue for async processing
  await webhookQueue.add(
    `${provider}-webhook`,
    {
      provider,
      payload,
      signature,
      headers,
      receivedAt: new Date().toISOString(),
    },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    }
  );

  // Immediately acknowledge receipt
  return NextResponse.json({ received: true });
}
```

---

## Pattern 6: Webhook Testing & Debugging

### Local Testing with ngrok

```bash
# Install ngrok
npm install -g ngrok

# Expose local server
ngrok http 3000

# Use the ngrok URL in webhook settings
# https://abc123.ngrok.io/api/webhooks/stripe
```

### Webhook Test Endpoint

```typescript
// app/api/webhooks/test/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const payload = await request.text();
  const headers = Object.fromEntries(request.headers.entries());

  console.log('=== Webhook Test ===');
  console.log('Headers:', JSON.stringify(headers, null, 2));
  console.log('Body:', payload);
  console.log('==================');

  // Log to database for inspection
  const { createClient } = await import('@/lib/supabase/admin');
  const supabase = createClient();

  await supabase.from('webhook_logs').insert({
    provider: 'test',
    event_type: 'test',
    status: 'success',
    request_body: JSON.parse(payload),
    created_at: new Date().toISOString(),
  });

  return NextResponse.json({
    received: true,
    timestamp: new Date().toISOString(),
  });
}
```

---

## Best Practices

1. **Always verify signatures** - Never trust unverified webhooks
2. **Implement idempotency** - Webhooks may be sent multiple times
3. **Respond quickly (< 5s)** - Use queues for slow processing
4. **Log everything** - For debugging and auditing
5. **Handle retries gracefully** - Don't fail on duplicates
6. **Use HTTPS only** - Never accept webhooks over HTTP
7. **Validate payload structure** - Don't trust incoming data
8. **Set up monitoring** - Alert on failures
9. **Test with real events** - Use provider test modes
10. **Document your endpoints** - For team knowledge sharing
