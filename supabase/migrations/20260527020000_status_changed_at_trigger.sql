-- Auto-set leads.status_changed_at whenever the status field actually
-- changes. The previous design relied on every API route remembering to
-- write the column, which silently failed in /api/admin/leads/[id] and
-- /api/sales/leads/[id] — so analytics that bucket by transition time
-- (Aims & results, daily-activity) showed 0 for everything.

CREATE OR REPLACE FUNCTION set_status_changed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status_changed_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leads_status_changed_at ON leads;
CREATE TRIGGER leads_status_changed_at
  BEFORE UPDATE OF status ON leads
  FOR EACH ROW
  EXECUTE FUNCTION set_status_changed_at();
