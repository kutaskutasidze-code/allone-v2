-- Per-rep daily call target. Admin sets it from the dashboard; the sales
-- dashboard progress bar uses it instead of guessing from "leads assigned today."
ALTER TABLE sales_users
  ADD COLUMN IF NOT EXISTS daily_target INTEGER NOT NULL DEFAULT 80
  CHECK (daily_target >= 0 AND daily_target <= 10000);
