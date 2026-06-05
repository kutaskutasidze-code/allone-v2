import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/sales-auth';
import { AuthError } from '@/lib/auth';
import { LEAD_STATUSES } from '@/lib/validations/leads';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const STATUS_VALUES = new Set(LEAD_STATUSES.map(s => s.value));

export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin', 'supervisor']);

    const sp = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(sp.get('page') || '1', 10) || 1);
    const limit = Math.min(200, Math.max(10, parseInt(sp.get('limit') || '50', 10) || 50));
    const salesUserId = sp.get('sales_user_id');
    const leadId = sp.get('lead_id');
    const search = (sp.get('search') || '').trim();
    const fromStatus = sp.get('from_status');
    const toStatus = sp.get('to_status');
    const since = sp.get('since');
    const until = sp.get('until');

    const admin = createAdminClient();

    // Phase 1 — query lead_status_history. When filtering by rep or lead-search,
    // embed leads!inner so PostgREST filters server-side (the history table has
    // no rep/name/company columns) — no capped lead-id list, no giant IN().
    const needsLeadFilter = !!(salesUserId || search);
    const selectCols = needsLeadFilter
      ? 'id, lead_id, from_status, to_status, changed_at, leads!inner(sales_user_id, name, company)'
      : 'id, lead_id, from_status, to_status, changed_at';
    let q = admin
      .from('lead_status_history')
      .select(selectCols, { count: 'exact' })
      .order('changed_at', { ascending: false });

    if (fromStatus && STATUS_VALUES.has(fromStatus)) q = q.eq('from_status', fromStatus);
    if (toStatus && STATUS_VALUES.has(toStatus)) q = q.eq('to_status', toStatus);
    if (leadId) q = q.eq('lead_id', leadId);
    if (since) q = q.gte('changed_at', since);
    if (until) q = q.lt('changed_at', until);

    if (salesUserId) q = q.eq('leads.sales_user_id', salesUserId);
    if (search) {
      const s = search.replace(/[%_,()]/g, '');
      q = q.or(`name.ilike.%${s}%,company.ilike.%${s}%`, { referencedTable: 'leads' });
    }

    const from = (page - 1) * limit;
    q = q.range(from, from + limit - 1);

    const { data: history, error: histErr, count } = await q;
    if (histErr) {
      logger.error('Audit: history query failed', { error: histErr.message });
      return NextResponse.json({ error: 'Failed to load audit log' }, { status: 500 });
    }

    const rows = (history ?? []) as Array<{
      id: string;
      lead_id: string;
      from_status: string | null;
      to_status: string;
      changed_at: string;
    }>;

    // Phase 2 — batch-fetch the related leads + reps.
    const uniqueLeadIds = Array.from(new Set(rows.map(r => r.lead_id)));
    const leadMap = new Map<string, { id: string; name: string; company: string | null; sales_user_id: string | null }>();
    if (uniqueLeadIds.length > 0) {
      const { data: leads, error: leadsErr } = await admin
        .from('leads')
        .select('id, name, company, sales_user_id')
        .in('id', uniqueLeadIds);
      if (leadsErr) {
        logger.error('Audit: lead enrich failed', { error: leadsErr.message });
      } else {
        for (const l of leads || []) leadMap.set(l.id, l);
      }
    }

    const uniqueSalesUserIds = Array.from(
      new Set(Array.from(leadMap.values()).map(l => l.sales_user_id).filter((x): x is string => !!x))
    );
    const userMap = new Map<string, { id: string; name: string }>();
    if (uniqueSalesUserIds.length > 0) {
      const { data: users } = await admin
        .from('sales_users')
        .select('id, name')
        .in('id', uniqueSalesUserIds);
      for (const u of users || []) userMap.set(u.id, u);
    }

    const data = rows.map(r => {
      const lead = leadMap.get(r.lead_id) || null;
      const user = lead?.sales_user_id ? userMap.get(lead.sales_user_id) || null : null;
      return {
        id: r.id,
        changedAt: r.changed_at,
        fromStatus: r.from_status,
        toStatus: r.to_status,
        lead: lead ? { id: lead.id, name: lead.name, company: lead.company } : null,
        salesUser: user, // current owner — may differ from owner at the time of change
      };
    });

    return NextResponse.json({ data, meta: { total: count ?? data.length, page, limit } });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    logger.error('Unexpected error in GET /api/admin/leads/audit', { error: String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
