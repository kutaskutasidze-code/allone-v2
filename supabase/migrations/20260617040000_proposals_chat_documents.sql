ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS chat_documents jsonb NOT NULL DEFAULT '[]'::jsonb;
