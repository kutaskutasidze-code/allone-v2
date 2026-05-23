-- Optional callback scheduling. When a rep moves a lead to status='callback',
-- they pick a date — that goes here. Admin and rep dashboards both query this
-- to show "callbacks due today" and "overdue callbacks."
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS callback_at TIMESTAMPTZ;

-- Fast lookup for "callbacks due today" per rep — the most common read.
CREATE INDEX IF NOT EXISTS leads_callback_at_idx
  ON leads (sales_user_id, callback_at)
  WHERE callback_at IS NOT NULL;
