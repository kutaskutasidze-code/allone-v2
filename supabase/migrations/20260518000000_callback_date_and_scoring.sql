-- Add callback_date for scheduling follow-up calls
ALTER TABLE leads ADD COLUMN IF NOT EXISTS callback_date TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_leads_callback_date ON leads (callback_date) WHERE callback_date IS NOT NULL;

-- Recalculate relevance_score for infoshop leads based on data quality
-- Higher score = better sales prospect (no website = opportunity)
UPDATE leads SET relevance_score =
  CASE
    WHEN phone IS NOT NULL THEN 6 ELSE 0
  END +
  CASE
    WHEN phone IS NOT NULL AND phone LIKE '+9955%' THEN 2 ELSE 0
  END +
  CASE
    WHEN email IS NOT NULL THEN 2 ELSE 0
  END +
  CASE
    WHEN website IS NOT NULL AND website NOT ILIKE '%infoshop.ge%' THEN 2 ELSE 0
  END +
  CASE
    WHEN facebook_url IS NOT NULL THEN 1 ELSE 0
  END +
  CASE
    WHEN website IS NULL AND phone IS NOT NULL THEN 4 ELSE 0
  END +
  CASE
    WHEN industry IS NOT NULL THEN 1 ELSE 0
  END
WHERE source = 'infoshop.ge';
