-- Website self-serve bot: FAQ knowledge for the shared bot, a source tag on
-- proposals, and a tiny rate-limit log. Idempotent.

ALTER TABLE bot_configs   ADD COLUMN IF NOT EXISTS knowledge text;
ALTER TABLE proposals     ADD COLUMN IF NOT EXISTS source text;

CREATE TABLE IF NOT EXISTS self_serve_rl (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_self_serve_rl_ip_ts
  ON self_serve_rl(ip, created_at DESC);

ALTER TABLE self_serve_rl ENABLE ROW LEVEL SECURITY;
