-- User Products Schema for ALLONE AI
-- Tracks all products (automations, AI agents, web apps) created by users

-- Product types enum
CREATE TYPE product_type AS ENUM ('automation', 'voice_agent', 'rag_bot', 'webapp');
CREATE TYPE product_status AS ENUM ('draft', 'deploying', 'active', 'paused', 'error');

-- Main products table
CREATE TABLE IF NOT EXISTS user_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Product info
  name TEXT NOT NULL,
  description TEXT,
  type product_type NOT NULL,
  status product_status DEFAULT 'draft',

  -- Deployment info
  deployment_url TEXT,
  deployment_id TEXT,
  webhook_url TEXT,

  -- n8n specific
  n8n_workflow_id TEXT,

  -- AI agent specific
  agent_config JSONB DEFAULT '{}',
  system_prompt TEXT,
  knowledge_base_id UUID,

  -- Configuration
  config JSONB DEFAULT '{}',

  -- Stats
  total_executions INTEGER DEFAULT 0,
  successful_executions INTEGER DEFAULT 0,
  failed_executions INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_name CHECK (char_length(name) >= 1 AND char_length(name) <= 100)
);

-- Usage events table for billing
CREATE TABLE IF NOT EXISTS usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES user_products(id) ON DELETE SET NULL,

  -- Event info
  event_type TEXT NOT NULL, -- 'api_call', 'workflow_run', 'ai_tokens', 'voice_minutes', 'storage_mb'
  quantity DECIMAL(15, 6) DEFAULT 1,

  -- Billing
  unit_cost DECIMAL(10, 6),
  total_cost DECIMAL(10, 6),

  -- Context
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge bases for RAG bots
CREATE TABLE IF NOT EXISTS knowledge_bases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,

  -- Stats
  document_count INTEGER DEFAULT 0,
  total_chunks INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents in knowledge bases
CREATE TABLE IF NOT EXISTS knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_base_id UUID NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,

  -- Document info
  name TEXT NOT NULL,
  file_type TEXT,
  file_url TEXT,

  -- Processing status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
  error_message TEXT,

  -- Stats
  chunk_count INTEGER DEFAULT 0,
  token_count INTEGER DEFAULT 0,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Embeddings for RAG (using pgvector)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS knowledge_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  knowledge_base_id UUID NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,

  -- Content
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI ada-002 dimension

  -- Chunk info
  chunk_index INTEGER,
  token_count INTEGER,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pricing tiers
