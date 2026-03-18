---
name: api-integration
description: Patterns for integrating third-party APIs into applications. Covers OAuth flows, rate limiting, error handling, and webhook setup. Use when connecting to external services.
---

# Third-Party API Integration Patterns

## Overview

This skill covers:
- OAuth 2.0 authentication flows
- API client patterns
- Rate limiting and retry logic
- Error handling
- Webhook setup

---

## Pattern 1: Robust API Client

### Base API Client Class

```typescript
// lib/api/base-client.ts

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
}

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;

  constructor(config: {
    baseUrl: string;
    apiKey?: string;
    bearerToken?: string;
    timeout?: number;
  }) {
    this.baseUrl = config.baseUrl;
    this.timeout = config.timeout ?? 30000;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };

    if (config.apiKey) {
      this.defaultHeaders['X-API-Key'] = config.apiKey;
    }

    if (config.bearerToken) {
      this.defaultHeaders['Authorization'] = `Bearer ${config.bearerToken}`;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { method = 'GET', body, headers, timeout = this.timeout } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: { ...this.defaultHeaders, ...headers },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        return {
          data: null,
          error: data?.message ?? data?.error ?? `HTTP ${response.status}`,
          status: response.status,
        };
      }

      return { data, error: null, status: response.status };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        return { data: null, error: 'Request timeout', status: 408 };
      }

      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 500,
      };
    }
  }

  async get<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, body: unknown, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  async put<T>(endpoint: string, body: unknown, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  async patch<T>(endpoint: string, body: unknown, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  async delete<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}
```

### Client with Retry Logic

```typescript
// lib/api/resilient-client.ts

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  retryOn: number[]; // HTTP status codes to retry
}

export class ResilientApiClient extends ApiClient {
  private retryConfig: RetryConfig;

  constructor(config: {
    baseUrl: string;
    apiKey?: string;
    bearerToken?: string;
    retry?: Partial<RetryConfig>;
  }) {
    super(config);
    this.retryConfig = {
      maxRetries: config.retry?.maxRetries ?? 3,
      baseDelay: config.retry?.baseDelay ?? 1000,
      maxDelay: config.retry?.maxDelay ?? 30000,
      retryOn: config.retry?.retryOn ?? [408, 429, 500, 502, 503, 504],
    };
  }

  private async sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private calculateDelay(attempt: number): number {
    const delay = this.retryConfig.baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 1000;
    return Math.min(delay + jitter, this.retryConfig.maxDelay);
  }

  async requestWithRetry<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    body?: unknown
  ): Promise<ApiResponse<T>> {
    let lastResponse: ApiResponse<T> | null = null;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      const response = await (method === 'GET' || method === 'DELETE'
        ? this[method.toLowerCase() as 'get' | 'delete']<T>(endpoint)
        : this[method.toLowerCase() as 'post' | 'put' | 'patch']<T>(
            endpoint,
            body
          ));

      lastResponse = response;

      // Success or non-retryable error
      if (
        response.status < 400 ||
        !this.retryConfig.retryOn.includes(response.status)
      ) {
        return response;
      }

      // Don't retry on last attempt
      if (attempt < this.retryConfig.maxRetries) {
        const delay = this.calculateDelay(attempt);
        console.log(
          `Retry ${attempt + 1}/${this.retryConfig.maxRetries} after ${delay}ms`
        );
        await this.sleep(delay);
      }
    }

    return lastResponse!;
  }
}
```

---

## Pattern 2: OAuth 2.0 Integration

### OAuth Provider Configuration

```typescript
// lib/auth/oauth-config.ts

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  authorizeUrl: string;
  tokenUrl: string;
  scopes: string[];
  redirectUri: string;
}

export const OAUTH_PROVIDERS: Record<string, OAuthConfig> = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['email', 'profile'],
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`,
  },
  slack: {
    clientId: process.env.SLACK_CLIENT_ID!,
    clientSecret: process.env.SLACK_CLIENT_SECRET!,
    authorizeUrl: 'https://slack.com/oauth/v2/authorize',
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
    scopes: ['channels:read', 'chat:write', 'users:read'],
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/slack`,
  },
  hubspot: {
    clientId: process.env.HUBSPOT_CLIENT_ID!,
    clientSecret: process.env.HUBSPOT_CLIENT_SECRET!,
    authorizeUrl: 'https://app.hubspot.com/oauth/authorize',
    tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
    scopes: ['crm.objects.contacts.read', 'crm.objects.contacts.write'],
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/hubspot`,
  },
};
```

### OAuth Flow Implementation

```typescript
// lib/auth/oauth-service.ts
import { createClient } from '@/lib/supabase/server';
import { OAuthConfig, OAUTH_PROVIDERS } from './oauth-config';

export class OAuthService {
  private config: OAuthConfig;
  private provider: string;

  constructor(provider: string) {
    this.provider = provider;
    this.config = OAUTH_PROVIDERS[provider];

    if (!this.config) {
      throw new Error(`Unknown OAuth provider: ${provider}`);
    }
  }

