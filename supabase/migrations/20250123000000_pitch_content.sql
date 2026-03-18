-- Pitch content table for editable pitch deck text
CREATE TABLE IF NOT EXISTS pitch_content (
  id integer PRIMARY KEY DEFAULT 1,
  content jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Allow public read, authenticated write
ALTER TABLE pitch_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read pitch content" ON pitch_content
  FOR SELECT USING (true);

CREATE POLICY "Anyone can update pitch content" ON pitch_content
  FOR ALL USING (true) WITH CHECK (true);

-- Insert default empty row
INSERT INTO pitch_content (id, content) VALUES (1, '{}')
ON CONFLICT (id) DO NOTHING;
