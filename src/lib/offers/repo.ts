import { createAdminClient } from "@/lib/supabase/admin";
import type { QuestionnaireResponse } from "@/lib/bots/types";
import type {
  Proposal,
  CreateProposalInput,
  UpdateProposalPatch,
  OfferStage,
} from "./types";

// ---------------------------------------------------------------------------
// Proposals CRUD
// ---------------------------------------------------------------------------

// Raw shape returned by Supabase when the `leads(email)` join is included
type ProposalRow = Omit<Proposal, "lead_email"> & {
  leads: { email: string | null } | null;
};

function flattenLeadEmail(row: ProposalRow): Proposal {
  const { leads, ...rest } = row;
  return { ...rest, lead_email: leads?.email ?? null };
}

export async function listProposals(leadId?: string): Promise<Proposal[]> {
  const db = createAdminClient();
  let q = db
    .from("proposals")
    .select("*, leads(email)")
    .order("created_at", { ascending: false });
  if (leadId) q = q.eq("lead_id", leadId);
  const { data, error } = await q;
  if (error) throw error;
  return ((data as ProposalRow[]) ?? []).map(flattenLeadEmail);
}

// Extract the in-bucket object path from a public Storage URL
// (…/object/public/offers/<path>). Returns null for non-matching/empty urls.
function bucketPathFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const parts = url.split("/storage/v1/object/public/offers/");
  return parts[1] ? decodeURIComponent(parts[1]) : null;
}

/**
 * Permanently delete a proposal and its generated PDFs.
 * Removes the offer/contract/invoice objects from Storage (best-effort), then
 * deletes the proposal row. Once the row is gone, the client's chat thread
 * (which reads the proposal) shows no documents — so this also revokes chat
 * access. Irreversible. Used by "Close deal".
 */
export async function deleteProposalAndDocuments(
  proposal: Proposal,
): Promise<void> {
  const db = createAdminClient();
  const paths = [
    bucketPathFromUrl(proposal.offer_pdf_url),
    bucketPathFromUrl(proposal.contract_pdf_url),
    bucketPathFromUrl(proposal.invoice_pdf_url),
  ].filter((p): p is string => !!p);
  if (paths.length) {
    // Best-effort: a missing object must not block deleting the row.
    await db.storage.from("offers").remove(paths);
  }
  const { error } = await db.from("proposals").delete().eq("id", proposal.id);
  if (error) throw error;
}

export async function getProposalByResponseId(
  rid: string,
): Promise<Proposal | null> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("proposals")
    .select("*, leads(email)")
    .eq("source_response_id", rid)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle(); // .limit(1) → "latest or null" (a response can have >1 proposal)
  if (error) throw error;
  if (!data) return null;
  return flattenLeadEmail(data as ProposalRow);
}

export async function getProposal(id: string): Promise<Proposal | null> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("proposals")
    .select("*, leads(email)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return flattenLeadEmail(data as ProposalRow);
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
// Payment seeding: insert one lead_payments row per offer stage.
// No-op if schedule is empty or leadId is falsy.
// ---------------------------------------------------------------------------

export async function seedPaymentsFromSchedule(
  leadId: string,
  schedule: OfferStage[],
): Promise<void> {
  if (!leadId || schedule.length === 0) return;
  const db = createAdminClient();
  const rows = schedule.map((stage) => ({
    lead_id: leadId,
    amount: stage.amount,
    label: stage.label,
    due_date: null as string | null,
  }));
  const { error } = await db.from("lead_payments").insert(rows);
  if (error) throw error;
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

// ---------------------------------------------------------------------------
// Self-serve rate-limit log (table: self_serve_rl). Coarse abuse guard for the
// public auto-offer endpoint.
// ---------------------------------------------------------------------------

export async function countRecentSelfServe(
  ip: string,
  sinceMs: number,
): Promise<number> {
  const db = createAdminClient();
  const since = new Date(Date.now() - sinceMs).toISOString();
  const { count, error } = await db
    .from("self_serve_rl")
    .select("id", { count: "exact", head: true })
    .eq("ip", ip)
    .gte("created_at", since);
  if (error) throw error;
  return count ?? 0;
}

export async function logSelfServe(ip: string): Promise<void> {
  const db = createAdminClient();
  const { error } = await db.from("self_serve_rl").insert({ ip });
  if (error) throw error;
}