  // Generate authorization URL
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scopes.join(' '),
      state,
      access_type: 'offline', // For refresh token
      prompt: 'consent',
    });

    return `${this.config.authorizeUrl}?${params.toString()}`;
  }

  // Exchange code for tokens
  async exchangeCodeForTokens(code: string) {
    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Token exchange failed: ${JSON.stringify(error)}`);
    }

    return response.json();
  }

  // Refresh access token
  async refreshAccessToken(refreshToken: string) {
    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Token refresh failed: ${JSON.stringify(error)}`);
    }

    return response.json();
  }

  // Store tokens in database
  async storeTokens(
    userId: string,
    tokens: {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
    }
  ) {
    const supabase = await createClient();

    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null;

    const { error } = await supabase.from('user_integrations').upsert({
      user_id: userId,
      provider: this.provider,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
  }

  // Get valid access token (refreshing if needed)
  async getValidAccessToken(userId: string): Promise<string> {
    const supabase = await createClient();

    const { data: integration } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', this.provider)
      .single();

    if (!integration) {
      throw new Error(`No ${this.provider} integration found`);
    }

    // Check if token is expired
    const isExpired =
      integration.expires_at &&
      new Date(integration.expires_at) < new Date(Date.now() + 60000); // 1 min buffer

    if (isExpired && integration.refresh_token) {
      const tokens = await this.refreshAccessToken(integration.refresh_token);
      await this.storeTokens(userId, tokens);
      return tokens.access_token;
    }

    return integration.access_token;
  }
}
```

### OAuth API Routes

```typescript
// app/api/auth/[provider]/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { OAuthService } from '@/lib/auth/oauth-service';
import { randomBytes } from 'crypto';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Generate state for CSRF protection
  const state = randomBytes(32).toString('hex');

  // Store state in cookie for verification
  const response = NextResponse.redirect(
    new OAuthService(provider).getAuthorizationUrl(state)
  );

  response.cookies.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600, // 10 minutes
    path: '/',
  });

  return response;
}
```

```typescript
// app/api/auth/callback/[provider]/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { OAuthService } from '@/lib/auth/oauth-service';
import { cookies } from 'next/headers';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const { searchParams } = new URL(request.url);

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      new URL(`/settings/integrations?error=${error}`, request.url)
    );
  }

  // Verify state
  const cookieStore = await cookies();
  const storedState = cookieStore.get('oauth_state')?.value;

  if (!state || state !== storedState) {
    return NextResponse.redirect(
      new URL('/settings/integrations?error=invalid_state', request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/settings/integrations?error=no_code', request.url)
    );
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const oauth = new OAuthService(provider);
    const tokens = await oauth.exchangeCodeForTokens(code);
    await oauth.storeTokens(user.id, tokens);

    return NextResponse.redirect(
      new URL('/settings/integrations?success=true', request.url)
    );
  } catch (err) {
    console.error('OAuth callback error:', err);
    return NextResponse.redirect(
      new URL('/settings/integrations?error=token_exchange_failed', request.url)
    );
  }
}
```

---

## Pattern 3: Rate Limiting Client-Side

```typescript
// lib/api/rate-limiter.ts

export class RateLimiter {
  private queue: Array<() => void> = [];
  private running = 0;
  private maxConcurrent: number;
  private minInterval: number;
  private lastRequest = 0;

  constructor(options: { maxConcurrent?: number; requestsPerSecond?: number }) {
    this.maxConcurrent = options.maxConcurrent ?? 5;
    this.minInterval = 1000 / (options.requestsPerSecond ?? 10);
  }

  async schedule<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const execute = async () => {
        // Enforce minimum interval
        const now = Date.now();
        const waitTime = Math.max(0, this.lastRequest + this.minInterval - now);

        if (waitTime > 0) {
          await new Promise(r => setTimeout(r, waitTime));
        }

        this.lastRequest = Date.now();
        this.running++;

        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.running--;
          this.processQueue();
        }
      };

      if (this.running < this.maxConcurrent) {
        execute();
      } else {
        this.queue.push(execute);
      }
    });
  }

  private processQueue() {
    if (this.queue.length > 0 && this.running < this.maxConcurrent) {
      const next = this.queue.shift();
      next?.();
    }
  }
}

// Usage
const rateLimiter = new RateLimiter({
  maxConcurrent: 5,
  requestsPerSecond: 10,
});

// All these requests will be rate limited
const results = await Promise.all(
  urls.map(url =>
    rateLimiter.schedule(() => fetch(url).then(r => r.json()))
  )
);
```

---

## Pattern 4: Specific API Integrations

### Slack Integration

```typescript
// lib/integrations/slack.ts
import { ResilientApiClient } from '@/lib/api/resilient-client';
import { OAuthService } from '@/lib/auth/oauth-service';

export class SlackClient {
  private client: ResilientApiClient;

