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

    // Per-rep counts via indexed COUNT (head) queries. A single select of all
    // assigned leads gets silently capped at 1000 rows by PostgREST, which
    // undercounts every rep past the first ~1000 — so we count per rep instead.
    const reps = await Promise.all(
      (salesUsers || []).map(async u => {
        const [{ count: total }, { count: untouched }] = await Promise.all([
          admin
            .from('leads')
            .select('id', { count: 'exact', head: true })
            .eq('sales_user_id', u.id),
          admin
            .from('leads')
            .select('id', { count: 'exact', head: true })
            .eq('sales_user_id', u.id)
            .eq('status', 'new'),
        ]);
        return {
          id: u.id,
          name: u.name,
          role: u.role,
          isActive: u.is_active ?? true,
          totalAssigned: total ?? 0,
          untouchedCount: untouched ?? 0,
        };
      }),
    );

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
