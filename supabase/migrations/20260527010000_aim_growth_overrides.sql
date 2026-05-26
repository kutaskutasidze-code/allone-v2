-- Per-user, per-metric growth-pct override for aim computation.
-- When absent for a (sales_user_id, metric), the aim engine falls back to
-- the hardcoded DEFAULT_GROWTH_PCT in src/lib/sales-aims.ts.

CREATE TABLE IF NOT EXISTS aim_growth_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_user_id UUID NOT NULL REFERENCES sales_users(id) ON DELETE CASCADE,
  metric TEXT NOT NULL CHECK (metric IN (
    'leads_contacted',
    'leads_qualified',
    'leads_won_count',
    'leads_won_revenue',
    'demos_sent',
    'demos_engaged'
  )),
  growth_pct INTEGER NOT NULL CHECK (growth_pct BETWEEN -100 AND 500),
  set_by UUID REFERENCES sales_users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (sales_user_id, metric)
);

CREATE INDEX IF NOT EXISTS idx_aim_growth_user ON aim_growth_overrides(sales_user_id);

ALTER TABLE aim_growth_overrides ENABLE ROW LEVEL SECURITY;

-- Admins read + write all rows.
CREATE POLICY "Admins manage aim growth overrides" ON aim_growth_overrides
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sales_users
      WHERE email = auth.jwt()->>'email' AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sales_users
      WHERE email = auth.jwt()->>'email' AND role = 'admin'
    )
  );

-- Sales users read their own override values so the dashboard can show them.
CREATE POLICY "Sales users read own overrides" ON aim_growth_overrides
  FOR SELECT TO authenticated
  USING (
    sales_user_id IN (
      SELECT id FROM sales_users WHERE email = auth.jwt()->>'email'
    )
  );