  constructor(accessToken: string) {
    this.client = new ResilientApiClient({
      baseUrl: 'https://slack.com/api',
      bearerToken: accessToken,
    });
  }

  static async forUser(userId: string) {
    const oauth = new OAuthService('slack');
    const accessToken = await oauth.getValidAccessToken(userId);
    return new SlackClient(accessToken);
  }

  async sendMessage(channel: string, text: string, blocks?: unknown[]) {
    return this.client.post<{ ok: boolean; ts: string }>('/chat.postMessage', {
      channel,
      text,
      blocks,
    });
  }

  async listChannels() {
    return this.client.get<{
      ok: boolean;
      channels: Array<{ id: string; name: string }>;
    }>('/conversations.list');
  }

  async getUser(userId: string) {
    return this.client.get<{
      ok: boolean;
      user: { id: string; name: string; real_name: string };
    }>(`/users.info?user=${userId}`);
  }
}

// Usage
const slack = await SlackClient.forUser(userId);
await slack.sendMessage('#general', 'Hello from Allone!');
```

### HubSpot Integration

```typescript
// lib/integrations/hubspot.ts
import { ResilientApiClient } from '@/lib/api/resilient-client';
import { OAuthService } from '@/lib/auth/oauth-service';

interface HubSpotContact {
  id: string;
  properties: {
    email: string;
    firstname: string;
    lastname: string;
    company: string;
  };
}

export class HubSpotClient {
  private client: ResilientApiClient;

  constructor(accessToken: string) {
    this.client = new ResilientApiClient({
      baseUrl: 'https://api.hubapi.com',
      bearerToken: accessToken,
    });
  }

  static async forUser(userId: string) {
    const oauth = new OAuthService('hubspot');
    const accessToken = await oauth.getValidAccessToken(userId);
    return new HubSpotClient(accessToken);
  }

  async createContact(properties: Record<string, string>) {
    return this.client.post<HubSpotContact>('/crm/v3/objects/contacts', {
      properties,
    });
  }

  async getContact(contactId: string) {
    return this.client.get<HubSpotContact>(
      `/crm/v3/objects/contacts/${contactId}`
    );
  }

  async searchContacts(query: string) {
    return this.client.post<{ results: HubSpotContact[] }>(
      '/crm/v3/objects/contacts/search',
      {
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'email',
                operator: 'CONTAINS_TOKEN',
                value: query,
              },
            ],
          },
        ],
      }
    );
  }

  async updateContact(contactId: string, properties: Record<string, string>) {
    return this.client.patch<HubSpotContact>(
      `/crm/v3/objects/contacts/${contactId}`,
      { properties }
    );
  }
}
```

### Stripe Integration

```typescript
// lib/integrations/stripe.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

export class StripeService {
  // Create a customer
  async createCustomer(email: string, name: string, metadata?: Record<string, string>) {
    return stripe.customers.create({
      email,
      name,
      metadata,
    });
  }

  // Create checkout session
  async createCheckoutSession(params: {
    customerId: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
  }) {
    return stripe.checkout.sessions.create({
      customer: params.customerId,
      mode: 'subscription',
      line_items: [{ price: params.priceId, quantity: 1 }],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    });
  }

  // Create portal session for customer management
  async createPortalSession(customerId: string, returnUrl: string) {
    return stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  // Get subscription
  async getSubscription(subscriptionId: string) {
    return stripe.subscriptions.retrieve(subscriptionId);
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string) {
    return stripe.subscriptions.cancel(subscriptionId);
  }
}

export const stripeService = new StripeService();
```

---

## Pattern 5: API Integration Database Schema

```sql
-- Store OAuth integrations
CREATE TABLE user_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ,
    scopes TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

-- Store API keys for integrations that use them
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    service TEXT NOT NULL,
    key_hash TEXT NOT NULL,  -- Store hashed, never plain
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Log API calls for debugging and billing
CREATE TABLE api_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    integration_id UUID REFERENCES user_integrations(id),
    provider TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER,
    response_time_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_integrations_user ON user_integrations(user_id);
CREATE INDEX idx_user_integrations_provider ON user_integrations(provider);
CREATE INDEX idx_api_logs_user ON api_logs(user_id);
CREATE INDEX idx_api_logs_created ON api_logs(created_at DESC);

-- RLS
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own integrations" ON user_integrations
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own API keys" ON api_keys
    FOR ALL USING (auth.uid() = user_id);
```

---

## Best Practices

1. **Never expose API keys to client** - All calls through server
2. **Store tokens encrypted** - Use Supabase vault or encryption
3. **Implement token refresh** - Before tokens expire
4. **Handle rate limits gracefully** - Exponential backoff
5. **Log all API calls** - For debugging and billing
6. **Use webhooks over polling** - More efficient
7. **Validate webhook signatures** - Prevent spoofing
8. **Set reasonable timeouts** - Don't hang forever
9. **Cache responses when possible** - Reduce API calls
10. **Monitor API health** - Alert on failures
