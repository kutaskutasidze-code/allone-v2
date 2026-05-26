-- Per-rep industry coverage. Drives the "Distribute by specialty" admin
-- action: law firm leads → reps who cover Law Firms, hotel leads → reps
-- who cover Hotels, etc. Values must come from the canonical 18-industry
-- list defined in 20260519020000_categorize_leads.sql; the API validates.
ALTER TABLE sales_users
  ADD COLUMN IF NOT EXISTS industries TEXT[] NOT NULL DEFAULT '{}';

-- GIN index so "which reps cover industry X?" stays fast as the team grows.
CREATE INDEX IF NOT EXISTS sales_users_industries_idx
  ON sales_users USING GIN (industries);
