import type { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { fetchAllRows } from "@/lib/supabase/paginate";

// Auto-assign unowned leads to reps by specialty (lead.industry → reps whose
// sales_users.industries[] covers it), load-balanced to the least-busy covering
// rep. Falls back to the least-busy active rep when the lead has no industry or
// no rep covers it (e.g. inbound contact-form leads carry no industry). Only
// ever fills an empty owner — never reassigns.

interface Rep {
  id: string;
  industries: string[];
}

// Leads that still count toward a rep's workload (i.e. not closed).
const ACTIVE_STATUSES = [
  "new",
  "in_process",
  "interested",
  "proposal",
  "on_hold",
];

async function loadReps(db: SupabaseClient): Promise<Rep[]> {
  const { data } = await db
    .from("sales_users")
    .select("id, industries, is_active, role")
    .eq("is_active", true)
    .neq("role", "admin");
  return (data ?? []).map((r) => ({
    id: r.id as string,
    industries: Array.isArray(r.industries) ? (r.industries as string[]) : [],
  }));
}

async function loadLoads(
  db: SupabaseClient,
  repIds: string[],
): Promise<Map<string, number>> {
  const load = new Map<string, number>(repIds.map((id) => [id, 0]));
  if (repIds.length === 0) return load;
  const rows = await fetchAllRows<{ sales_user_id: string | null }>(
    (from, to) =>
      db
        .from("leads")
        .select("sales_user_id")
        .in("sales_user_id", repIds)
        .in("status", ACTIVE_STATUSES)
        .range(from, to),
  );
  for (const r of rows) {
    if (r.sales_user_id)
      load.set(r.sales_user_id, (load.get(r.sales_user_id) ?? 0) + 1);
  }
  return load;
}

/**
 * Least-busy rep whose industries[] covers the lead's industry. When no rep
 * covers it: returns null unless `allowFallback` (then the least-busy active rep
 * — used for inbound leads so they always get an owner; the bulk pool drainer
 * passes false so uncovered leads stay a visible coverage gap, not force-dumped).
 */
function pickRep(
  reps: Rep[],
  load: Map<string, number>,
  industry: string | null,
  allowFallback: boolean,
): string | null {
  const covering = industry
    ? reps.filter((r) => r.industries.includes(industry))
    : [];
  const pool = covering.length ? covering : allowFallback ? reps : [];
  if (!pool.length) return null;
  let bestId = pool[0]!.id;
  let bestLoad = load.get(bestId) ?? 0;
  for (const r of pool) {
    const l = load.get(r.id) ?? 0;
    if (l < bestLoad) {
      bestId = r.id;
      bestLoad = l;
    }
  }
  return bestId;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export interface AssignSummary {
  assigned: number;
  scanned: number;
  noReps: boolean;
}

/**
 * Drain the unowned `new` pool: assign up to `limit` leads to reps by specialty.
 * Idempotent-safe — each update guards `sales_user_id IS NULL`, so concurrent
 * runs never double-assign or clobber a manual assignment.
 */
export async function assignNewLeadPool(
  db: SupabaseClient,
  limit = 500,
): Promise<AssignSummary> {
  const reps = await loadReps(db);
  if (reps.length === 0) return { assigned: 0, scanned: 0, noReps: true };

  // Refresh lead scores so we work the highest-intent leads first.
  await db.rpc("rescore_new_leads").then(
    () => {},
    () => {},
  );

  const load = await loadLoads(
    db,
    reps.map((r) => r.id),
  );

  const { data: pool, error } = await db
    .from("leads")
    .select("id, industry")
    .is("sales_user_id", null)
    .eq("status", "new")
    .order("lead_score", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) {
    logger.error("assignNewLeadPool: pool load failed", {
      error: error.message,
    });
    return { assigned: 0, scanned: 0, noReps: false };
  }

  const byRep = new Map<string, string[]>();
  for (const lead of pool ?? []) {
    const rep = pickRep(
      reps,
      load,
      (lead.industry as string | null) ?? null,
      false, // specialty-only: leave uncovered leads as a coverage gap
    );
    if (!rep) continue;
    (byRep.get(rep) ?? byRep.set(rep, []).get(rep)!).push(lead.id as string);
    load.set(rep, (load.get(rep) ?? 0) + 1);
  }

  let assigned = 0;
  for (const [rep, ids] of byRep) {
    for (const ids100 of chunk(ids, 100)) {
      const { data, error: upErr } = await db
        .from("leads")
        .update({ sales_user_id: rep })
        .in("id", ids100)
        .is("sales_user_id", null)
        .select("id");
      if (!upErr) assigned += data?.length ?? 0;
    }
  }
  return { assigned, scanned: (pool ?? []).length, noReps: false };
}

/**
 * Assign a single (typically just-created) lead to a rep. Best-effort — never
 * throws. No-op if the lead already has an owner or no rep is available.
 */
export async function autoAssignOne(
  db: SupabaseClient,
  leadId: string,
): Promise<boolean> {
  try {
    const { data: lead } = await db
      .from("leads")
      .select("id, industry, sales_user_id")
      .eq("id", leadId)
      .maybeSingle();
    if (!lead || lead.sales_user_id) return false;

    const reps = await loadReps(db);
    if (reps.length === 0) return false;
    const load = await loadLoads(
      db,
      reps.map((r) => r.id),
    );
    const rep = pickRep(
      reps,
      load,
      (lead.industry as string | null) ?? null,
      true, // inbound: always give the lead an owner
    );
    if (!rep) return false;

    const { error } = await db
      .from("leads")
      .update({ sales_user_id: rep })
      .eq("id", leadId)
      .is("sales_user_id", null);
    return !error;
  } catch (err) {
    logger.error("autoAssignOne failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}
