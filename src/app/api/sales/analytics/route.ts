import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSalesAuth } from '@/lib/sales-auth';

export async function GET(request: NextRequest) {
  try {
    await requireSalesAuth();
    const supabase = createAdminClient();

    const days = parseInt(request.nextUrl.searchParams.get('days') || '30', 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const statuses = ['new', 'contacted', 'qualified', 'won', 'lost'];
    const services = ['chatbots', 'custom_ai', 'automation', 'website', 'consulting'];

    const [totalRes, phoneRes, emailRes, newInPeriodRes, ...statusAndServiceResults] = await Promise.all([
      supabase.from('leads').select('id', { count: 'exact', head: true }),
      supabase.from('leads').select('id', { count: 'exact', head: true }).not('phone', 'is', null),
      supabase.from('leads').select('id', { count: 'exact', head: true }).not('email', 'is', null),
      supabase.from('leads').select('id', { count: 'exact', head: true }).gte('created_at', startDate.toISOString()),
      ...statuses.map(s => supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', s)),
      ...services.map(s => supabase.from('leads').select('id', { count: 'exact', head: true }).eq('matched_service', s)),
    ]);

    const total = totalRes.count || 0;
    const withPhone = phoneRes.count || 0;
    const withEmail = emailRes.count || 0;
    const newInPeriod = newInPeriodRes.count || 0;

    const byStatus: Record<string, number> = {};
    statuses.forEach((s, i) => {
      const count = statusAndServiceResults[i].count || 0;
      if (count > 0) byStatus[s] = count;
    });

    const byService: Record<string, number> = {};
    services.forEach((s, i) => {
      const count = statusAndServiceResults[statuses.length + i].count || 0;
      if (count > 0) byService[s] = count;
    });

    // Unclassified count
    const classifiedTotal = Object.values(byService).reduce((sum, v) => sum + v, 0);
    if (total > classifiedTotal) {
      byService['unclassified'] = total - classifiedTotal;
    }

    // Daily trend - fetch just dates from the period (limit higher)
    const { data: recentDates } = await supabase
      .from('leads')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })
      .limit(5000);

    const dailyTrend: Record<string, number> = {};
    for (const row of recentDates || []) {
      const date = new Date(row.created_at).toISOString().split('T')[0];
      dailyTrend[date] = (dailyTrend[date] || 0) + 1;
    }

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
