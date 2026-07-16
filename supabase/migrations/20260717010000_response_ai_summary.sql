-- Cache the AI conversation brief (headline, needs, budget/timeline, objections,
-- sentiment, next step) generated over an intake response's transcript, so it's
-- computed once and shown to sales. Additive + nullable; applied via the
-- Management API on 2026-07-17.
ALTER TABLE questionnaire_responses ADD COLUMN IF NOT EXISTS ai_summary jsonb;
