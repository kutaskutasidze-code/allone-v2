// ---- OfferDraft: mirrors the shape produced by the offer-generator service ----

export interface OfferScopeLine {
  label: string;
  description: string;
  price: number;
}

export interface OfferStage {
  label: string;
  amount: number;
  when: string;
}

export interface OfferDraft {
  client_name: string;
  summary: string;
  scope_lines: OfferScopeLine[];
  price: number;
  currency: "GEL";
  schedule: OfferStage[];
  monthly_price?: number;
  monthly_opex: string;
  timeline: string;
  addons?: OfferScopeLine[];
}

// ---- Recipient: client's legal details for contract/invoice ----

export interface Recipient {
  name: string;
  id_code?: string;
  address?: string;
  representative?: string;
}

// ---- Proposal: mirrors the proposals DB table ----

export type ProposalStatus = "draft" | "approved" | "sent";

export interface Proposal {
  id: string;
  lead_id: string | null;
  source_response_id: string | null;
  client_name: string;
  doc_number: string | null;
  language: string;
  offer: OfferDraft;
  price: number | null;
  currency: string;
  status: ProposalStatus;
  offer_pdf_url: string | null;
  contract_pdf_url?: string | null;
  invoice_pdf_url?: string | null;
  recipient?: Recipient | null;
  created_by: string | null;
  source?: string | null;
  created_at: string;
  // send-layer fields
  sent_at?: string | null;
  recipient_email?: string | null;
  /** Joined from leads.email — not a DB column on proposals */
  lead_email?: string | null;
  /** Documents delivered to the client's chat thread */
  chat_documents?: { kind: string; label: string; url: string }[];
  // e-signature
  contract_signed_at?: string | null;
  signer_name?: string | null;
  signer_id_code?: string | null;
  // payment
  paid_at?: string | null;
  paid_amount_usd?: number | null;
  paid_amount_gel?: number | null;
  paypal_order_id?: string | null;
  paypal_capture_id?: string | null;
}

export interface CreateProposalInput {
  lead_id: string | null;
  source_response_id: string | null;
  client_name: string;
  doc_number: string;
  language: string;
  offer: OfferDraft;
  price: number;
  currency: string;
  status: ProposalStatus;
  created_by: string | null;
  source?: string;
}

export interface UpdateProposalPatch {
  offer?: OfferDraft;
  price?: number;
  status?: ProposalStatus;
  offer_pdf_url?: string;
  contract_pdf_url?: string;
  invoice_pdf_url?: string;
  recipient?: Recipient;
  sent_at?: string | null;
  recipient_email?: string | null;
  chat_documents?: { kind: string; label: string; url: string }[];
  contract_signed_at?: string | null;
  signer_name?: string | null;
  signer_id_code?: string | null;
  signature_image?: string | null;
  signer_ip?: string | null;
  paid_at?: string | null;
  paid_amount_usd?: number | null;
  paid_amount_gel?: number | null;
  paypal_order_id?: string | null;
  paypal_capture_id?: string | null;
  source?: string;
}
