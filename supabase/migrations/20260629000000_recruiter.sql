-- Recruiter pipeline: AI ranking columns on job_applications + email-channel table.
ALTER TABLE job_applications
  ADD COLUMN IF NOT EXISTS ai_score INT,
  ADD COLUMN IF NOT EXISTS ai_decision TEXT CHECK (ai_decision IN ('meeting','reject')),
  ADD COLUMN IF NOT EXISTS ai_confidence NUMERIC,
  ADD COLUMN IF NOT EXISTS ai_language TEXT,
  ADD COLUMN IF NOT EXISTS ai_rationale TEXT,
  ADD COLUMN IF NOT EXISTS ai_strengths JSONB,
  ADD COLUMN IF NOT EXISTS ai_gaps JSONB,
  ADD COLUMN IF NOT EXISTS proposed_slots JSONB,
  ADD COLUMN IF NOT EXISTS plane_issue_id TEXT,
  ADD COLUMN IF NOT EXISTS ai_ranked_at TIMESTAMPTZ;

-- Allow an explicit interview stage (meeting booked) alongside the existing values.
ALTER TABLE job_applications DROP CONSTRAINT IF EXISTS job_applications_status_check;
ALTER TABLE job_applications ADD CONSTRAINT job_applications_status_check
  CHECK (status IN ('new','reviewing','shortlisted','interview','rejected','hired'));

CREATE INDEX IF NOT EXISTS idx_job_applications_ai_ranked_at ON job_applications(ai_ranked_at);

-- Email-channel candidates + dead-letter (used by a later increment; created now so the schema is stable).
CREATE TABLE IF NOT EXISTS recruiter_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL CHECK (source IN ('web','email')),
  external_id TEXT NOT NULL,
  email TEXT,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  ai_score INT,
  ai_decision TEXT,
  plane_issue_id TEXT,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (source, external_id)
);