CREATE TABLE IF NOT EXISTS pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,

  -- Included usage per month
  included_api_calls INTEGER DEFAULT 0,
  included_workflow_runs INTEGER DEFAULT 0,
  included_ai_tokens INTEGER DEFAULT 0,
  included_voice_minutes INTEGER DEFAULT 0,
  included_storage_mb INTEGER DEFAULT 0,

  -- Overage pricing (per unit)
  api_call_cost DECIMAL(10, 6) DEFAULT 0.001,
  workflow_run_cost DECIMAL(10, 6) DEFAULT 0.01,
  ai_token_cost DECIMAL(10, 6) DEFAULT 0.00001,
  voice_minute_cost DECIMAL(10, 6) DEFAULT 0.10,
  storage_mb_cost DECIMAL(10, 6) DEFAULT 0.05,

  -- Base price
  monthly_base DECIMAL(10, 2) DEFAULT 0,

  -- Limits
  max_products INTEGER DEFAULT 5,
  max_knowledge_bases INTEGER DEFAULT 1,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User tier assignments
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pricing_tier_id UUID REFERENCES pricing_tiers(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS usage_reset_at TIMESTAMPTZ DEFAULT NOW();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_products_user ON user_products(user_id);
CREATE INDEX IF NOT EXISTS idx_user_products_type ON user_products(type);
CREATE INDEX IF NOT EXISTS idx_user_products_status ON user_products(status);
CREATE INDEX IF NOT EXISTS idx_usage_events_user_month ON usage_events(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_usage_events_product ON usage_events(product_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_base ON knowledge_embeddings(knowledge_base_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_vector ON knowledge_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Row Level Security
ALTER TABLE user_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_embeddings ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only access their own data
CREATE POLICY "Users can view own products" ON user_products
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own products" ON user_products
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products" ON user_products
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own products" ON user_products
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own usage" ON usage_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own knowledge bases" ON knowledge_bases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own knowledge bases" ON knowledge_bases
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own documents" ON knowledge_documents
  FOR SELECT USING (
    knowledge_base_id IN (
      SELECT id FROM knowledge_bases WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own documents" ON knowledge_documents
  FOR ALL USING (
    knowledge_base_id IN (
      SELECT id FROM knowledge_bases WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own embeddings" ON knowledge_embeddings
  FOR SELECT USING (
    knowledge_base_id IN (
      SELECT id FROM knowledge_bases WHERE user_id = auth.uid()
    )
  );

-- Service role has full access (for backend operations)
CREATE POLICY "Service role full access products" ON user_products
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access usage" ON usage_events
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access embeddings" ON knowledge_embeddings
  FOR ALL USING (auth.role() = 'service_role');

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_products_updated_at
  BEFORE UPDATE ON user_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_knowledge_bases_updated_at
  BEFORE UPDATE ON knowledge_bases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Insert default pricing tiers
INSERT INTO pricing_tiers (name, monthly_base, included_api_calls, included_workflow_runs, included_ai_tokens, included_voice_minutes, included_storage_mb, max_products, max_knowledge_bases) VALUES
  ('Free', 0, 100, 50, 10000, 5, 100, 3, 1),
  ('Starter', 29, 1000, 500, 100000, 60, 1000, 10, 3),
  ('Pro', 99, 5000, 2500, 500000, 300, 5000, 50, 10),
  ('Business', 299, 25000, 10000, 2000000, 1000, 25000, -1, -1) -- -1 = unlimited
ON CONFLICT (name) DO NOTHING;

-- Function to get user's current usage
CREATE OR REPLACE FUNCTION get_user_usage(p_user_id UUID, p_start_date TIMESTAMPTZ DEFAULT NULL)
RETURNS TABLE (
  event_type TEXT,
  total_quantity DECIMAL,
  total_cost DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ue.event_type,
    SUM(ue.quantity) as total_quantity,
    SUM(ue.total_cost) as total_cost
  FROM usage_events ue
  WHERE ue.user_id = p_user_id
    AND ue.created_at >= COALESCE(p_start_date, date_trunc('month', NOW()))
  GROUP BY ue.event_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record usage
CREATE OR REPLACE FUNCTION record_usage(
  p_user_id UUID,
  p_product_id UUID,
  p_event_type TEXT,
  p_quantity DECIMAL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_tier pricing_tiers%ROWTYPE;
  v_unit_cost DECIMAL;
  v_event_id UUID;
BEGIN
  -- Get user's pricing tier
  SELECT pt.* INTO v_tier
  FROM profiles p
  JOIN pricing_tiers pt ON pt.id = p.pricing_tier_id
  WHERE p.id = p_user_id;

  -- Default to free tier if none assigned
  IF v_tier.id IS NULL THEN
    SELECT * INTO v_tier FROM pricing_tiers WHERE name = 'Free';
  END IF;

  -- Determine unit cost based on event type
  v_unit_cost := CASE p_event_type
    WHEN 'api_call' THEN v_tier.api_call_cost
    WHEN 'workflow_run' THEN v_tier.workflow_run_cost
    WHEN 'ai_tokens' THEN v_tier.ai_token_cost
    WHEN 'voice_minutes' THEN v_tier.voice_minute_cost
    WHEN 'storage_mb' THEN v_tier.storage_mb_cost
    ELSE 0
  END;

  -- Insert usage event
  INSERT INTO usage_events (user_id, product_id, event_type, quantity, unit_cost, total_cost, metadata)
  VALUES (p_user_id, p_product_id, p_event_type, p_quantity, v_unit_cost, p_quantity * v_unit_cost, p_metadata)
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
