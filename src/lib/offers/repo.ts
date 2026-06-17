import { createAdminClient } from "@/lib/supabase/admin";
import type { QuestionnaireResponse } from "@/lib/bots/types";
import type {
  Proposal,
  CreateProposalInput,
  UpdateProposalPatch,
} from "./types";

// ---------------------------------------------------------------------------
// Proposals CRUD
// ---------------------------------------------------------------------------

export async function listProposals(leadId?: string): Promise<Proposal[]> {
  const db = createAdminClient();
  let q = db
    .from("proposals")
    .select("*")
    .order("created_at", { ascending: false });
  if (leadId) q = q.eq("lead_id", leadId);
  const { data, error } = await q;
  if (error) throw error;
  return (data as Proposal[]) ?? [];
}

export async function getProposal(id: string): Promise<Proposal | null> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("proposals")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as Proposal) ?? null;
}

export async function createProposal(
  input: CreateProposalInput,
): Promise<Proposal> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("proposals")
    .insert(input)
    .select("*")
    .single();
  if (error) throw error;
  return data as Proposal;
}

export async function updateProposal(
  id: string,
  patch: UpdateProposalPatch,
): Promise<Proposal> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("proposals")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Proposal;
}

// ---------------------------------------------------------------------------
// Doc-number: AL-2026-<seq>. Derive seq from the MAX existing AL-2026-NNN
// sequence + 1 (not row count) so deleting a proposal can't reuse a number and
// the value stays monotonic. Seeds at 030.
// ---------------------------------------------------------------------------

export async function nextDocNumber(): Promise<string> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("proposals")
    .select("doc_number")
    .like("doc_number", "AL-2026-%");
  if (error) throw error;
  let max = 30;
  for (const r of (data as { doc_number: string | null }[]) ?? []) {
    const m = r.doc_number?.match(/^AL-2026-(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  const seq = (max + 1).toString().padStart(3, "0");
  return `AL-2026-${seq}`;
}

// ---------------------------------------------------------------------------
// Open questionnaire_responses: completed responses that don't yet have a
// proposal (source_response_id not in proposals).
// ---------------------------------------------------------------------------

export async function listOpenResponses(): Promise<QuestionnaireResponse[]> {
  const db = createAdminClient();

  // Fetch all proposals to get the set of response IDs already used
  const { data: proposalRows, error: pErr } = await db
    .from("proposals")
    .select("source_response_id");
  if (pErr) throw pErr;

  const usedIds = new Set(
    (proposalRows ?? [])
      .map((r: { source_response_id: string | null }) => r.source_response_id)
      .filter(Boolean) as string[],
  );

  const { data: responses, error: rErr } = await db
    .from("questionnaire_responses")
    .select("*")
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false });
  if (rErr) throw rErr;

  const rows = (responses as QuestionnaireResponse[]) ?? [];
  return rows.filter((r) => !usedIds.has(r.id));
}
