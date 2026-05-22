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
