-- Normalized phone column (digits only) so search works regardless of formatting.
-- e.g. phone "+995 555 12 34 56" → phone_digits "995555123456".
-- Generated column means it auto-updates whenever phone changes; no triggers needed.
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS phone_digits TEXT
  GENERATED ALWAYS AS (regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g')) STORED;

CREATE INDEX IF NOT EXISTS leads_phone_digits_idx ON leads (phone_digits);
