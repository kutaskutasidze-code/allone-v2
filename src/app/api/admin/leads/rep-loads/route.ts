import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/sales-auth';
import { AuthError } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { parsePhonePrefixes } from '@/lib/validations/leads';

export const dynamic = 'force-dynamic';

// Per-rep current load: total assigned + untouched-count (the movable subset).
// Powers the "Rep loads" panel on /admin/leads/assign and the dry-run preview
// for rebalance.
export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin', 'supervisor']);

    const admin = createAdminClient();

    // Mirror the page's hotline toggle so the per-rep counts match the pool/list.
    const excludePrefixes = parsePhonePrefixes(
      new URL(request.url).searchParams.get('exclude_phone_prefix'),
    );
    const applyExclude = <T extends { or: (f: string) => T }>(q: T): T => {
      if (excludePrefixes.length === 1) {
        return q.or(`phone.is.null,phone.not.ilike.${excludePrefixes[0]}%`);
      }
      if (excludePrefixes.length > 1) {
        const andClause = excludePrefixes.map(p => `phone.not.ilike.${p}%`).join(',');
        return q.or(`phone.is.null,and(${andClause})`);
      }
      return q;
    };

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
          applyExclude(
            admin
              .from('leads')
              .select('id', { count: 'exact', head: true })
              .eq('sales_user_id', u.id),
          ),
          applyExclude(
            admin
              .from('leads')
              .select('id', { count: 'exact', head: true })
              .eq('sales_user_id', u.id)
              .eq('status', 'new'),
          ),
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
