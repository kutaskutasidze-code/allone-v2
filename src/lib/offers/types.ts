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
  monthly_opex: string;
  timeline: string;
  addons?: OfferScopeLine[];
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
  created_by: string | null;
  created_at: string;
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
}

export interface UpdateProposalPatch {
  offer?: OfferDraft;
  price?: number;
  status?: ProposalStatus;
  offer_pdf_url?: string;
}
