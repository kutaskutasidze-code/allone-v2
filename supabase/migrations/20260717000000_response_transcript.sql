-- Persist the raw bot conversation transcript alongside the extracted answers.
-- Until now only the distilled `answers` survived, so a bad extraction was
-- unrecoverable and there was no conversation history for QA / re-extraction /
-- conversation intelligence. Additive + nullable; applied via the Management
-- API on 2026-07-17.
ALTER TABLE questionnaire_responses ADD COLUMN IF NOT EXISTS transcript jsonb;
