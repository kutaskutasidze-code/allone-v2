-- ALLONE Improvements Migration
-- 1. Chat history tables
-- 2. PayPal plan IDs storage
-- 3. Avatar support in profiles

-- =====================================================
-- CHAT HISTORY
-- =====================================================

CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New Chat',
  is_starred BOOLEAN DEFAULT FALSE,
  product_created_id UUID REFERENCES user_products(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_starred ON chat_sessions(user_id, is_starred) WHERE is_starred = true;
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);

-- RLS
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own chat sessions" ON chat_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage messages in own sessions" ON chat_messages
  FOR ALL USING (
    session_id IN (SELECT id FROM chat_sessions WHERE user_id = auth.uid())
  );

-- =====================================================
-- SUBSCRIPTION TIERS (Updated)
-- =====================================================

-- Update pricing_tiers with PayPal plan IDs
ALTER TABLE pricing_tiers ADD COLUMN IF NOT EXISTS paypal_plan_id TEXT;
ALTER TABLE pricing_tiers ADD COLUMN IF NOT EXISTS paypal_product_id TEXT;

-- Update tiers with correct pricing
UPDATE pricing_tiers SET
  monthly_base = 0,
  max_products = 1,
  max_knowledge_bases = 0,
  included_api_calls = 50,
  included_workflow_runs = 10,
  included_voice_minutes = 0
WHERE name = 'Free';

UPDATE pricing_tiers SET
  monthly_base = 29,
  max_products = 5,
  max_knowledge_bases = 2,
  included_api_calls = 500,
  included_workflow_runs = 100,
  included_voice_minutes = 30
WHERE name = 'Starter';

UPDATE pricing_tiers SET
  monthly_base = 99,
  max_products = 20,
  max_knowledge_bases = 10,
  included_api_calls = 2500,
  included_workflow_runs = 500,
  included_voice_minutes = 120
WHERE name = 'Pro';

UPDATE pricing_tiers SET
  monthly_base = 299,
  max_products = -1,
  max_knowledge_bases = -1,
  included_api_calls = 10000,
  included_workflow_runs = 2000,
  included_voice_minutes = 500
WHERE name = 'Business';

-- =====================================================
-- PROFILE AVATAR SUPPORT
-- =====================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_style TEXT DEFAULT 'avataaars';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_seed TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS custom_avatar_url TEXT;

-- =====================================================
-- AUTO-UPDATE TIMESTAMPS
-- =====================================================

CREATE TRIGGER IF NOT EXISTS update_chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
