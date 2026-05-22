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
