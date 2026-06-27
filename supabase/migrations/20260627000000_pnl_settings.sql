-- Editable P&L settings (currently the USD/GEL rate used for auto-fed actuals).
CREATE TABLE IF NOT EXISTS pnl_settings (
  key   TEXT PRIMARY KEY,
  value NUMERIC(14,4)
);
INSERT INTO pnl_settings (key, value) VALUES ('usd_gel_rate', 2.7)
  ON CONFLICT (key) DO NOTHING;
ALTER TABLE pnl_settings ENABLE ROW LEVEL SECURITY;
