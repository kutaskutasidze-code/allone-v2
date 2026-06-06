-- Per-deal payment / installment tracking.
-- Each row is ONE installment of a deal: an amount, an optional due date, and
-- paid_at (NULL = still owed, set = collected). The deal total stays on
-- leads.value; Paid = SUM(amount) WHERE paid_at IS NOT NULL, Owed = value - Paid.
-- Mirrors the calls/tasks/meetings child-of-leads shape, including RLS.
-- Idempotent so it can be re-applied (history table is drifted from this repo).

CREATE TABLE IF NOT EXISTS lead_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  due_date date,
  paid_at timestamptz,            -- NULL = owed, set = collected
  label text,                     -- "Advance 30%", "Final 70%", "Month 1"…
  note text,
  created_by uuid REFERENCES sales_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_payments_lead ON lead_payments(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_payments_due_unpaid ON lead_payments(due_date) WHERE paid_at IS NULL;

DROP TRIGGER IF EXISTS update_lead_payments_updated_at ON lead_payments;
CREATE TRIGGER update_lead_payments_updated_at
  BEFORE UPDATE ON lead_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE lead_payments ENABLE ROW LEVEL SECURITY;

-- Reps manage payments for leads they own; staff (admin/supervisor) read all.
-- (The APIs use the service-role client, which bypasses RLS — these guard direct
--  client reads, same posture as calls/tasks/meetings.)
DROP POLICY IF EXISTS "Reps read own lead_payments" ON lead_payments;
CREATE POLICY "Reps read own lead_payments" ON lead_payments FOR SELECT TO authenticated
  USING (lead_id IN (SELECT id FROM leads WHERE sales_user_id IN
    (SELECT id FROM sales_users WHERE lower(email) = lower(auth.jwt()->>'email'))));

DROP POLICY IF EXISTS "Reps insert own lead_payments" ON lead_payments;
CREATE POLICY "Reps insert own lead_payments" ON lead_payments FOR INSERT TO authenticated
  WITH CHECK (lead_id IN (SELECT id FROM leads WHERE sales_user_id IN
    (SELECT id FROM sales_users WHERE lower(email) = lower(auth.jwt()->>'email'))));

DROP POLICY IF EXISTS "Reps update own lead_payments" ON lead_payments;
CREATE POLICY "Reps update own lead_payments" ON lead_payments FOR UPDATE TO authenticated
  USING (lead_id IN (SELECT id FROM leads WHERE sales_user_id IN
    (SELECT id FROM sales_users WHERE lower(email) = lower(auth.jwt()->>'email'))));

DROP POLICY IF EXISTS "Reps delete own lead_payments" ON lead_payments;
CREATE POLICY "Reps delete own lead_payments" ON lead_payments FOR DELETE TO authenticated
  USING (lead_id IN (SELECT id FROM leads WHERE sales_user_id IN
    (SELECT id FROM sales_users WHERE lower(email) = lower(auth.jwt()->>'email'))));

DROP POLICY IF EXISTS "Staff read all lead_payments" ON lead_payments;
CREATE POLICY "Staff read all lead_payments" ON lead_payments FOR SELECT TO authenticated
  USING (is_supervisor_or_admin(auth.jwt()->>'email'));
