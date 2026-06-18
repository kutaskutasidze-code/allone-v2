-- In-chat e-signature of the contract. Recorded against the proposal.
ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS contract_signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS signer_name text,
  ADD COLUMN IF NOT EXISTS signer_id_code text,
  ADD COLUMN IF NOT EXISTS signature_image text,   -- base64 PNG of the drawn signature
  ADD COLUMN IF NOT EXISTS signer_ip text;
