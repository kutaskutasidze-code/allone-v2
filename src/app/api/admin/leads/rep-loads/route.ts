import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/sales-auth';
import { AuthError } from '@/lib/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// Per-rep current load: total assigned + untouched-count (the movable subset).
// Powers the "Rep loads" panel on /admin/leads/assign and the dry-run preview
// for rebalance.
export async function GET() {
  try {
    await requireRole(['admin', 'supervisor']);

    const admin = createAdminClient();

    const { data: salesUsers, error: usersErr } = await admin
      .from('sales_users')
      .select('id, name, role, is_active')
      .order('name', { ascending: true });
    if (usersErr) {
      logger.error('rep-loads: failed to list reps', { error: usersErr.message });
      return NextResponse.json({ error: 'Failed to load reps' }, { status: 500 });
    }

    // One pass over all currently-assigned leads. Even at 50k leads this is
    // small (status + sales_user_id only) and avoids N+1 count queries.
    const { data: assignedLeads, error: leadsErr } = await admin
      .from('leads')
      .select('sales_user_id, status')
      .not('sales_user_id', 'is', null)
      .limit(100000);
    if (leadsErr) {
      logger.error('rep-loads: failed to load assigned leads', { error: leadsErr.message });
      return NextResponse.json({ error: 'Failed to load leads' }, { status: 500 });
    }

    const counts = new Map<string, { total: number; untouched: number }>();
    for (const row of assignedLeads || []) {
      if (!row.sales_user_id) continue;
      const c = counts.get(row.sales_user_id) || { total: 0, untouched: 0 };
      c.total++;
      if (row.status === 'new') c.untouched++;
      counts.set(row.sales_user_id, c);
    }

    const reps = (salesUsers || []).map(u => {
      const c = counts.get(u.id) || { total: 0, untouched: 0 };
      return {
        id: u.id,
        name: u.name,
        role: u.role,
        isActive: u.is_active ?? true,
        totalAssigned: c.total,
        untouchedCount: c.untouched,
      };
    });

    // Active reps first (descending by untouched, the actionable number).
    reps.sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      return b.untouchedCount - a.untouchedCount;
    });

    const activeReps = reps.filter(r => r.isActive);
    const totals = {
      totalAssigned: activeReps.reduce((s, r) => s + r.totalAssigned, 0),
      untouchedCount: activeReps.reduce((s, r) => s + r.untouchedCount, 0),
      activeReps: activeReps.length,
    };

    return NextResponse.json({ data: { reps, totals } });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    logger.error('Unexpected error in GET /api/admin/leads/rep-loads', { error: String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
