-- Durable intake sessions.
--
-- Until now the bot conversation lived ONLY in the visitor's browser tab: the
-- transcript sat in a React ref and the first (and only) DB write happened in
-- /api/bots/[slug]/submit, which fires when the model emits <<COMPLETE>> —
-- measured at 12+ real user turns for a maximally cooperative client, and
-- capped at 20. A visitor who answered eight questions and then closed the tab
-- left nothing behind at all. That is exactly what happened to the Longevity
-- Institute client, and why questionnaire_responses had no row for her.
--
-- bot_sessions is written on EVERY turn, so a partial conversation is always
-- recoverable and the visitor can resume where they left off.
CREATE TABLE IF NOT EXISTS bot_sessions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_slug     text NOT NULL,
  lead_id      uuid,
  client_name  text,
  -- Full [{role, content}] history, replaced wholesale each turn.
  transcript   jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- Real visitor turns (the hidden opening seed is not counted).
  turns        integer NOT NULL DEFAULT 0,
  -- Set once the session completes and a questionnaire_responses row exists.
  -- NULL = still open or abandoned.
  response_id  uuid REFERENCES questionnaire_responses(id) ON DELETE SET NULL,
  user_agent   text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bot_sessions_slug_updated_idx
  ON bot_sessions (bot_slug, updated_at DESC);

-- Fast lookup of the sessions the sales team actually cares about: the ones
-- that never turned into a response.
CREATE INDEX IF NOT EXISTS bot_sessions_abandoned_idx
  ON bot_sessions (updated_at DESC)
  WHERE response_id IS NULL;

-- Server-only table: every read/write goes through the service-role admin
-- client. RLS on with no policies = deny-all for anon/authenticated, while the
-- service role continues to bypass it.
ALTER TABLE bot_sessions ENABLE ROW LEVEL SECURITY;
