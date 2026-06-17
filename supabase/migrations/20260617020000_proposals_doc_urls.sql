ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS contract_pdf_url text,
  ADD COLUMN IF NOT EXISTS invoice_pdf_url text,
  ADD COLUMN IF NOT EXISTS recipient jsonb;  -- {name, id_code, address, representative}
