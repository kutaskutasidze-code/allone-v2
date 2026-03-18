-- Bridge config table for storing telegram bot token
CREATE TABLE IF NOT EXISTS bridge_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Allow public read/write (temporary setup)
ALTER TABLE bridge_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read bridge config" ON bridge_config
  FOR SELECT USING (true);

CREATE POLICY "Anyone can write bridge config" ON bridge_config
  FOR ALL USING (true) WITH CHECK (true);
