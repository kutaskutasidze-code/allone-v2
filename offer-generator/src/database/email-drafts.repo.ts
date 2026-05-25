import { supabase } from "./client.js";
import type { EmailDraft } from "../types/demo.js";

export async function createEmailDraft(input: {
  lead_id: string;
  demo_job_id?: string | null;
  sales_user_id?: string | null;
  email_template_id?: string | null;
  subject: string;
  body_html: string;
  body_text?: string | null;
  variables?: Record<string, unknown> | null;
}): Promise<EmailDraft> {
  const { data, error } = await supabase
    .from("email_drafts")
    .insert({
      lead_id: input.lead_id,
      demo_job_id: input.demo_job_id ?? null,
      sales_user_id: input.sales_user_id ?? null,
      email_template_id: input.email_template_id ?? null,
      subject: input.subject,
      body_html: input.body_html,
      body_text: input.body_text ?? null,
      variables: input.variables ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as EmailDraft;
}

export async function getEmailDraft(id: string): Promise<EmailDraft | null> {
  const { data, error } = await supabase
    .from("email_drafts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as EmailDraft | null) ?? null;
}

export async function updateEmailDraftBody(
  id: string,
  patch: { subject?: string; body_html?: string; body_text?: string },
): Promise<void> {
  const { error } = await supabase
    .from("email_drafts")
    .update(patch)
    .eq("id", id);
  if (error) throw error;
}

export async function markEmailDraftSent(id: string): Promise<void> {
  const { error } = await supabase
    .from("email_drafts")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function markEmailDraftRevoked(id: string): Promise<void> {
  const { error } = await supabase
    .from("email_drafts")
    .update({ status: "revoked" })
    .eq("id", id);
  if (error) throw error;
}
