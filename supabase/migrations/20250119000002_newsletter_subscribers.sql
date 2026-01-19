-- Newsletter Subscribers Table
-- Stores email subscribers for newsletter

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  source TEXT DEFAULT 'website',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_active ON newsletter_subscribers(is_active);

-- Enable RLS
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Public can insert (subscribe)
CREATE POLICY "Anyone can subscribe" ON newsletter_subscribers
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Authenticated users can view and manage
CREATE POLICY "Authenticated users can view subscribers" ON newsletter_subscribers
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update subscribers" ON newsletter_subscribers
  FOR UPDATE TO authenticated
  USING (true);

-- Service role full access
CREATE POLICY "Service role full access" ON newsletter_subscribers
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
