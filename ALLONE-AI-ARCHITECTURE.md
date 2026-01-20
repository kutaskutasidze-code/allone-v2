# ALLONE AI - System Architecture

## Vision
Enable non-technical founders to build complete business ecosystems through conversation, with all deployed products visible on a single dashboard.

**Priority Products**: Automations & AI Agents (easier to build, clear value)
**Pricing**: Usage-based
**Backend**: Shared Claude + MCP server (same as local setup, production-ready)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ALLONE.GE (Frontend)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Landing    │  │   AI Studio  │  │  Dashboard   │  │   Settings   │    │
│  │    Page      │  │    (Chat)    │  │  (Products)  │  │   (Billing)  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         API Gateway (Next.js API Routes)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  /api/studio/chat     - AI conversation endpoint                            │
│  /api/products/*      - CRUD for user's products                            │
│  /api/usage/*         - Usage tracking & billing                            │
│  /api/deploy/*        - Deployment triggers                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      ALLONE AI Engine (Backend Server)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Claude API + MCP Tools                            │   │
│  │                                                                       │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │   │
│  │  │   n8n       │ │  Supabase   │ │   Vercel    │ │  Native     │    │   │
│  │  │   MCP       │ │    MCP      │ │    MCP      │ │  Access     │    │   │
│  │  │             │ │             │ │             │ │             │    │   │
│  │  │ - Workflows │ │ - Database  │ │ - Deploy    │ │ - HTTP      │    │   │
│  │  │ - Triggers  │ │ - Auth      │ │ - Domains   │ │ - Email     │    │   │
│  │  │ - Webhooks  │ │ - Storage   │ │ - Env vars  │ │ - Files     │    │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘    │   │
│  │                                                                       │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │   │
│  │  │   Voice     │ │    RAG      │ │   Memory    │ │  Context7   │    │   │
│  │  │    AI       │ │   Bots      │ │   (KG)      │ │   (Docs)    │    │   │
│  │  │             │ │             │ │             │ │             │    │   │
│  │  │ - Vapi      │ │ - Vectors   │ │ - User ctx  │ │ - Latest    │    │   │
│  │  │ - Twilio    │ │ - Pinecone  │ │ - Sessions  │ │   docs      │    │   │
│  │  │ - ElevenLab │ │ - Supabase  │ │ - History   │ │             │    │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘    │   │
│  │                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Deployment Infrastructure                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │    n8n      │  │  Supabase   │  │   Vercel    │  │  Cloudflare │        │
│  │   Cloud     │  │   (DB)      │  │  (Deploy)   │  │  (Workers)  │        │
│  │             │  │             │  │             │  │             │        │
│  │ Automations │  │ User data   │  │ Web apps    │  │ Edge funcs  │        │
│  │ Workflows   │  │ Vectors     │  │ APIs        │  │ KV storage  │        │
│  │ Webhooks    │  │ Auth        │  │             │  │             │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Product Categories

### 1. Automations (Priority)
Workflows that connect systems and automate tasks.

| Template | Description | Built With |
|----------|-------------|------------|
| **Lead Capture** | Form → CRM → Email sequence | n8n + Supabase |
| **Invoice Automation** | Order → Invoice → Payment reminder | n8n + Stripe |
| **Social Media** | Schedule → Post → Analytics | n8n + Buffer API |
| **Email Workflows** | Trigger → Personalize → Send | n8n + SendGrid |
| **Data Sync** | Source → Transform → Destination | n8n |
| **Webhook Handler** | Receive → Process → Action | n8n + Supabase |

### 2. AI Agents (Priority)
Conversational AI that works for their business.

| Template | Description | Built With |
|----------|-------------|------------|
| **Support Chatbot** | Answer FAQs, escalate to human | RAG + Supabase vectors |
| **Sales Assistant** | Qualify leads, book meetings | RAG + Cal.com |
| **Voice Receptionist** | Answer calls, take messages | Vapi + Twilio |
| **Document Q&A** | Upload docs, ask questions | RAG + Supabase |
| **Onboarding Bot** | Guide new users/customers | RAG + n8n triggers |

### 3. Web Apps (Future)
Full applications deployed to production.

| Template | Description | Built With |
|----------|-------------|------------|
| **Client Portal** | Login, view projects, documents | Next.js + Supabase |
| **Booking System** | Calendar, appointments, payments | Next.js + Stripe |
| **Dashboard** | Analytics, charts, data views | Next.js + Charts |

---

## User Flow

```
1. USER SIGNS UP
   └─► Creates account on allone.ge
   └─► Gets dashboard with empty products

2. USER OPENS AI STUDIO
   └─► "I need an automation that captures leads from my website
        and adds them to my CRM with an email notification"

3. ALLONE AI PROCESSES
   ├─► Understands intent (lead capture automation)
   ├─► Asks clarifying questions:
   │   - "What CRM do you use?" → HubSpot
   │   - "What info to capture?" → Name, email, phone
   │   - "Email notification to whom?" → sales@company.com
   └─► Generates plan and shows preview

4. USER CONFIRMS
   └─► "Yes, build this"

5. ALLONE AI BUILDS
   ├─► Creates n8n workflow
   ├─► Sets up webhook endpoint
   ├─► Configures CRM integration
   ├─► Sets up email notification
   └─► Deploys and activates

6. PRODUCT APPEARS ON DASHBOARD
   ┌────────────────────────────────────────┐
   │ Lead Capture Automation                │
   │ Status: ✓ Active                       │
   │ Webhook: https://n8n.allone.ge/xyz     │
   │ Captured: 47 leads this month          │
   │ [Edit] [Pause] [Delete]                │
   └────────────────────────────────────────┘

7. USAGE TRACKED
   └─► API calls, workflow executions, AI tokens
   └─► Billed based on usage tiers
```

---

## Backend Server Setup

### Option A: Railway Deployment (Recommended)
Single server running Claude Code with MCP tools, accessible via API.

```
┌─────────────────────────────────────────┐
│          Railway Container              │
├─────────────────────────────────────────┤
│  Node.js Server                         │
│  ├── Express API                        │
│  ├── Claude API Client                  │
│  ├── MCP Tool Handlers                  │
│  │   ├── n8n-mcp (workflow management)  │
│  │   ├── supabase-mcp (database ops)    │
│  │   ├── vercel-mcp (deployments)       │
│  │   └── native-access (HTTP, email)    │
│  └── Usage Tracking                     │
└─────────────────────────────────────────┘
```

### Environment Variables
```env
# Claude
ANTHROPIC_API_KEY=sk-ant-...

# n8n (Self-hosted or Cloud)
N8N_API_URL=https://n8n.allone.ge
N8N_API_KEY=...

# Supabase (for user data + vectors)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=...

# Vercel (for deployments)
VERCEL_TOKEN=...
VERCEL_TEAM_ID=...

# Voice AI
VAPI_API_KEY=...
ELEVENLABS_API_KEY=...

# Usage tracking
STRIPE_SECRET_KEY=...
```

### MCP Server Configuration
```json
{
  "mcpServers": {
    "n8n": {
      "command": "node",
      "args": ["./mcp-servers/n8n/server.js"],
      "env": {
        "N8N_API_URL": "${N8N_API_URL}",
        "N8N_API_KEY": "${N8N_API_KEY}"
      }
    },
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server"],
      "env": {
        "SUPABASE_URL": "${SUPABASE_URL}",
        "SUPABASE_SERVICE_KEY": "${SUPABASE_SERVICE_KEY}"
      }
    },
    "vercel": {
      "command": "node",
      "args": ["./mcp-servers/vercel/server.js"],
      "env": {
        "VERCEL_TOKEN": "${VERCEL_TOKEN}"
      }
    },
    "native-access": {
      "command": "node",
      "args": ["./mcp-servers/native-access/server.js"]
    }
  }
}
```

---

## Database Schema (Supabase)

### User Products Table
```sql
CREATE TABLE user_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Product info
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('automation', 'voice_agent', 'rag_bot', 'webapp')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'deploying', 'active', 'paused', 'error')),

  -- Deployment info
  deployment_url TEXT,
  deployment_id TEXT,
  webhook_url TEXT,

  -- Configuration
  config JSONB DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ
);
```

### Usage Tracking Table
```sql
CREATE TABLE usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES user_products(id) ON DELETE CASCADE,

  -- Event info
  event_type TEXT NOT NULL, -- 'api_call', 'workflow_run', 'ai_tokens', 'voice_minutes'
  quantity INTEGER DEFAULT 1,

  -- Billing
  unit_cost DECIMAL(10, 6),
  total_cost DECIMAL(10, 6),

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast billing queries
CREATE INDEX idx_usage_user_month ON usage_events (user_id, created_at);
```

### Pricing Tiers
```sql
CREATE TABLE pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,

  -- Included usage
  included_api_calls INTEGER DEFAULT 1000,
  included_workflow_runs INTEGER DEFAULT 500,
  included_ai_tokens INTEGER DEFAULT 100000,
  included_voice_minutes INTEGER DEFAULT 60,

  -- Overage pricing
  api_call_cost DECIMAL(10, 6) DEFAULT 0.001,      -- $0.001 per call
  workflow_run_cost DECIMAL(10, 6) DEFAULT 0.01,   -- $0.01 per run
  ai_token_cost DECIMAL(10, 6) DEFAULT 0.00001,    -- $0.00001 per token
  voice_minute_cost DECIMAL(10, 6) DEFAULT 0.10,   -- $0.10 per minute

  -- Base price
  monthly_base DECIMAL(10, 2) DEFAULT 0
);

-- Insert default tiers
INSERT INTO pricing_tiers (name, monthly_base, included_api_calls, included_workflow_runs, included_ai_tokens, included_voice_minutes) VALUES
  ('Free', 0, 100, 50, 10000, 5),
  ('Starter', 29, 1000, 500, 100000, 60),
  ('Pro', 99, 5000, 2500, 500000, 300),
  ('Business', 299, 25000, 10000, 2000000, 1000);
```

---

## API Endpoints

### Chat Endpoint (AI Studio)
```typescript
// POST /api/studio/chat
// Handles conversation with Claude + MCP tools

interface ChatRequest {
  messages: Message[];
  userId: string;
}

interface ChatResponse {
  message: string;
  action?: {
    type: 'create_product' | 'update_product' | 'deploy' | 'clarify';
    data: any;
  };
  usage: {
    tokens: number;
    cost: number;
  };
}
```

### Products CRUD
```typescript
// GET /api/products - List user's products
// POST /api/products - Create new product
// GET /api/products/:id - Get product details
// PATCH /api/products/:id - Update product
// DELETE /api/products/:id - Delete product
// POST /api/products/:id/deploy - Deploy/activate product
// POST /api/products/:id/pause - Pause product
```

### Usage & Billing
```typescript
// GET /api/usage - Get current usage stats
// GET /api/usage/history - Get usage history
// GET /api/billing/estimate - Get estimated bill
// POST /api/billing/checkout - Create checkout session
```

---

## System Prompt for ALLONE AI

```markdown
You are ALLONE AI, an AI assistant that helps non-technical founders build
business automations and AI agents. You have access to tools that can:

1. CREATE AUTOMATIONS using n8n workflows
2. BUILD AI AGENTS (chatbots, voice assistants, RAG systems)
3. DEPLOY products to production
4. MANAGE user's deployed products

## Your Personality
- Friendly but professional
- Explain technical concepts simply
- Ask clarifying questions when needed
- Show progress and celebrate wins

## When a user describes what they need:
1. Understand their business goal
2. Ask 2-3 clarifying questions maximum
3. Propose a solution with clear deliverables
4. Get confirmation before building
5. Build and deploy the solution
6. Explain how to use it

## Available Product Types:
- automation: n8n workflows for connecting systems
- voice_agent: Phone/web voice assistants
- rag_bot: Knowledge-base chatbots
- webapp: Full web applications (coming soon)

## Tools Available:
- n8n_create_workflow: Create automation workflows
- n8n_list_workflows: List existing workflows
- rag_create_bot: Create knowledge-base chatbot
- voice_create_agent: Create voice AI agent
- deploy_product: Deploy a product to production
- track_usage: Track API/usage for billing

Always confirm with the user before deploying anything.
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Set up n8n self-hosted instance
- [ ] Create n8n MCP server for workflow management
- [ ] Update AI Studio to use new backend
- [ ] Implement basic usage tracking

### Phase 2: Automations (Week 3-4)
- [ ] Build 5 automation templates
- [ ] Create workflow builder UI in dashboard
- [ ] Implement webhook management
- [ ] Add real-time status updates

### Phase 3: AI Agents (Week 5-6)
- [ ] Integrate RAG with Supabase vectors
- [ ] Add voice AI (Vapi/ElevenLabs)
- [ ] Build agent configuration UI
- [ ] Implement embedding pipeline

### Phase 4: Billing & Polish (Week 7-8)
- [ ] Implement usage-based billing
- [ ] Add Stripe integration
- [ ] Build analytics dashboard
- [ ] Performance optimization

---

## Key Differentiators

| Feature | Zapier/Make | Lindy AI | ALLONE AI |
|---------|-------------|----------|-----------|
| Build method | Visual builder | Natural language | Conversational AI |
| Products | Automations only | AI agents only | Both + Web apps |
| Customization | Templates | Limited | Full custom |
| Deployment | Their infra | Their infra | User's dashboard |
| Pricing | Per task | Per seat | Usage-based |
| Target | Technical users | Business ops | Non-tech founders |

---

## Next Steps

1. **Approve architecture** - Review and adjust this document
2. **Set up n8n** - Deploy n8n instance for workflow management
3. **Build n8n MCP** - Create MCP server to control n8n
4. **Update AI Studio** - Connect to new backend with product creation
5. **Build dashboard** - Show deployed products with status/controls
