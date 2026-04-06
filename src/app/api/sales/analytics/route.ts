import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSalesAuth } from '@/lib/sales-auth';

export async function GET(request: NextRequest) {
  try {
    await requireSalesAuth();
    const supabase = createAdminClient();

    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30', 10);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [totalCount, phoneCount, emailCount, statusData, serviceData, recentLeads] = await Promise.all([
      supabase.from('leads').select('id', { count: 'exact', head: true }),
      supabase.from('leads').select('id', { count: 'exact', head: true }).not('phone', 'is', null),
      supabase.from('leads').select('id', { count: 'exact', head: true }).not('email', 'is', null),
      supabase.from('leads').select('status'),
      supabase.from('leads').select('matched_service'),
      supabase.from('leads').select('id, created_at').gte('created_at', startDate.toISOString()).order('created_at', { ascending: false }),
    ]);

    const total = totalCount.count || 0;
    const withPhone = phoneCount.count || 0;
    const withEmail = emailCount.count || 0;

    const byStatus: Record<string, number> = {};
    for (const row of statusData.data || []) {
      byStatus[row.status] = (byStatus[row.status] || 0) + 1;
    }

    const byService: Record<string, number> = {};
    for (const row of serviceData.data || []) {
      const svc = row.matched_service || 'unclassified';
      byService[svc] = (byService[svc] || 0) + 1;
    }

    const dailyTrend: Record<string, number> = {};
    for (const row of recentLeads.data || []) {
      const date = new Date(row.created_at).toISOString().split('T')[0];
      dailyTrend[date] = (dailyTrend[date] || 0) + 1;
    }

    const newInPeriod = (recentLeads.data || []).length;

    return NextResponse.json({
      data: {
        overview: {
          totalLeads: total,
          newInPeriod,
          withPhone,
          withEmail,
          phoneRate: total > 0 ? Math.round((withPhone / total) * 100) : 0,
          emailRate: total > 0 ? Math.round((withEmail / total) * 100) : 0,
        },
        leads: { byStatus, byService, dailyTrend },
        period: { days },
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Analytics failed: ${msg}` }, { status: 500 });
  }
}
