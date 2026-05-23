import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// Two modes:
//   - equalize: take from every over-target rep down to targetPerRep
//   - from_rep: take N from one specific rep
// Both move only untouched leads (status='new') back to the unassigned pool
// and preserve the "touched = owned" invariant.
const bodySchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('equalize'),
    targetPerRep: z.number().int().min(0).max(10000),
    dryRun: z.boolean().optional(),
  }),
  z.object({
    mode: z.literal('from_rep'),
    repId: z.string().uuid(),
    count: z.number().int().min(1).max(10000),
    dryRun: z.boolean().optional(),
  }),
]);

type SupabaseAdmin = ReturnType<typeof createAdminClient>;

interface RepPlan {
  repId: string;
  name: string;
  toMove: number;
  leadIds?: string[]; // populated only when we actually intend to UPDATE
}

// Build the list of (repId, oldest-N untouched lead ids) for a given selection.
async function selectMovableLeads(
  admin: SupabaseAdmin,
  perRepTakeCount: Map<string, number>,
): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>();
  const repIds = Array.from(perRepTakeCount.keys()).filter(id => (perRepTakeCount.get(id) || 0) > 0);
  if (repIds.length === 0) return result;

  // One query for all reps; sort by sales_user_id then assigned_at so we can
  // slice per-rep without N round-trips.
  const { data, error } = await admin
    .from('leads')
    .select('id, sales_user_id, assigned_at')
    .in('sales_user_id', repIds)
    .eq('status', 'new')
    .order('sales_user_id', { ascending: true })
    .order('assigned_at', { ascending: true, nullsFirst: true })
    .limit(100000);

  if (error) throw new Error(`Failed to load candidate leads: ${error.message}`);

  for (const row of data || []) {
    if (!row.sales_user_id) continue;
    const need = perRepTakeCount.get(row.sales_user_id) || 0;
    const existing = result.get(row.sales_user_id) || [];
    if (existing.length < need) {
      existing.push(row.id);
      result.set(row.sales_user_id, existing);
    }
  }
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const json = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 });
    }
    const body = parsed.data;
    const dryRun = body.dryRun ?? false;
    const admin = createAdminClient();

    // Resolve rep metadata + figure out how many to take from each.
    const { data: salesUsers, error: usersErr } = await admin
      .from('sales_users')
      .select('id, name, is_active');
    if (usersErr) {
      logger.error('rebalance: load reps failed', { error: usersErr.message });
      return NextResponse.json({ error: 'Failed to load reps' }, { status: 500 });
    }
    const repMeta = new Map((salesUsers || []).map(u => [u.id, u]));

    const { data: assignedLeads, error: leadsErr } = await admin
      .from('leads')
      .select('sales_user_id, status')
      .not('sales_user_id', 'is', null)
      .eq('status', 'new')
      .limit(100000);
    if (leadsErr) {
      logger.error('rebalance: load assigned leads failed', { error: leadsErr.message });
      return NextResponse.json({ error: 'Failed to load leads' }, { status: 500 });
    }

    // untouched count per rep
    const untouched = new Map<string, number>();
    for (const r of assignedLeads || []) {
      if (!r.sales_user_id) continue;
      untouched.set(r.sales_user_id, (untouched.get(r.sales_user_id) || 0) + 1);
    }

    const perRepTakeCount = new Map<string, number>();

    if (body.mode === 'equalize') {
      // For every active rep over target, plan to take the excess.
      for (const u of salesUsers || []) {
        if (!u.is_active) continue;
        const have = untouched.get(u.id) || 0;
        const excess = have - body.targetPerRep;
        if (excess > 0) perRepTakeCount.set(u.id, excess);
      }
    } else {
      // from_rep mode
      const have = untouched.get(body.repId) || 0;
      const planned = Math.min(have, body.count);
      if (planned > 0) perRepTakeCount.set(body.repId, planned);
    }

    // Resolve the actual lead IDs we'd move (oldest first).
    const perRepLeadIds = await selectMovableLeads(admin, perRepTakeCount);

    const perRep: Record<string, { name: string; movedToPool: number }> = {};
    let totalMovedToPool = 0;
    const allLeadIdsToMove: string[] = [];

    for (const [repId, plannedCount] of perRepTakeCount) {
      const ids = perRepLeadIds.get(repId) || [];
      const actual = ids.length; // may be smaller than planned if rep has fewer than expected
      const name = repMeta.get(repId)?.name || 'Unknown';
      if (actual === 0) continue;
      perRep[repId] = { name, movedToPool: actual };
      totalMovedToPool += actual;
      if (!dryRun) allLeadIdsToMove.push(...ids);
      // also ensure 'planned' is recorded (sanity)
      void plannedCount;
    }

    if (dryRun || allLeadIdsToMove.length === 0) {
      return NextResponse.json({
        data: { perRep, totalMovedToPool, dryRun: true },
      });
    }

    const { error: updateErr } = await admin
      .from('leads')
      .update({ sales_user_id: null, assigned_by: null })
      .in('id', allLeadIdsToMove);
    if (updateErr) {
      logger.error('rebalance: bulk-unassign failed', { error: updateErr.message });
      return NextResponse.json({ error: 'Failed to unassign leads' }, { status: 500 });
    }

    logger.audit('rebalance', 'leads', allLeadIdsToMove.join(','), user.email || 'unknown', {
      mode: body.mode,
      totalMovedToPool,
      perRep,
    });

    return NextResponse.json({
      data: { perRep, totalMovedToPool, dryRun: false },
    });
  } catch (err) {
    logger.error('Unexpected error in POST /api/admin/leads/rebalance', { error: String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
