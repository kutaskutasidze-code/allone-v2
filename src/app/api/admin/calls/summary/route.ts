import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/sales-auth';
import { AuthError } from '@/lib/auth';
import { getPeriod } from '@/lib/commissions';
import { logger } from '@/lib/logger';
import { fetchAllRows } from '@/lib/supabase/paginate';

export const dynamic = 'force-dynamic';

// Call-outcome breakdown for the Overview card: the connection split
// (contacted / no_answer / wrong_number), the disposition split among the
// contacted (interested / not_interested / callback_requested), and the reach
// rate, for the period. Active-rep scoped to match the "Calls this month" KPI.
export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin', 'supervisor']);

    const period = getPeriod(request.nextUrl.searchParams.get('period') || 'month');
    const startIso = period.start.toISOString();
    const endIso = period.end.toISOString();
    const admin = createAdminClient();

    const { data: users, error: usersErr } = await admin
      .from('sales_users')
      .select('id, is_active')
      .neq('role', 'admin');
    if (usersErr) {
      logger.error('calls/summary: failed to load reps', { error: usersErr.message });
      return NextResponse.json({ error: 'Failed to load call summary' }, { status: 500 });
    }
    const activeIds = (users || []).filter((u) => u.is_active ?? true).map((u) => u.id);

    const connection = { contacted: 0, no_answer: 0, wrong_number: 0 };
    const disposition = { interested: 0, not_interested: 0, callback_requested: 0 };

    if (activeIds.length > 0) {
      const rows = await fetchAllRows<{ outcome: string; disposition: string | null }>(
        (from, to) =>
          admin
            .from('calls')
            .select('outcome, disposition')
            .gte('occurred_at', startIso)
            .lt('occurred_at', endIso)
            .in('sales_user_id', activeIds)
            .range(from, to),
      );
      for (const r of rows) {
        if (r.outcome in connection) connection[r.outcome as keyof typeof connection]++;
        if (r.disposition && r.disposition in disposition)
          disposition[r.disposition as keyof typeof disposition]++;
      }
    }

    const total = connection.contacted + connection.no_answer + connection.wrong_number;
    const reachRate = total > 0 ? connection.contacted / total : 0;

    return NextResponse.json({ data: { connection, disposition, total, reachRate } });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    logger.error('Unexpected error in GET /api/admin/calls/summary', { error: String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
