-- Soft-delete flag for sales reps. Admin "Deactivate" hides the rep from
-- assignment + scorecard pools but preserves their historical lead ownership.
ALTER TABLE sales_users
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS sales_users_active_idx
  ON sales_users (is_active)
  WHERE is_active = TRUE;
