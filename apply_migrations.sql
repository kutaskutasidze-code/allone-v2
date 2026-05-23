-- ============================================================
-- BEGIN: 20260519000000_status_changed_at.sql
-- ============================================================
-- Tracks when a lead's status was last changed.
-- Updated only by the API when the status field is part of an update payload.
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Backfill: for existing rows, the closest signal we have is updated_at,
-- falling back to created_at if updated_at is null.
UPDATE leads
  SET status_changed_at = COALESCE(updated_at, created_at)
  WHERE status_changed_at IS NULL
     OR status_changed_at >= NOW() - INTERVAL '1 minute';

-- ============================================================
-- BEGIN: 20260519010000_phone_digits.sql
-- ============================================================
-- Normalized phone column (digits only) so search works regardless of formatting.
-- e.g. phone "+995 555 12 34 56" → phone_digits "995555123456".
-- Generated column means it auto-updates whenever phone changes; no triggers needed.
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS phone_digits TEXT
  GENERATED ALWAYS AS (regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g')) STORED;

CREATE INDEX IF NOT EXISTS leads_phone_digits_idx ON leads (phone_digits);

-- ============================================================
-- BEGIN: 20260519020000_categorize_leads.sql
-- ============================================================
-- Standardize lead "industry" values into a fixed canonical list of 18 categories.
-- Preserves the original scraped value in `industry_raw` so we can re-map later if a rule misses.

-- 1. Snapshot original values
ALTER TABLE leads ADD COLUMN IF NOT EXISTS industry_raw TEXT;
UPDATE leads SET industry_raw = industry WHERE industry_raw IS NULL;

-- 2. Map existing free-text industry values to canonical categories.
--    Order matters: more specific patterns first.

UPDATE leads SET industry = 'Hotels'
  WHERE industry ILIKE '%hotel%' OR industry ILIKE '%hostel%' OR industry ILIKE '%guesthouse%'
     OR industry ILIKE '%guest house%' OR industry ILIKE '%resort%' OR industry ILIKE '%lodging%'
     OR industry ILIKE '%accommodation%' OR industry ILIKE '%b&b%' OR industry ILIKE '%inn%'
     OR industry ILIKE '%სასტუმრო%';

UPDATE leads SET industry = 'Restaurants & Cafes'
  WHERE industry ILIKE '%restaurant%' OR industry ILIKE '%cafe%' OR industry ILIKE '%café%'
     OR industry ILIKE '%bistro%' OR industry ILIKE '%bar%' OR industry ILIKE '%pub%'
     OR industry ILIKE '%bakery%' OR industry ILIKE '%pizza%' OR industry ILIKE '%food%'
     OR industry ILIKE '%dining%' OR industry ILIKE '%eatery%' OR industry ILIKE '%catering%'
     OR industry ILIKE '%რესტორან%' OR industry ILIKE '%კაფე%';

UPDATE leads SET industry = 'E-commerce'
  WHERE industry ILIKE '%e-commerce%' OR industry ILIKE '%ecommerce%'
     OR industry ILIKE '%online shop%' OR industry ILIKE '%online store%'
     OR industry ILIKE '%webshop%' OR industry ILIKE '%online retail%';

UPDATE leads SET industry = 'Shops / Retail'
  WHERE industry ILIKE '%shop%' OR industry ILIKE '%store%' OR industry ILIKE '%retail%'
     OR industry ILIKE '%boutique%' OR industry ILIKE '%market%' OR industry ILIKE '%supermarket%'
     OR industry ILIKE '%მაღაზია%';

UPDATE leads SET industry = 'Real Estate'
  WHERE industry ILIKE '%real estate%' OR industry ILIKE '%realtor%' OR industry ILIKE '%realty%'
     OR industry ILIKE '%property%' OR industry ILIKE '%broker%' OR industry ILIKE '%agent%'
     OR industry ILIKE '%უძრავი%';

UPDATE leads SET industry = 'Law Firms'
  WHERE industry ILIKE '%law%' OR industry ILIKE '%legal%' OR industry ILIKE '%attorney%'
     OR industry ILIKE '%lawyer%' OR industry ILIKE '%advocate%' OR industry ILIKE '%notary%'
     OR industry ILIKE '%იურიდიუ%' OR industry ILIKE '%ადვოკატ%';

UPDATE leads SET industry = 'Medical / Clinics'
  WHERE industry ILIKE '%medical%' OR industry ILIKE '%clinic%' OR industry ILIKE '%hospital%'
     OR industry ILIKE '%doctor%' OR industry ILIKE '%dental%' OR industry ILIKE '%dentist%'
     OR industry ILIKE '%pharmacy%' OR industry ILIKE '%pharma%' OR industry ILIKE '%health%'
     OR industry ILIKE '%veterinary%' OR industry ILIKE '%vet %' OR industry ILIKE '%therapist%'
     OR industry ILIKE '%კლინიკ%' OR industry ILIKE '%სამედიცინო%' OR industry ILIKE '%აფთიაქ%';

UPDATE leads SET industry = 'Beauty & Wellness'
  WHERE industry ILIKE '%beauty%' OR industry ILIKE '%salon%' OR industry ILIKE '%spa%'
     OR industry ILIKE '%wellness%' OR industry ILIKE '%cosmetic%' OR industry ILIKE '%barber%'
     OR industry ILIKE '%massage%' OR industry ILIKE '%gym%' OR industry ILIKE '%fitness%'
     OR industry ILIKE '%yoga%' OR industry ILIKE '%nail%' OR industry ILIKE '%hair%'
     OR industry ILIKE '%სილამაზე%' OR industry ILIKE '%სალონ%';

UPDATE leads SET industry = 'Education / Schools'
  WHERE industry ILIKE '%school%' OR industry ILIKE '%education%' OR industry ILIKE '%university%'
     OR industry ILIKE '%college%' OR industry ILIKE '%academy%' OR industry ILIKE '%tutor%'
     OR industry ILIKE '%training%' OR industry ILIKE '%kindergarten%' OR industry ILIKE '%course%'
     OR industry ILIKE '%სკოლა%' OR industry ILIKE '%განათლება%' OR industry ILIKE '%უნივერსიტეტ%';

UPDATE leads SET industry = 'Construction'
  WHERE industry ILIKE '%construction%' OR industry ILIKE '%builder%' OR industry ILIKE '%building%'
     OR industry ILIKE '%contractor%' OR industry ILIKE '%renovation%' OR industry ILIKE '%plumbing%'
     OR industry ILIKE '%electrical%' OR industry ILIKE '%remodel%' OR industry ILIKE '%roofing%'
     OR industry ILIKE '%architect%' OR industry ILIKE '%სამშენებლო%' OR industry ILIKE '%მშენებლობა%';

UPDATE leads SET industry = 'Manufacturing / Production'
  WHERE industry ILIKE '%manufact%' OR industry ILIKE '%production%' OR industry ILIKE '%factory%'
     OR industry ILIKE '%industrial%' OR industry ILIKE '%producer%' OR industry ILIKE '%plant%'
     OR industry ILIKE '%წარმოება%';

UPDATE leads SET industry = 'Logistics / Transport'
  WHERE industry ILIKE '%logistic%' OR industry ILIKE '%transport%' OR industry ILIKE '%shipping%'
     OR industry ILIKE '%delivery%' OR industry ILIKE '%freight%' OR industry ILIKE '%cargo%'
     OR industry ILIKE '%taxi%' OR industry ILIKE '%courier%' OR industry ILIKE '%moving%'
     OR industry ILIKE '%ლოგისტიკ%' OR industry ILIKE '%ტრანსპორტ%';

UPDATE leads SET industry = 'Finance / Insurance'
  WHERE industry ILIKE '%bank%' OR industry ILIKE '%finance%' OR industry ILIKE '%financial%'
     OR industry ILIKE '%insurance%' OR industry ILIKE '%investment%' OR industry ILIKE '%credit%'
     OR industry ILIKE '%loan%' OR industry ILIKE '%accounting%' OR industry ILIKE '%audit%'
     OR industry ILIKE '%bookkeeping%' OR industry ILIKE '%ბანკ%' OR industry ILIKE '%ფინანს%'
     OR industry ILIKE '%დაზღვევ%';

UPDATE leads SET industry = 'IT / Tech'
  WHERE industry ILIKE '%it %' OR industry ILIKE '% it' OR industry ILIKE 'it'
     OR industry ILIKE '%tech%' OR industry ILIKE '%software%' OR industry ILIKE '%computer%'
     OR industry ILIKE '%web%dev%' OR industry ILIKE '%programming%' OR industry ILIKE '%cybersecurity%'
     OR industry ILIKE '%saas%' OR industry ILIKE '%digital%' OR industry ILIKE '%data%';

UPDATE leads SET industry = 'Marketing / Advertising'
  WHERE industry ILIKE '%marketing%' OR industry ILIKE '%advertising%' OR industry ILIKE '%pr %'
     OR industry ILIKE '%agency%' OR industry ILIKE '%media%' OR industry ILIKE '%design%'
     OR industry ILIKE '%branding%' OR industry ILIKE '%seo%' OR industry ILIKE '%creative%'
     OR industry ILIKE '%სარეკლამო%' OR industry ILIKE '%მარკეტინგ%';

UPDATE leads SET industry = 'Auto / Car services'
  WHERE industry ILIKE '%auto%' OR industry ILIKE '%car%' OR industry ILIKE '%vehicle%'
     OR industry ILIKE '%mechanic%' OR industry ILIKE '%tire%' OR industry ILIKE '%garage%'
     OR industry ILIKE '%autoservice%' OR industry ILIKE '%automotive%' OR industry ILIKE '%body shop%'
     OR industry ILIKE '%ავტო%';

UPDATE leads SET industry = 'Professional Services'
  WHERE industry ILIKE '%consult%' OR industry ILIKE '%business services%'
     OR industry ILIKE '%professional services%' OR industry ILIKE '%translation%'
     OR industry ILIKE '%hr%' OR industry ILIKE '%recruit%' OR industry ILIKE '%legal services%';

-- 3. Everything that didn't match a rule → 'Other'
UPDATE leads SET industry = 'Other'
  WHERE industry IS NOT NULL AND industry NOT IN (
    'Hotels', 'Restaurants & Cafes', 'Shops / Retail', 'E-commerce',
    'Real Estate', 'Law Firms', 'Medical / Clinics', 'Beauty & Wellness',
    'Education / Schools', 'Construction', 'Manufacturing / Production',
    'Logistics / Transport', 'Finance / Insurance', 'IT / Tech',
    'Marketing / Advertising', 'Auto / Car services',
    'Professional Services', 'Other'
  );

-- 4. Index for fast filtering
CREATE INDEX IF NOT EXISTS leads_industry_idx ON leads (industry);

-- ============================================================
-- BEGIN: 20260522000000_lead_assignment.sql
-- ============================================================
-- Per-rep lead assignment workflow.
-- Tracks when and by whom a lead was assigned to a sales user.
-- Combined with `status_changed_at` (from 20260519000000) and `lead_status_history`,
-- this lets the admin see daily activity by rep and enforce the
-- "touched lead is permanently owned" rule in the assign API.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES sales_users(id) ON DELETE SET NULL;

-- Backfill: existing assigned leads get assigned_at = updated_at (best signal we have).
UPDATE leads
  SET assigned_at = COALESCE(updated_at, created_at)
  WHERE sales_user_id IS NOT NULL
    AND assigned_at IS NULL;

-- Fast lookup for the "unassigned pool" admin view.
CREATE INDEX IF NOT EXISTS leads_unassigned_idx
  ON leads (created_at DESC)
  WHERE sales_user_id IS NULL;

-- Fast lookup for "leads assigned to me today" — the rep's daily queue.
CREATE INDEX IF NOT EXISTS leads_sales_user_assigned_idx
  ON leads (sales_user_id, assigned_at DESC)
  WHERE sales_user_id IS NOT NULL;

-- Auto-update assigned_at whenever sales_user_id changes.
-- (Set to NULL when the lead is sent back to the pool.)
CREATE OR REPLACE FUNCTION set_lead_assigned_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sales_user_id IS DISTINCT FROM OLD.sales_user_id THEN
    IF NEW.sales_user_id IS NULL THEN
      NEW.assigned_at := NULL;
      NEW.assigned_by := NULL;
    ELSE
      NEW.assigned_at := NOW();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leads_set_assigned_at ON leads;
CREATE TRIGGER leads_set_assigned_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION set_lead_assigned_at();

-- Also stamp it on inserts that already have a sales_user_id.
CREATE OR REPLACE FUNCTION set_lead_assigned_at_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sales_user_id IS NOT NULL AND NEW.assigned_at IS NULL THEN
    NEW.assigned_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leads_set_assigned_at_insert ON leads;
CREATE TRIGGER leads_set_assigned_at_insert
  BEFORE INSERT ON leads
  FOR EACH ROW EXECUTE FUNCTION set_lead_assigned_at_on_insert();

-- ============================================================
-- BEGIN: 20260522010000_daily_target.sql
-- ============================================================
-- Per-rep daily call target. Admin sets it from the dashboard; the sales
-- dashboard progress bar uses it instead of guessing from "leads assigned today."
ALTER TABLE sales_users
  ADD COLUMN IF NOT EXISTS daily_target INTEGER NOT NULL DEFAULT 80
  CHECK (daily_target >= 0 AND daily_target <= 10000);

-- ============================================================
-- BEGIN: 20260522020000_callback_at.sql
-- ============================================================
-- Optional callback scheduling. When a rep moves a lead to status='callback',
-- they pick a date — that goes here. Admin and rep dashboards both query this
-- to show "callbacks due today" and "overdue callbacks."
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS callback_at TIMESTAMPTZ;

-- Fast lookup for "callbacks due today" per rep — the most common read.
CREATE INDEX IF NOT EXISTS leads_callback_at_idx
  ON leads (sales_user_id, callback_at)
  WHERE callback_at IS NOT NULL;

-- ============================================================
-- BEGIN: 20260523000000_sales_user_is_active.sql
-- ============================================================
-- Soft-delete flag for sales reps. Admin "Deactivate" hides the rep from
-- assignment + scorecard pools but preserves their historical lead ownership.
ALTER TABLE sales_users
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS sales_users_active_idx
  ON sales_users (is_active)
  WHERE is_active = TRUE;

-- ============================================================
-- BEGIN: 20260524000000_sales_user_industries.sql
-- ============================================================
-- Per-rep industry coverage. Drives the "Distribute by specialty" admin
-- action: law firm leads → reps who cover Law Firms, hotel leads → reps
-- who cover Hotels, etc. Values must come from the canonical 18-industry
-- list defined in 20260519020000_categorize_leads.sql; the API validates.
ALTER TABLE sales_users
  ADD COLUMN IF NOT EXISTS industries TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS sales_users_industries_idx
  ON sales_users USING GIN (industries);
