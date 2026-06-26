import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { INFOSHOP_DOMAIN, parsePhonePrefixes } from '@/lib/validations/leads';
import { logger } from '@/lib/logger';
import { requireRole } from '@/lib/sales-auth';
import { AuthError } from '@/lib/auth';
import { fetchAllRows } from '@/lib/supabase/paginate';

// Bulk-distribute the unassigned pool round-robin across the chosen reps.
// Only leads with status = 'new' are eligible. Optional filters narrow the pool
// before splitting.
const bodySchema = z.object({
  perRep: z.number().int().min(1).max(1000),
  repIds: z.array(z.string().uuid()).min(1).max(50).optional(),
  filters: z.object({
    industry: z.string().optional(),
    hasPhone: z.boolean().optional(),
    hasWebsite: z.enum(['yes', 'no']).optional(),
    hasAnySource: z.enum(['yes', 'no']).optional(),
    excludePhonePrefix: z.string().optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin', 'supervisor']);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 });
    }
    const { perRep, repIds, filters } = parsed.data;

    const admin = createAdminClient();

    // Resolve target reps.
    let repsQuery = admin.from('sales_users').select('id, name').neq('role', 'admin').order('name', { ascending: true });
    if (repIds && repIds.length > 0) {
      repsQuery = repsQuery.in('id', repIds);
    } else {
      // Default: every active rep regardless of role. Supervisors and admins
      // can also be salespeople — the role label is independent of whether
      // they take leads.
      repsQuery = repsQuery.eq('is_active', true);
    }
    const { data: reps, error: repsErr } = await repsQuery;
    if (repsErr || !reps || reps.length === 0) {
      return NextResponse.json({ error: 'No reps available to receive leads' }, { status: 400 });
    }

    // Resolve actor for assigned_by audit.
    const { data: actor } = await admin
      .from('sales_users')
      .select('id')
      .eq('email', (user.email||'').toLowerCase())
      .maybeSingle();

    const want = perRep * reps.length;
    const infoshopLike = `%${INFOSHOP_DOMAIN}%`;
    const excludePrefixes = parsePhonePrefixes(filters?.excludePhonePrefix ?? null);

    // Pull from the unassigned pool, respecting filters. Page up to `want` rows
    // — a single .limit(want) is capped at 1000 by PostgREST, silently
    // under-distributing whenever want > 1000.
    const buildPool = (from: number, to: number) => {
      let q = admin
        .from('leads')
        .select('id')
        .is('sales_user_id', null)
        .eq('status', 'new')
        .order('relevance_score', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .range(from, to);
      if (filters?.industry && filters.industry !== 'all') q = q.eq('industry', filters.industry);
      if (filters?.hasPhone) q = q.not('phone', 'is', null);
      if (filters?.hasWebsite === 'yes') q = q.not('website', 'is', null).not('website', 'ilike', infoshopLike);
      else if (filters?.hasWebsite === 'no') q = q.or(`website.is.null,website.ilike.${infoshopLike}`);
      if (filters?.hasAnySource === 'yes') q = q.or(`and(website.not.is.null,website.not.ilike.${infoshopLike}),facebook_url.not.is.null,and(source_url.not.is.null,source_url.not.ilike.${infoshopLike})`);
      else if (filters?.hasAnySource === 'no') q = q.or(`website.is.null,website.ilike.${infoshopLike}`).is('facebook_url', null).or(`source_url.is.null,source_url.ilike.${infoshopLike}`);
      if (excludePrefixes.length === 1) q = q.or(`phone.is.null,phone.not.ilike.${excludePrefixes[0]}%`);
      else if (excludePrefixes.length > 1) {
        const andClause = excludePrefixes.map(p => `phone.not.ilike.${p}%`).join(',');
        q = q.or(`phone.is.null,and(${andClause})`);
      }
      return q;
    };

    let pool: { id: string }[];
    try {
      pool = await fetchAllRows<{ id: string }>(buildPool, { max: want });
    } catch (e) {
      logger.error('Failed to fetch pool for distribution', { error: String(e) });
      return NextResponse.json({ error: 'Failed to fetch pool' }, { status: 500 });
    }

    if (pool.length === 0) {
      return NextResponse.json({
        data: { totalAssigned: 0, totalRemaining: 0, perRep: {}, reason: 'Pool is empty' },
      });
    }

    // Round-robin split — Rep A gets indices 0, N, 2N, ... so we get even spread
    // even if `pool.length` doesn't divide cleanly. Each rep gets at most `perRep`.
    const buckets = new Map<string, string[]>();
    for (const r of reps) buckets.set(r.id, []);
    for (let i = 0; i < pool.length; i++) {
      const rep = reps[i % reps.length];
      const arr = buckets.get(rep.id)!;
      if (arr.length < perRep) arr.push(pool[i].id);
    }

    // Assign each bucket in a single bulk UPDATE per rep.
    const summary: Record<string, { name: string; count: number }> = {};
    let totalAssigned = 0;
    for (const r of reps) {
      const ids = buckets.get(r.id) || [];
      if (ids.length === 0) {
        summary[r.id] = { name: r.name, count: 0 };
        continue;
      }
      const { error: updErr } = await admin
        .from('leads')
        .update({ sales_user_id: r.id, assigned_by: actor?.id ?? null })
        .in('id', ids)
        .is('sales_user_id', null)
        .eq('status', 'new');
      if (updErr) {
        logger.error('Distribute: failed to assign batch', { error: updErr.message, repId: r.id });
        return NextResponse.json({ error: `Failed assigning to ${r.name}` }, { status: 500 });
      }
      summary[r.id] = { name: r.name, count: ids.length };
      totalAssigned += ids.length;
    }

    // How many are left in the pool?
    const { count: remaining } = await admin
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .is('sales_user_id', null)
      .eq('status', 'new');

    logger.audit('distribute', 'leads', `${totalAssigned} leads`, user.email, { perRep, reps: reps.length });

    return NextResponse.json({
      data: {
        totalAssigned,
        totalRemaining: remaining || 0,
        perRep: summary,
      },
    });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    logger.error('Unexpected error in POST /api/admin/leads/distribute', { error: String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
