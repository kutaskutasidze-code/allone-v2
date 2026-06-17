-- AI-drafted commercial offers. One row per offer attempt for a lead.
-- scope/pricing live as jsonb; status walks draft -> approved -> sent.
CREATE TABLE IF NOT EXISTS proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  source_response_id uuid REFERENCES questionnaire_responses(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  doc_number text,
  language text NOT NULL DEFAULT 'ka',
  offer jsonb NOT NULL,            -- OfferDraft: summary, scope_lines[], price, currency, schedule[], timeline
  price numeric(12,2),             -- editable headline price (mirrors offer.price for querying)
  currency text NOT NULL DEFAULT 'GEL',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','sent')),
  offer_pdf_url text,
  created_by uuid REFERENCES sales_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_proposals_lead ON proposals(lead_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);

DROP TRIGGER IF EXISTS update_proposals_updated_at ON proposals;
CREATE TRIGGER update_proposals_updated_at
  BEFORE UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
