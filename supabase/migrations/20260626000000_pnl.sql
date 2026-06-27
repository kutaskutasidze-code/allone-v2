-- ALLONE P&L tables: the investor PLAN (fixed, imported once) and the ACTUAL
-- (maintained in the CRM going forward). 24 months, M1 = April 2026, USD.
-- Access is admin-only via service-role API routes — RLS on, no public policies.

CREATE TABLE IF NOT EXISTS pnl_plan (
  line_key   TEXT NOT NULL,
  month_idx  INT  NOT NULL CHECK (month_idx BETWEEN 1 AND 24),
  value      NUMERIC(14,2),
  text_value TEXT,
  PRIMARY KEY (line_key, month_idx)
);

CREATE TABLE IF NOT EXISTS pnl_actual (
  line_key   TEXT NOT NULL,
  month_idx  INT  NOT NULL CHECK (month_idx BETWEEN 1 AND 24),
  value      NUMERIC(14,2),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (line_key, month_idx)
);

ALTER TABLE pnl_plan   ENABLE ROW LEVEL SECURITY;
ALTER TABLE pnl_actual ENABLE ROW LEVEL SECURITY;
