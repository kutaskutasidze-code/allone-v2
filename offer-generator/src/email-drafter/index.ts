import type {
  AuditSummary,
  EmailDraft,
  LeadSource,
  Segment,
} from "../types/demo.js";

export interface DraftInput {
  lead_id: string;
  lead_name: string;
  lead_company: string | null;
  lead_email: string;
  lead_locale?: "en" | "ka";
  segment: Segment;
  source: LeadSource;
  demo_url: string;
  demo_job_id: string;
  audit: AuditSummary | null;
  offer_pdf_url?: string | null;
  sales_user_id?: string | null;
}

// Loads the matching email_templates row by (segment, lead_source, locale),
// substitutes variables deterministically (no LLM), creates an email_drafts
// row with status=draft, returns it.
//
// Variables expected in templates:
//   {{lead.name}} {{lead.company}}
//   {{audit.top_issue_summary}} {{audit.score_overall}}
//   {{demo.url}} {{offer.url}}
//   {{sender.name}} {{sender.email}}
//
// Slice 7: real implementation.
export async function draftEmail(input: DraftInput): Promise<EmailDraft> {
  throw new Error(
    "NotImplemented: email-drafter.draftEmail — wired in Slice 7",
  );
}

// Re-renders an existing draft with updated variables (e.g. after regenerate demo).
export async function regenerateDraft(
  draftId: string,
  newVariables: Partial<DraftInput>,
): Promise<EmailDraft> {
  throw new Error(
    "NotImplemented: email-drafter.regenerateDraft — wired in Slice 7",
  );
}
