-- Add Google Places Georgia as a lead source
INSERT INTO lead_sources (id, name, source_type, base_url, countries, is_active, scrape_config)
VALUES (
  gen_random_uuid(),
  'Google Places Georgia',
  'maps',
  'https://places.googleapis.com',
  ARRAY['GE'],
  true,
  '{"cities": ["Tbilisi", "Batumi", "Kutaisi", "Rustavi", "Zugdidi"], "maxPagesPerSearch": 3}'
);

-- Add index for phone-based deduplication
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone) WHERE phone IS NOT NULL;

-- Add index for enrichment queries (leads with website but no phone)
CREATE INDEX IF NOT EXISTS idx_leads_enrich ON leads(country, is_scraped) WHERE phone IS NULL AND website IS NOT NULL;
