import { supabase } from "./client.js";
import { logger } from "../utils/logger.js";
import type {
  DemoJob,
  DemoStatus,
  DemoJobPhaseEntry,
  AuditSummary,
} from "../types/demo.js";

export async function createDemoJob(input: {
  lead_id: string;
  sales_user_id?: string | null;
}): Promise<DemoJob> {
  const { data, error } = await supabase
    .from("demo_jobs")
    .insert({
      lead_id: input.lead_id,
      sales_user_id: input.sales_user_id ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as DemoJob;
}

export async function getDemoJob(id: string): Promise<DemoJob | null> {
  const { data, error } = await supabase
    .from("demo_jobs")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as DemoJob | null) ?? null;
}

export async function listDemoJobs(filter: {
  lead_id?: string;
  status?: DemoStatus;
  limit?: number;
}): Promise<DemoJob[]> {
  let q = supabase
    .from("demo_jobs")
    .select("*")
    .order("created_at", { ascending: false });
  if (filter.lead_id) q = q.eq("lead_id", filter.lead_id);
  if (filter.status) q = q.eq("status", filter.status);
  if (filter.limit) q = q.limit(filter.limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data as DemoJob[]) ?? [];
}

export async function updateDemoJobPhase(
  id: string,
  phase: string,
  status: DemoStatus,
  progress: number,
): Promise<void> {
  const { error } = await supabase
    .from("demo_jobs")
    .update({ current_phase: phase, status, progress })
    .eq("id", id);
  if (error)
    logger.error("Failed to update demo job phase", { id, phase, error });
}

export async function appendPhaseHistory(
  id: string,
  entry: DemoJobPhaseEntry,
): Promise<void> {
  const job = await getDemoJob(id);
  if (!job) throw new Error(`demo_job ${id} not found`);
  const history = [...(job.phase_history ?? []), entry];
  const { error } = await supabase
    .from("demo_jobs")
    .update({ phase_history: history })
    .eq("id", id);
  if (error) throw error;
}

export async function setDemoUrl(
  id: string,
  demo_url: string,
  demo_vercel_project_id: string,
): Promise<void> {
  const { error } = await supabase
    .from("demo_jobs")
    .update({ demo_url, demo_vercel_project_id })
    .eq("id", id);
  if (error) throw error;
}

export async function setAuditResults(
  id: string,
  audit: AuditSummary,
): Promise<void> {
  const { error } = await supabase
    .from("demo_jobs")
    .update({ audit_results: audit as unknown as Record<string, unknown> })
    .eq("id", id);
  if (error) throw error;
}

export async function setReferenceTemplate(
  id: string,
  reference_template_id: string,
): Promise<void> {
  const { error } = await supabase
    .from("demo_jobs")
    .update({ reference_template_id })
    .eq("id", id);
  if (error) throw error;
}

export async function setEmailDraftId(
  id: string,
  email_draft_id: string,
): Promise<void> {
  const { error } = await supabase
    .from("demo_jobs")
    .update({ email_draft_id })
    .eq("id", id);
  if (error) throw error;
}

export async function failDemoJob(
  id: string,
  error_message: string,
): Promise<void> {
  const { error } = await supabase
    .from("demo_jobs")
    .update({ status: "failed", error_message })
    .eq("id", id);
  if (error) logger.error("Failed to mark demo job as failed", { id, error });
}

export async function markDraftReady(id: string): Promise<void> {
  const { error } = await supabase
    .from("demo_jobs")
    .update({ status: "draft_ready", current_phase: null, progress: 100 })
    .eq("id", id);
  if (error) throw error;
}
