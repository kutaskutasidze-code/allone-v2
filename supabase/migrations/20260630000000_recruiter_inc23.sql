-- Recruiter Increments 2 & 3: outbound-email bookkeeping + meeting columns.
-- All additive and idempotent.

ALTER TABLE job_applications
  ADD COLUMN IF NOT EXISTS ai_emailed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ai_email_status TEXT,
  ADD COLUMN IF NOT EXISTS meeting_status TEXT
    CHECK (meeting_status IN ('proposed', 'booked', 'cancelled')),
  ADD COLUMN IF NOT EXISTS meeting_starts_at TIMESTAMPTZ;

-- The cron looks up applications by their Plane card id.
CREATE INDEX IF NOT EXISTS idx_job_applications_plane_issue_id
  ON job_applications(plane_issue_id);

CREATE INDEX IF NOT EXISTS idx_job_applications_meeting_status
  ON job_applications(meeting_status);
