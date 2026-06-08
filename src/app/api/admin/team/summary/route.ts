import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/sales-auth';
import { AuthError } from '@/lib/auth';
import { getPeriod, round2 } from '@/lib/commissions';
import { logger } from '@/lib/logger';
import { fetchAllRows } from '@/lib/supabase/paginate';
import { PIPELINE_STAGES } from '@/lib/forecasting';

export const dynamic = 'force-dynamic';

// Lightweight counterpart to GET /api/admin/team for the dashboard KPI strip,
// which only needs the period totals — not the full per-rep breakdown. The full
// route pages the entire ~25k-lead table and runs an O(leads) loop per rep; this
// computes the same five totals with count queries + small scoped reads (won and
// pipeline-stage leads only). Scoped to active reps so the numbers match the
// totals shown on the full team page.
export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin', 'supervisor']);

    const period = getPeriod(request.nextUrl.searchParams.get('period') || 'month');
    const startIso = period.start.toISOString();
    const endIso = period.end.toISOString();
    const admin = createAdminClient();

    // Active reps (is_active null is treated as active, matching the team route).
    const { data: users, error: usersErr } = await admin
      .from('sales_users')
      .select('id, is_active');
    if (usersErr) {
      logger.error('team/summary: failed to load reps', { error: usersErr.message });
      return NextResponse.json({ error: 'Failed to load team summary' }, { status: 500 });
    }
    const activeIds = (users || []).filter(u => u.is_active ?? true).map(u => u.id);

    const empty = { calledInPeriod: 0, connectedCalls: 0, wonCount: 0, wonRevenue: 0, pipelineValue: 0 };
    if (activeIds.length === 0) {
      return NextResponse.json({ data: { totals: empty } });
    }

    const [calledRes, connectedRes, wonRows, pipeRows] = await Promise.all([
      admin
        .from('calls')
        .select('*', { count: 'exact', head: true })
        .gte('occurred_at', startIso)
        .lt('occurred_at', endIso)
        .in('sales_user_id', activeIds),
      admin
        .from('calls')
        .select('*', { count: 'exact', head: true })
        .gte('occurred_at', startIso)
        .lt('occurred_at', endIso)
        .in('sales_user_id', activeIds)
        .eq('outcome', 'contacted'),
      // Won-in-period leads — a few hundred at most; fetch values and tally.
      fetchAllRows<{ value: number | null }>((from, to) =>
        admin
          .from('leads')
          .select('value')
          .eq('status', 'won')
          .gte('won_at', startIso)
          .lt('won_at', endIso)
          .in('sales_user_id', activeIds)
          .range(from, to),
      ),
      // Open-pipeline leads — a few thousand, far less than the full 25k table.
      fetchAllRows<{ value: number | null }>((from, to) =>
        admin
          .from('leads')
          .select('value')
          .in('status', [...PIPELINE_STAGES])
          .in('sales_user_id', activeIds)
          .range(from, to),
      ),
    ]);

    if (calledRes.error || connectedRes.error) {
      logger.error('team/summary: calls count failed', {
        error: (calledRes.error || connectedRes.error)?.message,
      });
      return NextResponse.json({ error: 'Failed to load team summary' }, { status: 500 });
    }

    const wonRevenue = wonRows.reduce((s, r) => s + Number(r.value || 0), 0);
    const pipelineValue = pipeRows.reduce((s, r) => s + Number(r.value || 0), 0);

    return NextResponse.json({
      data: {
        totals: {
          calledInPeriod: calledRes.count ?? 0,
          connectedCalls: connectedRes.count ?? 0,
          wonCount: wonRows.length,
          wonRevenue: round2(wonRevenue),
          pipelineValue: round2(pipelineValue),
        },
      },
    });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    logger.error('Unexpected error in GET /api/admin/team/summary', { error: String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
