import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// Distribute the unassigned pool by industry → reps who cover that industry.
// Leads in industries no rep covers stay in the pool with a coverage-gap
// signal in the response. Mirrors the ordering + status='new' guard of the
// vanilla distribute endpoint.
const bodySchema = z.object({
  perRep: z.number().int().min(1).max(10000).optional(),
  dryRun: z.boolean().optional(),
});

interface RepWithIndustries {
  id: string;
  name: string;
  industries: string[];
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 });
    }
    const { perRep, dryRun = false } = parsed.data;
    const admin = createAdminClient();

    // Active reps with industries populated.
    const { data: repsRaw, error: repsErr } = await admin
      .from('sales_users')
      .select('id, name, industries, is_active')
      .eq('is_active', true);
    if (repsErr) {
      logger.error('distribute-by-specialty: failed to load reps', { error: repsErr.message });
      return NextResponse.json({ error: 'Failed to load reps' }, { status: 500 });
    }
    const reps: RepWithIndustries[] = (repsRaw || [])
      .filter(r => Array.isArray(r.industries) && r.industries.length > 0)
      .map(r => ({ id: r.id, name: r.name, industries: r.industries as string[] }));

    if (reps.length === 0) {
      return NextResponse.json({
        data: {
          totalAssigned: 0,
          perRep: {},
          uncovered: { total: 0, byIndustry: {} },
          dryRun,
          reason: 'No active reps have any industries set. Configure rep coverage on /admin/team first.',
        },
      });
    }

    // industry → ordered list of reps that cover it (stable by rep name).
    const industryToReps = new Map<string, RepWithIndustries[]>();
    for (const r of reps) {
      for (const ind of r.industries) {
        const list = industryToReps.get(ind) || [];
        list.push(r);
        industryToReps.set(ind, list);
      }
    }

    // Fetch the entire eligible pool. We don't pre-cap at perRep*reps.length
    // because the routing fan-out is per-industry, not a flat round-robin.
    const { data: pool, error: poolErr } = await admin
      .from('leads')
      .select('id, industry')
      .is('sales_user_id', null)
      .eq('status', 'new')
      .order('relevance_score', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(50000);

    if (poolErr) {
      logger.error('distribute-by-specialty: failed to load pool', { error: poolErr.message });
      return NextResponse.json({ error: 'Failed to load pool' }, { status: 500 });
    }

    // Walk the pool, routing per-industry.
    const buckets = new Map<string, string[]>();     // repId → leadIds to assign
    const repAssigned = new Map<string, number>();   // repId → running count (for perRep cap)
    const industryCursor = new Map<string, number>(); // industry → next-rep index
    const uncoveredByIndustry: Record<string, number> = {};
    const repIndustries = new Map<string, Set<string>>();   // for response: which industries fed each rep

    for (const lead of pool || []) {
      const ind = lead.industry as string | null;
      const candidates = ind ? industryToReps.get(ind) : undefined;
      if (!candidates || candidates.length === 0) {
        const key = ind || '(no industry)';
        uncoveredByIndustry[key] = (uncoveredByIndustry[key] || 0) + 1;
        continue;
      }

      // Round-robin within this industry, respecting the optional per-rep cap.
      const startIdx = industryCursor.get(ind!) || 0;
      let placed = false;
      for (let step = 0; step < candidates.length; step++) {
        const idx = (startIdx + step) % candidates.length;
        const rep = candidates[idx];
        const current = repAssigned.get(rep.id) || 0;
        if (perRep !== undefined && current >= perRep) continue;
        const list = buckets.get(rep.id) || [];
        list.push(lead.id);
        buckets.set(rep.id, list);
        repAssigned.set(rep.id, current + 1);
        industryCursor.set(ind!, (idx + 1) % candidates.length);
        const set = repIndustries.get(rep.id) || new Set<string>();
        set.add(ind!);
        repIndustries.set(rep.id, set);
        placed = true;
        break;
      }
      if (!placed) {
        // Every covering rep is at cap — treat as overflow (still leaves the
        // lead in the pool; we don't unassign anyone).
        const key = `${ind} (over cap)`;
        uncoveredByIndustry[key] = (uncoveredByIndustry[key] || 0) + 1;
      }
    }

    let totalAssigned = 0;
    const perRepSummary: Record<string, { name: string; count: number; industries: string[] }> = {};
    for (const r of reps) {
      const ids = buckets.get(r.id) || [];
      if (ids.length === 0) continue;
      perRepSummary[r.id] = {
        name: r.name,
        count: ids.length,
        industries: Array.from(repIndustries.get(r.id) || []).sort(),
      };
      totalAssigned += ids.length;
    }
    const uncoveredTotal = Object.values(uncoveredByIndustry).reduce((s, n) => s + n, 0);

    if (dryRun || totalAssigned === 0) {
      return NextResponse.json({
        data: {
          totalAssigned,
          perRep: perRepSummary,
          uncovered: { total: uncoveredTotal, byIndustry: uncoveredByIndustry },
          dryRun: true,
        },
      });
    }

    // Resolve actor for assigned_by audit.
    const { data: actor } = await admin
      .from('sales_users')
      .select('id')
      .eq('email', (user.email||'').toLowerCase())
      .maybeSingle();

    // One bulk UPDATE per rep, in parallel.
    const results = await Promise.all(
      Array.from(buckets.entries()).map(async ([repId, ids]) => {
        if (ids.length === 0) return { repId, ok: true };
        const { error } = await admin
          .from('leads')
          .update({ sales_user_id: repId, assigned_by: actor?.id ?? null })
          .in('id', ids);
        return { repId, ok: !error, error: error?.message };
      })
    );
    const failures = results.filter(r => !r.ok);
    if (failures.length > 0) {
      logger.error('distribute-by-specialty: some assigns failed', { failures });
      return NextResponse.json({ error: 'Some assigns failed', details: failures }, { status: 500 });
    }

    logger.audit('distribute_by_specialty', 'leads', `${totalAssigned} leads`, user.email, {
      perRep: Object.fromEntries(
        Object.entries(perRepSummary).map(([id, v]) => [id, v.count])
      ),
      uncoveredTotal,
    });

    return NextResponse.json({
      data: {
        totalAssigned,
        perRep: perRepSummary,
        uncovered: { total: uncoveredTotal, byIndustry: uncoveredByIndustry },
        dryRun: false,
      },
    });
  } catch (err) {
    logger.error('Unexpected error in POST /api/admin/leads/distribute-by-specialty', { error: String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
