-- ALLONE AI Platform - User Projects & Subscription Updates
-- This migration adds support for AI product builders (Voice AI, RAG Bots, Automations)

-- Enable pgvector extension for RAG embeddings (must be first)
CREATE EXTENSION IF NOT EXISTS vector;

-- User projects (AI products they create)
CREATE TABLE IF NOT EXISTS user_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('voice_agent', 'rag_bot', 'automation')),
  description TEXT,
  config JSONB NOT NULL DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'deleted')),
  external_id TEXT, -- ID in voice-noob or other external service
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add limits column to subscriptions if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'limits'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN limits JSONB DEFAULT '{"voice_agents": 3, "rag_bots": 5, "automations": 10}';
  END IF;
END $$;

-- RAG bot documents (for knowledge base)
CREATE TABLE IF NOT EXISTS rag_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES user_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT,
  embedding vector(1536), -- OpenAI ada-002 embeddings
  chunk_index INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RAG chat history
CREATE TABLE IF NOT EXISTS rag_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES user_projects(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_projects_user ON user_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_user_projects_type ON user_projects(type);
CREATE INDEX IF NOT EXISTS idx_user_projects_status ON user_projects(status);
CREATE INDEX IF NOT EXISTS idx_rag_documents_project ON rag_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_rag_conversations_project ON rag_conversations(project_id, session_id);

-- RLS Policies
ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_conversations ENABLE ROW LEVEL SECURITY;

-- Users can only see their own projects
CREATE POLICY "Users can view own projects" ON user_projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects" ON user_projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON user_projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON user_projects
  FOR DELETE USING (auth.uid() = user_id);

-- RAG documents follow project ownership
CREATE POLICY "Users can view own RAG docs" ON rag_documents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_projects WHERE id = project_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can manage own RAG docs" ON rag_documents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_projects WHERE id = project_id AND user_id = auth.uid())
  );

-- RAG conversations follow project ownership
CREATE POLICY "Users can view own conversations" ON rag_conversations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_projects WHERE id = project_id AND user_id = auth.uid())
  );

CREATE POLICY "Anyone can insert conversations" ON rag_conversations
  FOR INSERT WITH CHECK (true); -- Allow public chat with bots

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_user_projects_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_projects_updated_at ON user_projects;
CREATE TRIGGER user_projects_updated_at
  BEFORE UPDATE ON user_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_user_projects_timestamp();
