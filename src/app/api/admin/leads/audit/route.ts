import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { LEAD_STATUSES } from '@/lib/validations/leads';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const STATUS_VALUES = new Set(LEAD_STATUSES.map(s => s.value));

export async function GET(request: NextRequest) {
  try {
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

    // Phase 1 — query lead_status_history with filters that live on this table.
    let q = admin
      .from('lead_status_history')
      .select('id, lead_id, from_status, to_status, changed_at', { count: 'exact' })
      .order('changed_at', { ascending: false });

    if (fromStatus && STATUS_VALUES.has(fromStatus)) q = q.eq('from_status', fromStatus);
    if (toStatus && STATUS_VALUES.has(toStatus)) q = q.eq('to_status', toStatus);
    if (leadId) q = q.eq('lead_id', leadId);
    if (since) q = q.gte('changed_at', since);
    if (until) q = q.lt('changed_at', until);

    // If filtering by rep or by lead-search, we resolve those to lead_ids first
    // (the history table doesn't carry rep/name/company columns).
    if (salesUserId || search) {
      let leadQ = admin.from('leads').select('id');
      if (salesUserId) leadQ = leadQ.eq('sales_user_id', salesUserId);
      if (search) leadQ = leadQ.or(`name.ilike.%${search}%,company.ilike.%${search}%`);
      const { data: matchingLeads, error: leadFilterErr } = await leadQ.limit(5000);
      if (leadFilterErr) {
        logger.error('Audit: lead-filter query failed', { error: leadFilterErr.message });
        return NextResponse.json({ error: 'Failed to filter leads' }, { status: 500 });
      }
      const ids = (matchingLeads || []).map(l => l.id);
      if (ids.length === 0) {
        return NextResponse.json({ data: [], meta: { total: 0, page, limit } });
      }
      q = q.in('lead_id', ids);
    }

    const from = (page - 1) * limit;
    q = q.range(from, from + limit - 1);

    const { data: history, error: histErr, count } = await q;
    if (histErr) {
      logger.error('Audit: history query failed', { error: histErr.message });
      return NextResponse.json({ error: 'Failed to load audit log' }, { status: 500 });
    }

    const rows = history || [];

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
    logger.error('Unexpected error in GET /api/admin/leads/audit', { error: String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
