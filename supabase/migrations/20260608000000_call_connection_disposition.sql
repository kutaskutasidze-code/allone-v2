-- Split call logging into two questions:
--   outcome (Connection): contacted | no_answer | wrong_number
--   disposition (the result, only when contacted): interested | not_interested | callback_requested
-- The old single `outcome` field made "Connected" mutually exclusive with
-- "Not interested"/"Callback", so the connected count undercounted real
-- conversations. Now outcome='contacted' = reached a person; the result lives
-- in `disposition`. Idempotent / re-runnable.

ALTER TABLE calls ADD COLUMN IF NOT EXISTS disposition text;

-- Drop the old CHECK first so the backfill can write the new 'contacted' value.
ALTER TABLE calls DROP CONSTRAINT IF EXISTS calls_outcome_check;

-- Backfill old single-field outcomes into (connection, disposition). Disable
-- USER triggers so this mass update doesn't bump updated_at on every row.
ALTER TABLE calls DISABLE TRIGGER USER;
UPDATE calls SET outcome = 'contacted', disposition = NULL                 WHERE outcome = 'connected';
UPDATE calls SET outcome = 'contacted', disposition = 'not_interested'     WHERE outcome = 'not_interested';
UPDATE calls SET outcome = 'contacted', disposition = 'callback_requested' WHERE outcome = 'callback_requested';
UPDATE calls SET outcome = 'no_answer'                                     WHERE outcome IN ('voicemail', 'busy');
ALTER TABLE calls ENABLE TRIGGER USER;

-- Tighten constraints to the new model.
ALTER TABLE calls ADD CONSTRAINT calls_outcome_check
  CHECK (outcome IN ('contacted', 'no_answer', 'wrong_number'));

ALTER TABLE calls DROP CONSTRAINT IF EXISTS calls_disposition_check;
ALTER TABLE calls ADD CONSTRAINT calls_disposition_check
  CHECK (disposition IS NULL
    OR (outcome = 'contacted'
        AND disposition IN ('interested', 'not_interested', 'callback_requested')));

-- One-time data fix: before this change the call route never synced lead status,
-- so leads whose rep logged "not interested" on a call were left open. Set those
-- to Lost — matching what the new disposition auto-sync does going forward.
-- Guarded so it only touches still-open leads that were NOT re-engaged (no call
-- after the not-interested one). Re-runnable: already-lost leads are excluded.
UPDATE leads l
SET status = 'lost',
    lost_reason = 'not_interested'
WHERE l.status NOT IN ('won', 'lost')
  AND EXISTS (
    SELECT 1 FROM calls c
    WHERE c.lead_id = l.id AND c.disposition = 'not_interested'
  )
  AND NOT EXISTS (
    SELECT 1 FROM calls c2
    WHERE c2.lead_id = l.id
      AND c2.occurred_at > (
        SELECT max(c3.occurred_at) FROM calls c3
        WHERE c3.lead_id = l.id AND c3.disposition = 'not_interested'
      )
  );
