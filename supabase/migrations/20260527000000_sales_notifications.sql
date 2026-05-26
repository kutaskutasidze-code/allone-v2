-- Sales team notifications (Telegram-first; channel_type column kept open
-- for adding 'whatsapp' or 'email' later).
--
-- Adds:
--   1. sales_users.role + timezone columns (role was assumed by earlier RLS
--      policies but never created; this fills the gap).
--   2. notification_channels — one row per sales_user × channel binding.
--   3. notification_connect_tokens — one-time deep-link tokens for the
--      "click here to connect your Telegram" flow.
--   4. notification_sends — audit log of every message dispatched.

-- ============================================================================
-- 1. Extend sales_users
-- ============================================================================

ALTER TABLE sales_users
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'sales'
    CHECK (role IN ('sales', 'admin')),
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'Asia/Tbilisi';

CREATE INDEX IF NOT EXISTS idx_sales_users_role ON sales_users(role);

-- ============================================================================
-- 2. notification_channels
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_user_id UUID NOT NULL REFERENCES sales_users(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL CHECK (channel_type IN ('telegram', 'whatsapp', 'email')),
  -- Telegram chat id (numeric, stored as text since it can be a large int)
  telegram_chat_id TEXT,
  telegram_username TEXT,
  -- Future: WhatsApp wa_id, email override, etc.
  is_active BOOLEAN NOT NULL DEFAULT true,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (sales_user_id, channel_type)
);

CREATE INDEX IF NOT EXISTS idx_notification_channels_user
  ON notification_channels(sales_user_id) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_notification_channels_chat
  ON notification_channels(telegram_chat_id) WHERE telegram_chat_id IS NOT NULL;

CREATE TRIGGER update_notification_channels_updated_at
  BEFORE UPDATE ON notification_channels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 3. notification_connect_tokens — single-use, short-lived
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_connect_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_user_id UUID NOT NULL REFERENCES sales_users(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL CHECK (channel_type IN ('telegram', 'whatsapp')),
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes'),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_connect_tokens_token
  ON notification_connect_tokens(token) WHERE used_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_connect_tokens_user
  ON notification_connect_tokens(sales_user_id);

-- ============================================================================
-- 4. notification_sends — audit log
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_user_id UUID NOT NULL REFERENCES sales_users(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL,
  message_type TEXT NOT NULL,    -- 'daily_aim' | 'daily_report' | 'weekly_aim' | 'weekly_report' | 'monthly_aim' | 'monthly_report' | 'admin_rollup'
  -- Window the message refers to (e.g., '2026-05-27' for daily, '2026-W22' for weekly)
  period_key TEXT,
  payload JSONB,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  error TEXT,
  external_id TEXT               -- Telegram message_id, for future delete/edit
);

CREATE INDEX IF NOT EXISTS idx_notification_sends_user_sent
  ON notification_sends(sales_user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_sends_period
  ON notification_sends(sales_user_id, message_type, period_key);

-- ============================================================================
-- 5. RLS — sales users see their own bindings + sends; admins see all.
-- ============================================================================

ALTER TABLE notification_channels        ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_connect_tokens  ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_sends           ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sales users read own channels" ON notification_channels
  FOR SELECT TO authenticated
  USING (
    sales_user_id IN (
      SELECT id FROM sales_users WHERE email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Sales users update own channels" ON notification_channels
  FOR UPDATE TO authenticated
  USING (
    sales_user_id IN (
      SELECT id FROM sales_users WHERE email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Sales users delete own channels" ON notification_channels
  FOR DELETE TO authenticated
  USING (
    sales_user_id IN (
      SELECT id FROM sales_users WHERE email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Sales users read own sends" ON notification_sends
  FOR SELECT TO authenticated
  USING (
    sales_user_id IN (
      SELECT id FROM sales_users WHERE email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Admins read all channels" ON notification_channels
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sales_users
      WHERE email = auth.jwt()->>'email' AND role = 'admin'
    )
  );

CREATE POLICY "Admins read all sends" ON notification_sends
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sales_users
      WHERE email = auth.jwt()->>'email' AND role = 'admin'
    )
  );

-- connect_tokens are only ever read by the service role from the webhook
-- (no RLS read policy needed).
