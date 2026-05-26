-- Add 'callback' to allowed lead statuses
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE leads ADD CONSTRAINT leads_status_check
  CHECK (status IN ('new', 'contacted', 'callback', 'qualified', 'won', 'lost', 'not_interested', 'unavailable'));
