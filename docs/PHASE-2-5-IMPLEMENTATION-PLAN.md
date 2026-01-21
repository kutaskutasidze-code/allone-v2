# Allone AI Ecosystem - Detailed Implementation Plan (Phase 2-5)

## Current State Assessment

### Infrastructure (Phase 1) - COMPLETE
| Component | Status | URL |
|-----------|--------|-----|
| b0t | Deployed | https://allone-b0t.fly.dev |
| voice-noob | Deployed | https://allone-voice.fly.dev |
| Supabase | Active | https://cywmdjldapzrnabsoosd.supabase.co |

### Already Built (allone.ge)

**Service Clients:**
- `src/lib/b0t/client.ts` - 547 lines, full workflow CRUD, templates, AI builder
- `src/lib/voice-noob/client.ts` - 214 lines, agent CRUD, phone management, widget embed
- `src/lib/rag/service.ts` - 615 lines, knowledge base CRUD, embeddings, semantic search, chat

**Orchestration API Routes:**
- `/api/ecosystem/automation` (GET, POST)
- `/api/ecosystem/automation/[id]` (GET, PATCH, DELETE)
- `/api/ecosystem/automation/[id]/run` (POST)
- `/api/ecosystem/voice-agent` (GET, POST)
- `/api/ecosystem/knowledge-base` (GET, POST)
- `/api/ecosystem/knowledge-base/[id]/upload` (POST)
- `/api/ecosystem/rag-bot` (GET, POST)
- `/api/ecosystem/rag-bot/[id]/chat` (POST)
- `/api/ecosystem/templates` (GET)

**AI Studio:**
- `/dashboard/studio/page.tsx` - Chat interface
- `/dashboard/studio/AIStudioContent.tsx` - Full chat UI with product creation
- `/api/studio/chat/route.ts` - Groq LLM integration with system prompt

**Database Migrations (defined but may need applying):**
- `20250120000000_user_products.sql` - Products, usage, knowledge bases, pricing tiers
- `20250121000000_rag_search_function.sql` - Vector search RPC

---

## Remaining Work Summary

| Phase | Task | Priority | Effort |
|-------|------|----------|--------|
| 1.3 | Apply Supabase migrations | HIGH | 15 min |
| 2.1 | Generate b0t API key | HIGH | 10 min |
| 2.2 | Generate voice-noob API key | HIGH | 10 min |
| 2.3 | Update b0t client for actual API | MEDIUM | 2 hrs |
| 2.4 | Update voice-noob client for actual API | MEDIUM | 2 hrs |
| 3.1 | Enhance AI Studio system prompt | LOW | 1 hr |
| 4.1 | Build unified products dashboard | MEDIUM | 3 hrs |
| 4.2 | Add product status monitoring | MEDIUM | 2 hrs |
| 5.1 | Build usage aggregation API | MEDIUM | 2 hrs |
| 5.2 | Build billing dashboard | LOW | 3 hrs |

---

## Phase 1.3: Enable Supabase pgvector (15 min)

### Step 1: Apply Migrations via SQL Editor

Go to: https://supabase.com/dashboard/project/cywmdjldapzrnabsoosd/sql/new

**Run this SQL:**

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Product types enum
DO $$ BEGIN
  CREATE TYPE product_type AS ENUM ('automation', 'voice_agent', 'rag_bot', 'webapp');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE product_status AS ENUM ('draft', 'deploying', 'active', 'paused', 'error');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- User products table
CREATE TABLE IF NOT EXISTS user_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type product_type NOT NULL,
  status product_status DEFAULT 'draft',
  deployment_url TEXT,
  deployment_id TEXT,
  webhook_url TEXT,
  n8n_workflow_id TEXT,
  agent_config JSONB DEFAULT '{}',
  system_prompt TEXT,
  knowledge_base_id UUID,
  config JSONB DEFAULT '{}',
  total_executions INTEGER DEFAULT 0,
  successful_executions INTEGER DEFAULT 0,
  failed_executions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ
);

