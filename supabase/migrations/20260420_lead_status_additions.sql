-- Add 'not_interested' and 'unavailable' to allowed lead statuses
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE leads ADD CONSTRAINT leads_status_check
  CHECK (status IN ('new', 'contacted', 'qualified', 'won', 'lost', 'not_interested', 'unavailable'));
