-- In-chat PayPal payment recorded against the proposal.
ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS paid_amount_usd numeric(12,2),
  ADD COLUMN IF NOT EXISTS paid_amount_gel numeric(12,2),
  ADD COLUMN IF NOT EXISTS paypal_order_id text,
  ADD COLUMN IF NOT EXISTS paypal_capture_id text;
