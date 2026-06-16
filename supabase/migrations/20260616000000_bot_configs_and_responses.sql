-- Config-driven questionnaire bots + their shared answer sink.
-- bot_configs: one row per bot (questions stored as jsonb).
-- questionnaire_responses: one row per completed submission; lead_id optional.
-- Idempotent so it can be re-applied.

CREATE TABLE IF NOT EXISTS bot_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  client_name text NOT NULL,
  title text NOT NULL,
  intro text,
  language text NOT NULL DEFAULT 'ka',
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES sales_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bot_configs_slug ON bot_configs(slug);

CREATE TABLE IF NOT EXISTS questionnaire_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_slug text NOT NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  client_name text,
  respondent_name text,
  answers jsonb NOT NULL,
  user_agent text,
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_qr_bot_slug ON questionnaire_responses(bot_slug);
CREATE INDEX IF NOT EXISTS idx_qr_lead ON questionnaire_responses(lead_id);

DROP TRIGGER IF EXISTS update_bot_configs_updated_at ON bot_configs;
CREATE TRIGGER update_bot_configs_updated_at
  BEFORE UPDATE ON bot_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE bot_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_responses ENABLE ROW LEVEL SECURITY;
