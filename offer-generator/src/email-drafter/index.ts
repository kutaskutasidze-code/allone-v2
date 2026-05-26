import { supabase } from "../database/client.js";
import { logger } from "../utils/logger.js";
import {
  createEmailDraft,
  getEmailDraft,
  updateEmailDraftBody,
} from "../database/email-drafts.repo.js";
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
  demo_admin_url?: string;
  demo_job_id: string;
  audit: AuditSummary | null;
  offer_pdf_url?: string | null;
  sales_user_id?: string | null;
  sender?: { name: string; email: string; title?: string };
}

interface EmailTemplateRow {
  id: string;
  name: string;
  subject: string;
  body: string;
  language: "en" | "ka";
  segment: string | null;
  lead_source: string | null;
  is_active: boolean;
}

export async function draftEmail(input: DraftInput): Promise<EmailDraft> {
  const locale: "en" | "ka" = input.lead_locale ?? "en";
  const template = await pickTemplate({
    segment: input.segment,
    source: input.source,
    language: locale,
  });
  if (!template) {
    throw new Error(
      `No active email_templates row matches (segment=${input.segment}, source=${input.source}, language=${locale}). Seed one or run pnpm tsx scripts/seed-email-templates.ts.`,
    );
  }

  const variables = buildVariables(input);
  const subject = substitute(template.subject, variables);
  const body_html = substitute(template.body, variables);

  const draft = await createEmailDraft({
    lead_id: input.lead_id,
    demo_job_id: input.demo_job_id,
    sales_user_id: input.sales_user_id ?? null,
    email_template_id: template.id,
    subject,
    body_html,
    body_text: htmlToPlain(body_html),
    variables,
  });

  logger.info("email-drafter: draft created", {
    draftId: draft.id,
    templateName: template.name,
  });
  return draft;
}

export async function regenerateDraft(
  draftId: string,
  newVariables: Partial<DraftInput>,
): Promise<EmailDraft> {
  const existing = await getEmailDraft(draftId);
  if (!existing) throw new Error(`email_draft ${draftId} not found`);

  // Merge prior variables with new ones, re-render.
  const prior = (existing.variables ?? {}) as Record<string, unknown>;
  const merged: Record<string, unknown> = { ...prior };
  for (const [k, v] of Object.entries(buildPartialVariables(newVariables))) {
    if (v !== undefined && v !== null) merged[k] = v;
  }

  if (!existing.email_template_id)
    throw new Error("draft has no email_template_id");
  const template = await fetchTemplate(existing.email_template_id);
  if (!template)
    throw new Error(`email_template ${existing.email_template_id} not found`);

  const subject = substitute(template.subject, merged);
  const body_html = substitute(template.body, merged);
  await updateEmailDraftBody(draftId, {
    subject,
    body_html,
    body_text: htmlToPlain(body_html),
  });

  const updated = await getEmailDraft(draftId);
  if (!updated) throw new Error("draft disappeared after update");
  return updated;
}

// Template selection: best (segment + source + language) match, falling back
// through (null segment + source + language) → (null segment + null source + language) → English.
async function pickTemplate(filter: {
  segment: Segment;
  source: LeadSource;
  language: "en" | "ka";
}): Promise<EmailTemplateRow | null> {
  const tries: Array<Record<string, unknown>> = [
    {
      segment: filter.segment,
      lead_source: filter.source,
      language: filter.language,
    },
    { segment: null, lead_source: filter.source, language: filter.language },
    { segment: null, lead_source: null, language: filter.language },
    { segment: null, lead_source: filter.source, language: "en" },
    { segment: null, lead_source: null, language: "en" },
  ];
  for (const where of tries) {
    let query = supabase
      .from("email_templates")
      .select(
        "id, name, subject, body, language, segment, lead_source, is_active",
      )
      .eq("is_active", true);
    for (const [k, v] of Object.entries(where)) {
      query = v === null ? query.is(k, null) : query.eq(k, v as string);
    }
    const { data, error } = await query.limit(1).maybeSingle();
    if (error) {
      logger.warn("pickTemplate query failed", { where, error: error.message });
      continue;
    }
    if (data) return data as EmailTemplateRow;
  }
  return null;
}

async function fetchTemplate(id: string): Promise<EmailTemplateRow | null> {
  const { data, error } = await supabase
    .from("email_templates")
    .select(
      "id, name, subject, body, language, segment, lead_source, is_active",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as EmailTemplateRow | null) ?? null;
}

function buildVariables(input: DraftInput): Record<string, string> {
  const company = input.lead_company || input.lead_name || "your business";
  const firstName = input.lead_name.split(/\s+/)[0] || "there";
  const audit = input.audit;
  const topIssueSummary = audit?.topIssues?.length
    ? audit.topIssues
        .slice(0, 3)
        .map(
          (i, n) => `${n + 1}. ${i.headline} (${i.severity}) — ${i.oneLineFix}`,
        )
        .join("<br>")
    : "Your site is in good shape overall; we have a few performance + SEO opportunities to walk through.";

  return {
    "lead.name": input.lead_name,
    "lead.first_name": firstName,
    "lead.company": company,
    "lead.email": input.lead_email,
    "audit.top_issue_summary": topIssueSummary,
    "audit.score_overall": String(audit?.scores?.overall ?? "—"),
    "demo.url": input.demo_url,
    "demo.admin_url": input.demo_admin_url ?? input.demo_url,
    "offer.url": input.offer_pdf_url ?? "#",
    "sender.name": input.sender?.name ?? "Luka Adamia",
    "sender.email": input.sender?.email ?? "luka@allonelabs.com",
    "sender.title": input.sender?.title ?? "Founder, Allone Labs",
  };
}

function buildPartialVariables(
  input: Partial<DraftInput>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (input.demo_url) out["demo.url"] = input.demo_url;
  if (input.demo_admin_url) out["demo.admin_url"] = input.demo_admin_url;
  if (input.offer_pdf_url) out["offer.url"] = input.offer_pdf_url;
  if (input.audit) {
    out["audit.score_overall"] = String(input.audit.scores?.overall ?? "—");
    if (input.audit.topIssues?.length) {
      out["audit.top_issue_summary"] = input.audit.topIssues
        .slice(0, 3)
        .map(
          (i, n) => `${n + 1}. ${i.headline} (${i.severity}) — ${i.oneLineFix}`,
        )
        .join("<br>");
    }
  }
  return out;
}

// Substitute {{var}} markers, surviving missing vars (they stay as the literal
// text so the sales user can spot what's missing instead of getting "undefined").
function substitute(template: string, vars: Record<string, unknown>): string {
  return template.replace(
    /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g,
    (_match, key: string) => {
      const v = vars[key];
      if (v === undefined || v === null) return `{{${key}}}`;
      return String(v);
    },
  );
}

function htmlToPlain(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}
