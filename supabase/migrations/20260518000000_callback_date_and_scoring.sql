-- Add callback_date for scheduling follow-up calls
ALTER TABLE leads ADD COLUMN IF NOT EXISTS callback_date TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_leads_callback_date ON leads (callback_date) WHERE callback_date IS NOT NULL;