-- Usage events table
CREATE TABLE IF NOT EXISTS usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES user_products(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  quantity DECIMAL(15, 6) DEFAULT 1,
  unit_cost DECIMAL(10, 6),
  total_cost DECIMAL(10, 6),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge bases
CREATE TABLE IF NOT EXISTS knowledge_bases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  document_count INTEGER DEFAULT 0,
  total_chunks INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents
CREATE TABLE IF NOT EXISTS knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_base_id UUID NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_type TEXT,
  file_url TEXT,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  chunk_count INTEGER DEFAULT 0,
  token_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Embeddings with pgvector
CREATE TABLE IF NOT EXISTS knowledge_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  knowledge_base_id UUID NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(1536),
  chunk_index INTEGER,
  token_count INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pricing tiers
CREATE TABLE IF NOT EXISTS pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  included_api_calls INTEGER DEFAULT 0,
  included_workflow_runs INTEGER DEFAULT 0,
  included_ai_tokens INTEGER DEFAULT 0,
  included_voice_minutes INTEGER DEFAULT 0,
  included_storage_mb INTEGER DEFAULT 0,
  api_call_cost DECIMAL(10, 6) DEFAULT 0.001,
  workflow_run_cost DECIMAL(10, 6) DEFAULT 0.01,
  ai_token_cost DECIMAL(10, 6) DEFAULT 0.00001,
  voice_minute_cost DECIMAL(10, 6) DEFAULT 0.10,
  storage_mb_cost DECIMAL(10, 6) DEFAULT 0.05,
  monthly_base DECIMAL(10, 2) DEFAULT 0,
  max_products INTEGER DEFAULT 5,
  max_knowledge_bases INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add pricing tier to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pricing_tier_id UUID REFERENCES pricing_tiers(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS usage_reset_at TIMESTAMPTZ DEFAULT NOW();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_products_user ON user_products(user_id);
CREATE INDEX IF NOT EXISTS idx_user_products_type ON user_products(type);
CREATE INDEX IF NOT EXISTS idx_usage_events_user_month ON usage_events(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_base ON knowledge_embeddings(knowledge_base_id);

-- Vector search index (HNSW for performance)
CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_hnsw
  ON knowledge_embeddings USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

-- Enable RLS
ALTER TABLE user_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_embeddings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "users_own_products" ON user_products FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_usage" ON usage_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_own_kb" ON knowledge_bases FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_docs" ON knowledge_documents FOR ALL
  USING (knowledge_base_id IN (SELECT id FROM knowledge_bases WHERE user_id = auth.uid()));
CREATE POLICY "users_own_embeddings" ON knowledge_embeddings FOR SELECT
  USING (knowledge_base_id IN (SELECT id FROM knowledge_bases WHERE user_id = auth.uid()));
CREATE POLICY "service_role_products" ON user_products FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_usage" ON usage_events FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_embeddings" ON knowledge_embeddings FOR ALL USING (auth.role() = 'service_role');

-- Insert default pricing tiers
INSERT INTO pricing_tiers (name, monthly_base, included_api_calls, included_workflow_runs, included_ai_tokens, included_voice_minutes, included_storage_mb, max_products, max_knowledge_bases) VALUES
  ('Free', 0, 100, 50, 10000, 5, 100, 3, 1),
  ('Starter', 29, 1000, 500, 100000, 60, 1000, 10, 3),
  ('Pro', 99, 5000, 2500, 500000, 300, 5000, 50, 10),
  ('Business', 299, 25000, 10000, 2000000, 1000, 25000, -1, -1)
ON CONFLICT (name) DO NOTHING;

-- Vector search function
CREATE OR REPLACE FUNCTION match_knowledge_embeddings(
  query_embedding TEXT,
  match_knowledge_base_id UUID,
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 5
)
RETURNS TABLE (id UUID, content TEXT, similarity FLOAT, chunk_index INT, metadata JSONB)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE embedding_vector vector(1536);
BEGIN
  embedding_vector := query_embedding::vector(1536);
  RETURN QUERY
  SELECT ke.id, ke.content, 1 - (ke.embedding <=> embedding_vector) AS similarity, ke.chunk_index, ke.metadata
  FROM knowledge_embeddings ke
  WHERE ke.knowledge_base_id = match_knowledge_base_id
    AND 1 - (ke.embedding <=> embedding_vector) > match_threshold
  ORDER BY ke.embedding <=> embedding_vector LIMIT match_count;
END; $$;

-- Usage tracking function
CREATE OR REPLACE FUNCTION record_usage(
  p_user_id UUID, p_product_id UUID, p_event_type TEXT, p_quantity DECIMAL, p_metadata JSONB DEFAULT '{}'
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_tier pricing_tiers%ROWTYPE; v_unit_cost DECIMAL; v_event_id UUID;
BEGIN
  SELECT pt.* INTO v_tier FROM profiles p JOIN pricing_tiers pt ON pt.id = p.pricing_tier_id WHERE p.id = p_user_id;
  IF v_tier.id IS NULL THEN SELECT * INTO v_tier FROM pricing_tiers WHERE name = 'Free'; END IF;
  v_unit_cost := CASE p_event_type
    WHEN 'api_call' THEN v_tier.api_call_cost WHEN 'workflow_run' THEN v_tier.workflow_run_cost
    WHEN 'ai_tokens' THEN v_tier.ai_token_cost WHEN 'voice_minutes' THEN v_tier.voice_minute_cost
    WHEN 'storage_mb' THEN v_tier.storage_mb_cost ELSE 0 END;
  INSERT INTO usage_events (user_id, product_id, event_type, quantity, unit_cost, total_cost, metadata)
  VALUES (p_user_id, p_product_id, p_event_type, p_quantity, v_unit_cost, p_quantity * v_unit_cost, p_metadata)
  RETURNING id INTO v_event_id;
  RETURN v_event_id;
END; $$;

GRANT EXECUTE ON FUNCTION match_knowledge_embeddings TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION record_usage TO authenticated, service_role;
```

### Step 2: Verify

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%knowledge%';

-- Check vector extension
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check pricing tiers
SELECT name, monthly_base, max_products FROM pricing_tiers;
```

---

## Phase 2: Orchestration API Integration

### 2.1 Generate b0t API Authentication

b0t uses NextAuth v5 session-based authentication. For server-to-server communication, we need to create an API key system.

**Option A: Session Cookie Forwarding** (Complex)
**Option B: Add API Key Auth to b0t** (Recommended)

**Add to b0t codebase** (`apps/web/src/lib/auth/api-key.ts`):

```typescript
import { prisma } from '@/lib/prisma';
import { createHash } from 'crypto';

export async function validateApiKey(key: string): Promise<{ userId: string; organizationId?: string } | null> {
  const hashedKey = createHash('sha256').update(key).digest('hex');

  const apiKey = await prisma.apiKey.findUnique({
    where: { hashedKey },
    include: { user: true }
  });

  if (!apiKey || apiKey.expiresAt < new Date()) return null;

  // Update last used
  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() }
  });

  return { userId: apiKey.userId, organizationId: apiKey.organizationId };
}
```

**Add API key table to b0t schema:**

```prisma
model ApiKey {
  id             String    @id @default(cuid())
  name           String
  hashedKey      String    @unique
  userId         String
  user           User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  organizationId String?
  expiresAt      DateTime
  lastUsedAt     DateTime?
  createdAt      DateTime  @default(now())
}
```

For now, **workaround**: Use b0t's internal session by creating a dedicated Allone user and storing the session cookie.

### 2.2 Generate voice-noob API Key

voice-noob uses JWT Bearer tokens. Generate via:

```bash
# SSH to voice-noob container
flyctl ssh console -a allone-voice

# Create API key
python -c "
from app.core.security import create_access_token
from datetime import timedelta

# Create long-lived token for Allone orchestration
token = create_access_token(
    data={'sub': 'allone-orchestrator', 'type': 'service'},
    expires_delta=timedelta(days=365)
)
print(f'VOICE_NOOB_API_KEY={token}')
"
```

**Add to allone.ge `.env.local`:**
```env
VOICE_NOOB_API_KEY=<generated-token>
```

### 2.3 Update b0t Client

The current client assumes REST API patterns. Based on b0t research, update to match actual endpoints:

**File: `src/lib/b0t/client.ts`**

Key changes needed:
1. Session-based auth vs Bearer token
2. Workflow schema: `config.steps` → `config.plan.steps`
3. Add `outputAs` to steps
4. Conversation-based workflow creation

```typescript
// Updated workflow creation to match b0t's actual API
async createWorkflow(input: CreateWorkflowInput): Promise<Workflow> {
  return this.request<{ workflow: Workflow }>('/api/workflows', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      description: input.description,
      trigger: input.trigger || { type: 'manual', config: {} },
      config: {
        version: '1.0',
        plan: {
          steps: input.config?.steps?.map((step, i) => ({
            id: step.id || `step_${i}`,
            module: step.module,
            function: step.function,
            inputs: step.parameters,
            outputAs: `step_${i}_result`
          })) || []
        },
        returnValue: '{{step_0_result}}'
      },
      organizationId: input.organizationId,
    }),
  }).then(res => res.workflow);
}
```

### 2.4 Update voice-noob Client

Based on voice-noob research, update to match FastAPI endpoints:

**File: `src/lib/voice-noob/client.ts`**

Key changes:
1. Endpoints are at `/api/v1/` not `/api/`
2. Add workspace support for multi-tenant
3. Phone numbers via `/api/v1/phone-numbers`

```typescript
// Updated agent creation
async createAgent(input: CreateAgentInput): Promise<VoiceAgent> {
  return this.request<VoiceAgent>('/api/v1/agents', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      system_prompt: input.system_prompt,
      voice: input.voice_id || 'shimmer',
      pricing_tier: input.ai_tier || 'balanced',
      enabled_tool_ids: {
        ...(input.tools?.includes('crm') && { crm: ['create_contact', 'update_contact'] }),
        ...(input.tools?.includes('calendar') && { calendar: ['book_appointment'] }),
      },
      workspace_id: input.workspaceId
    }),
  });
}

// Phone number assignment via separate endpoint
async assignPhoneNumber(agentId: string): Promise<{ phone_number: string }> {
  // First get available number
  const numbers = await this.request<{ data: Array<{ id: string; phone_number: string }> }>(
    '/api/v1/phone-numbers?status=available'
  );

  if (numbers.data.length === 0) {
    throw new Error('No phone numbers available');
  }

  // Assign to agent
  return this.request<{ phone_number: string }>(
    `/api/v1/phone-numbers/${numbers.data[0].id}/assign`,
    {
      method: 'POST',
      body: JSON.stringify({ agent_id: agentId })
    }
  );
}
```

---

## Phase 3: AI Studio Enhancement

### 3.1 Enhanced System Prompt

The current system prompt is good but can be improved with actual tool schemas:

**File: `src/app/api/studio/chat/route.ts`**

```typescript
const ENHANCED_SYSTEM_PROMPT = `You are ALLONE AI, an intelligent assistant that helps non-technical founders build business automations and AI agents through conversation.

## Available Automation Modules (via b0t)

### Communication
- slack.sendMessage(channel, message) - Send Slack messages
- email.send(to, subject, body) - Send emails via SendGrid
- discord.sendMessage(channelId, content) - Send Discord messages
- telegram.sendMessage(chatId, text) - Send Telegram messages

### CRM & Data
- hubspot.createContact(email, properties) - Create HubSpot contacts
- salesforce.createLead(data) - Create Salesforce leads
- airtable.createRecord(baseId, tableId, fields) - Add Airtable records
- sheets.appendRow(spreadsheetId, range, values) - Add Google Sheets rows

### E-commerce
- stripe.createCheckout(items, successUrl) - Create Stripe checkout
- shopify.createOrder(lineItems, customer) - Create Shopify orders

### Social Media
- twitter.tweet(text) - Post to Twitter
- linkedin.createPost(text) - Post to LinkedIn

### Scheduling
- calendly.getEventTypes() - List Calendly event types
- calendar.createEvent(title, start, end) - Create calendar events

## Voice AI Capabilities (via voice-noob)

### Built-in Tools
- transfer_call(department) - Transfer to human agent
- book_appointment(date, time, service) - Schedule via Calendly
- create_crm_contact(name, email, phone) - Add to CRM
- send_sms(phone, message) - Send follow-up SMS
- lookup_order(orderId) - Check order status

### Voice Options
- alloy, echo, fable, onyx, nova, shimmer (OpenAI)
- Custom ElevenLabs voices available

### Pricing Tiers
- budget: ~1000ms latency, basic features
- balanced: ~500ms latency, good for most use cases
- premium-mini: ~400ms latency, faster responses
- premium: ~320ms latency, best quality

## Knowledge Base (RAG) Capabilities

### Supported Formats
- PDF, DOCX, TXT, Markdown
- Up to 10MB per document
- Automatic chunking and embedding

### Search Features
- Semantic search across all documents
- Citation with source references
- Configurable similarity threshold

## When Creating Products

Include this JSON when ready to create:

\`\`\`json
{
  "action": "create_product",
  "type": "automation" | "rag_bot" | "voice_agent",
  "config": {
    "name": "Product Name",
    "description": "What it does",
    // For automation:
    "template": "lead-capture" | "email-sequence" | "custom",
    "steps": [...],
    // For voice_agent:
    "system_prompt": "You are...",
    "voice": "shimmer",
    "pricing_tier": "balanced",
    "tools": ["transfer_call", "book_appointment"],
    // For rag_bot:
    "system_prompt": "You are...",
    "greeting": "Hello! How can I help?"
  }
}
\`\`\`
`;
```

---

## Phase 4: Client Dashboard

### 4.1 Unified Products Dashboard

**Create: `src/app/dashboard/products/page.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ProductsDashboard from './ProductsDashboard';

export default async function ProductsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Fetch all user products with stats
  const { data: products } = await supabase
    .from('user_products')
    .select(`
      *,
      usage_events(count)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Fetch knowledge bases
  const { data: knowledgeBases } = await supabase
    .from('knowledge_bases')
    .select('id, name, document_count, total_tokens')
    .eq('user_id', user.id);

  return (
    <ProductsDashboard
      products={products || []}
      knowledgeBases={knowledgeBases || []}
    />
  );
}
```

**Create: `src/app/dashboard/products/ProductsDashboard.tsx`**

```typescript
'use client';

import { useState } from 'react';
import { Zap, Mic, FileText, Play, Pause, Trash2, Settings, ExternalLink } from 'lucide-react';

// ... Full implementation with:
// - Product cards grouped by type
// - Status indicators (active/paused/error)
// - Quick actions (run, pause, delete)
// - Usage stats per product
// - Links to edit configuration
```

### 4.2 Product Status Monitoring

**Create: `src/app/api/ecosystem/status/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { b0tClient } from '@/lib/b0t/client';
import { voiceNoobClient } from '@/lib/voice-noob/client';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: products } = await supabase
    .from('user_products')
    .select('*')
    .eq('user_id', user.id);

  // Check status of each product from respective services
  const statusChecks = await Promise.all(
    (products || []).map(async (product) => {
      try {
        switch (product.type) {
          case 'automation':
            if (product.config?.b0t_workflow_id) {
              const workflow = await b0tClient.getWorkflow(product.config.b0t_workflow_id);
              return { id: product.id, status: workflow.status, lastRun: workflow.lastRun };
            }
            break;
          case 'voice_agent':
            if (product.deployment_id) {
              const agent = await voiceNoobClient.getAgent(product.deployment_id);
              return { id: product.id, status: agent.is_active ? 'active' : 'paused' };
            }
            break;
          case 'rag_bot':
            // RAG bots are always active if knowledge base exists
            return { id: product.id, status: product.knowledge_base_id ? 'active' : 'draft' };
        }
      } catch {
        return { id: product.id, status: 'error' };
      }
      return { id: product.id, status: product.status };
    })
  );

  return NextResponse.json({ statuses: statusChecks });
}
```

---

## Phase 5: Billing Integration

### 5.1 Usage Aggregation API

**Create: `src/app/api/billing/usage/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user's pricing tier
  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      pricing_tier_id,
      usage_reset_at,
      pricing_tiers (*)
    `)
    .eq('id', user.id)
    .single();

  const tier = profile?.pricing_tiers || {
    name: 'Free',
    included_api_calls: 100,
    included_workflow_runs: 50,
    included_ai_tokens: 10000,
    included_voice_minutes: 5,
    included_storage_mb: 100
  };

  // Get usage since last reset
  const resetDate = profile?.usage_reset_at || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const { data: usage } = await supabase.rpc('get_user_usage', {
    p_user_id: user.id,
    p_start_date: resetDate
  });

  // Format response
  const usageMap = (usage || []).reduce((acc: Record<string, { quantity: number; cost: number }>, u: { event_type: string; total_quantity: number; total_cost: number }) => {
    acc[u.event_type] = { quantity: Number(u.total_quantity), cost: Number(u.total_cost) };
    return acc;
  }, {});

  return NextResponse.json({
    tier: tier.name,
    period: { start: resetDate, end: new Date() },
    usage: {
      api_calls: { used: usageMap.api_call?.quantity || 0, included: tier.included_api_calls, overage_cost: usageMap.api_call?.cost || 0 },
      workflow_runs: { used: usageMap.workflow_run?.quantity || 0, included: tier.included_workflow_runs, overage_cost: usageMap.workflow_run?.cost || 0 },
      ai_tokens: { used: usageMap.ai_tokens?.quantity || 0, included: tier.included_ai_tokens, overage_cost: usageMap.ai_tokens?.cost || 0 },
      voice_minutes: { used: usageMap.voice_minutes?.quantity || 0, included: tier.included_voice_minutes, overage_cost: usageMap.voice_minutes?.cost || 0 },
      storage_mb: { used: usageMap.storage_mb?.quantity || 0, included: tier.included_storage_mb, overage_cost: usageMap.storage_mb?.cost || 0 },
    },
    total_overage_cost: Object.values(usageMap).reduce((sum: number, u: { cost: number }) => sum + (u.cost || 0), 0)
  });
}
```

### 5.2 Billing Dashboard

**Create: `src/app/dashboard/billing/page.tsx`**

Full billing page with:
- Current plan display
- Usage bars per category
- Overage costs
- Upgrade options
- Invoice history

---

## Environment Variables Summary

Add to `.env.local`:

```env
# b0t (Fly.io)
B0T_API_URL=https://allone-b0t.fly.dev
B0T_API_KEY=<to-generate>

# voice-noob (Fly.io)
VOICE_NOOB_API_URL=https://allone-voice.fly.dev
VOICE_NOOB_API_KEY=<to-generate>

# OpenAI (for embeddings)
OPENAI_API_KEY=<existing>

# Groq (for AI Studio chat) - already configured
GROQ_API_KEY=<existing>
```

---

## Testing Checklist

### Phase 1.3 Verification
- [ ] Tables exist: `user_products`, `knowledge_bases`, `knowledge_embeddings`
- [ ] Vector extension enabled: `SELECT * FROM pg_extension WHERE extname = 'vector'`
- [ ] Pricing tiers populated: `SELECT * FROM pricing_tiers`
- [ ] RPC functions work: `SELECT match_knowledge_embeddings('[0.1,0.2,...]'::text, '...'::uuid)`

### Phase 2 Verification
- [ ] b0t API responds: `curl https://allone-b0t.fly.dev/api/health`
- [ ] voice-noob API responds: `curl https://allone-voice.fly.dev/health`
- [ ] Create automation via `/api/ecosystem/automation`
- [ ] Create voice agent via `/api/ecosystem/voice-agent`
- [ ] Create knowledge base via `/api/ecosystem/knowledge-base`

### Phase 3 Verification
- [ ] AI Studio loads: `/dashboard/studio`
- [ ] Chat responds with product suggestions
- [ ] Product creation from chat works

### Phase 4 Verification
- [ ] Products dashboard shows all types
- [ ] Status reflects actual service state
- [ ] Actions (pause, delete) work

### Phase 5 Verification
- [ ] Usage API returns correct data
- [ ] Billing page displays usage bars
- [ ] Overage costs calculated correctly

---

## Priority Order

1. **Phase 1.3** - Apply migrations (blocks everything)
2. **Phase 2.1/2.2** - Generate API keys (blocks integration)
3. **Phase 4.1** - Products dashboard (immediate user value)
4. **Phase 2.3/2.4** - Update clients (if endpoints don't match)
5. **Phase 5** - Billing (can be done after MVP)
6. **Phase 3.1** - Enhanced prompts (polish)
