-- Migration: status_backfill  (Phase 2, step C)  *** AT-RISK — REMAPS ~25.5k LEADS ***
-- Remaps the old 8 statuses to the new 7, migrates callbacks→follow-up tasks, and
-- seeds a synthetic no_answer call per old 'unavailable' lead. The remap is LOSSY
-- (contacted+callback both → in_process), so SQL cannot reverse it.
-- >>> A FULL leads BACKUP WAS TAKEN (~/allone-db-backups/leads_*). Restore from it to roll back. <<<
--
-- User triggers on `leads` are DISABLED around the UPDATEs so the bulk remap does NOT
-- bump status_changed_at (would look "worked today") or write ~2k junk rows into
-- lead_status_history. They are re-enabled immediately after.
--
-- PRECHECK (record): SELECT status, count(*) FROM leads GROUP BY status ORDER BY status;
--   Expected before: new 23537, contacted 810, not_interested 617, unavailable 425,
--                    callback 141, qualified 19, lost 6, won 1.

-- (1) Capture callback intent as follow-up tasks BEFORE flipping status (reads original status).
INSERT INTO tasks (lead_id, sales_user_id, title, due_at, status)
  SELECT id, sales_user_id, 'Follow up (migrated from callback)', callback_at, 'open'
  FROM leads WHERE status = 'callback' AND callback_at IS NOT NULL;

-- (2) Seed a synthetic no_answer call for each 'unavailable' lead so they enter the retry flow.
INSERT INTO calls (lead_id, sales_user_id, direction, outcome, occurred_at, notes)
  SELECT id, sales_user_id, 'outbound', 'no_answer',
         COALESCE(status_changed_at, updated_at, NOW()),
         'Migrated from "unavailable" status'
  FROM leads WHERE status = 'unavailable';

-- (3) Remap statuses with leads triggers disabled (avoids polluting timestamps + history).
ALTER TABLE leads DISABLE TRIGGER USER;
UPDATE leads SET status='lost', lost_reason='not_interested' WHERE status='not_interested';
UPDATE leads SET status='in_process' WHERE status IN ('contacted','callback');
UPDATE leads SET status='interested' WHERE status='qualified';
UPDATE leads SET status='new'        WHERE status='unavailable';
ALTER TABLE leads ENABLE TRIGGER USER;

-- (4) Tighten the CHECK to the new 7 (only the new vocab may exist now).
ALTER TABLE leads DROP CONSTRAINT leads_status_check;
ALTER TABLE leads ADD CONSTRAINT leads_status_check CHECK (status IN
  ('new','in_process','interested','proposal','won','lost','on_hold'));

-- VERIFY (after):
--   SELECT status, count(*) FROM leads GROUP BY status ORDER BY status;
--     Expected: new 23962, in_process 951, interested 19, lost 623, won 1.  (on_hold/proposal 0)
--   SELECT count(*) FROM leads;                                  -- 25556 (unchanged)
--   SELECT count(*) FROM leads WHERE status NOT IN
--     ('new','in_process','interested','proposal','won','lost','on_hold');  -- 0
--   SELECT count(*) FROM leads WHERE status='won';               -- 1 (won_at preserved)
--   SELECT count(*) FROM tasks WHERE title LIKE 'Follow up (migrated%';     -- 26
--   SELECT count(*) FROM calls WHERE notes='Migrated from "unavailable" status'; -- 425
--   -- triggers re-enabled:
--   SELECT tgname, tgenabled FROM pg_trigger WHERE tgrelid='leads'::regclass AND NOT tgisinternal;
--     -- tgenabled must be 'O' (origin/enabled) for all, not 'D'.
--
-- ROLLBACK: restore leads from the backup (the remap is not invertible in SQL);
--   DELETE FROM tasks WHERE title LIKE 'Follow up (migrated%';
--   DELETE FROM calls WHERE notes='Migrated from "unavailable" status';
--   then re-widen the status CHECK if needed.
