import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// Returns per-rep activity today: how many leads were assigned to them today,
// how many they've touched (status != new and status_changed_at >= today),
// and a breakdown by status.
//
// Powered by:
//   - leads.assigned_at  → daily intake
//   - leads.status_changed_at → daily activity
//   - leads.sales_user_id → rep
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();

    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const sinceIso = startOfDay.toISOString();

    const { data: reps } = await admin
      .from('sales_users')
      .select('id, name, email, role')
      .order('name', { ascending: true });

    if (!reps || reps.length === 0) {
      return NextResponse.json({ data: { reps: [], totals: { assignedToday: 0, calledToday: 0 } } });
    }

    // Pull all leads touched or assigned today in one round-trip (small set).
    const { data: rows, error } = await admin
      .from('leads')
      .select('id, sales_user_id, status, assigned_at, status_changed_at')
      .or(`assigned_at.gte.${sinceIso},status_changed_at.gte.${sinceIso}`)
      .limit(5000);

    if (error) {
      logger.error('Failed to load daily activity', { error: error.message });
      return NextResponse.json({ error: 'Failed to load activity' }, { status: 500 });
    }

    type Stats = {
      assignedToday: number;
      calledToday: number;
      byStatus: Record<string, number>;
    };
    const perRep = new Map<string, Stats>();
    for (const r of reps) perRep.set(r.id, { assignedToday: 0, calledToday: 0, byStatus: {} });

    let totalAssigned = 0;
    let totalCalled = 0;

    for (const row of rows || []) {
      if (!row.sales_user_id) continue;
      const s = perRep.get(row.sales_user_id);
      if (!s) continue;

      if (row.assigned_at && row.assigned_at >= sinceIso) {
        s.assignedToday++;
        totalAssigned++;
      }
      if (row.status_changed_at && row.status_changed_at >= sinceIso && row.status !== 'new') {
        s.calledToday++;
        s.byStatus[row.status] = (s.byStatus[row.status] || 0) + 1;
        totalCalled++;
      }
    }

    const result = reps.map(r => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role,
      ...perRep.get(r.id)!,
    }));

    return NextResponse.json({
      data: {
        reps: result,
        totals: { assignedToday: totalAssigned, calledToday: totalCalled },
      },
    });
  } catch (err) {
    logger.error('Unexpected error in GET /api/admin/leads/daily-activity', { error: String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
