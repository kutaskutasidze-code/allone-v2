-- Migration: status_model_widen  (Phase 2, step A)
-- ADDITIVE + zero-risk. Widens leads.status to accept BOTH the old vocabulary and
-- the new one (a strict superset — every existing row stays legal), and adds a
-- nullable lost_reason. No row is read, modified, or deleted. The actual remap of
-- existing rows happens later in 20260604020000_status_backfill.sql (the at-risk
-- step, behind a backup).
--
-- Final new vocabulary: new, in_process, interested, proposal, won, lost, on_hold.
-- No backup required for THIS migration (additive only).
--
-- PRECHECK: SELECT status, count(*) FROM leads GROUP BY status ORDER BY status;

-- (1) Widen the status CHECK to old(8) UNION new(7). Name-agnostic drop of the
--     lead-status CHECK only — narrowed by requiring a 'new' literal in the
--     definition (only the lead-status CHECK has it; enrichment_status does not).
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.leads'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
      AND pg_get_constraintdef(oid) ILIKE '%''new''%'
      AND pg_get_constraintdef(oid) NOT ILIKE '%enrichment%'
  LOOP
    EXECUTE format('ALTER TABLE leads DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE leads ADD CONSTRAINT leads_status_check CHECK (status IN (
  'new','contacted','callback','qualified','won','lost','not_interested','unavailable',  -- old
  'in_process','interested','proposal','on_hold'                                          -- new (new/won/lost shared)
));

-- (2) lost_reason: nullable, enum-checked, and only permitted on lost rows.
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lost_reason TEXT;
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_lost_reason_check;
ALTER TABLE leads ADD CONSTRAINT leads_lost_reason_check
  CHECK (lost_reason IS NULL OR lost_reason IN
    ('not_interested','no_budget','unreachable','bad_fit','competitor','timing','other'));
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_lost_reason_requires_lost;
ALTER TABLE leads ADD CONSTRAINT leads_lost_reason_requires_lost
  CHECK (lost_reason IS NULL OR status = 'lost');

-- VERIFY (after): a new value is accepted, row count unchanged:
--   BEGIN; UPDATE leads SET status='in_process' WHERE id=(SELECT id FROM leads LIMIT 1); ROLLBACK;
--   SELECT count(*) FROM leads;   -- == baseline
--
-- ROLLBACK:
--   ALTER TABLE leads DROP CONSTRAINT leads_lost_reason_requires_lost;
--   ALTER TABLE leads DROP CONSTRAINT leads_lost_reason_check;
--   ALTER TABLE leads DROP COLUMN lost_reason;
--   ALTER TABLE leads DROP CONSTRAINT leads_status_check;
--   ALTER TABLE leads ADD CONSTRAINT leads_status_check CHECK (status IN
--     ('new','contacted','callback','qualified','won','lost','not_interested','unavailable'));
