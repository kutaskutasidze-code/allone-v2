import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPeriod, round2, COMMISSION_RATES } from '@/lib/commissions';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

interface RepStats {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  dailyTarget: number;
  assignedInPeriod: number;
  calledInPeriod: number;
  wonCount: number;
  wonRevenue: number;
  pipelineValue: number;
  conversionRate: number;
  commission: number;
}

export async function GET(request: NextRequest) {
  try {
    const period = getPeriod(request.nextUrl.searchParams.get('period') || 'month');
    const admin = createAdminClient();

    const { data: salesUsers, error: usersErr } = await admin
      .from('sales_users')
      .select('id, name, email, role, is_active, daily_target')
      .order('name', { ascending: true });

    if (usersErr) {
      logger.error('Failed to load sales_users for team stats', { error: usersErr.message });
      return NextResponse.json({ error: 'Failed to load team' }, { status: 500 });
    }

    const { data: allLeads, error: leadsErr } = await admin
      .from('leads')
      .select('sales_user_id, status, value, won_at, assigned_at, status_changed_at');

    if (leadsErr) {
      logger.error('Failed to load leads for team stats', { error: leadsErr.message });
      return NextResponse.json({ error: 'Failed to load leads' }, { status: 500 });
    }

    const periodStart = period.start.getTime();
    const periodEnd = period.end.getTime();
    const leads = allLeads || [];

    const reps: RepStats[] = (salesUsers || []).map(u => {
      const userLeads = leads.filter(l => l.sales_user_id === u.id);

      const assignedInPeriod = userLeads.filter(l => {
        if (!l.assigned_at) return false;
        const t = new Date(l.assigned_at).getTime();
        return t >= periodStart && t < periodEnd;
      }).length;

      // "Called" = status changed in period to something other than 'new'.
      const calledInPeriod = userLeads.filter(l => {
        if (l.status === 'new' || !l.status_changed_at) return false;
        const t = new Date(l.status_changed_at).getTime();
        return t >= periodStart && t < periodEnd;
      }).length;

      const wonInPeriod = userLeads.filter(l => {
        if (l.status !== 'won' || !l.won_at) return false;
        const t = new Date(l.won_at).getTime();
        return t >= periodStart && t < periodEnd;
      });
      const wonCount = wonInPeriod.length;
      const wonRevenue = wonInPeriod.reduce((sum, l) => sum + Number(l.value || 0), 0);

      const pipelineValue = userLeads
        .filter(l => l.status === 'contacted' || l.status === 'qualified' || l.status === 'callback')
        .reduce((sum, l) => sum + Number(l.value || 0), 0);

      const conversionRate = calledInPeriod > 0 ? wonCount / calledInPeriod : 0;

      // Salesperson commission = 10% of own won revenue.
      // Supervisor / admin also gets a 5% override on EVERY OTHER rep's won revenue.
      let commission = wonRevenue * COMMISSION_RATES.salesperson;
      if (u.role === 'supervisor' || u.role === 'admin') {
        const overrideRevenue = leads.filter(l => {
          if (l.sales_user_id === u.id || !l.sales_user_id) return false;
          if (l.status !== 'won' || !l.won_at) return false;
          const t = new Date(l.won_at).getTime();
          return t >= periodStart && t < periodEnd;
        }).reduce((sum, l) => sum + Number(l.value || 0), 0);
        commission += overrideRevenue * COMMISSION_RATES.supervisorOverride;
      }

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        isActive: u.is_active ?? true,
        dailyTarget: u.daily_target ?? 80,
        assignedInPeriod,
        calledInPeriod,
        wonCount,
        wonRevenue: round2(wonRevenue),
        pipelineValue: round2(pipelineValue),
        conversionRate: Math.round(conversionRate * 1000) / 1000,
        commission: round2(commission),
      };
    });

    // Active reps first, then by won revenue desc.
    reps.sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      return b.wonRevenue - a.wonRevenue;
    });

    const activeReps = reps.filter(r => r.isActive);
    const totals = {
      activeReps: activeReps.length,
      assignedInPeriod: activeReps.reduce((s, r) => s + r.assignedInPeriod, 0),
      calledInPeriod: activeReps.reduce((s, r) => s + r.calledInPeriod, 0),
      wonCount: activeReps.reduce((s, r) => s + r.wonCount, 0),
      wonRevenue: round2(activeReps.reduce((s, r) => s + r.wonRevenue, 0)),
      pipelineValue: round2(activeReps.reduce((s, r) => s + r.pipelineValue, 0)),
      totalCommission: round2(activeReps.reduce((s, r) => s + r.commission, 0)),
    };

    return NextResponse.json({
      data: {
        period: { start: period.start.toISOString(), end: period.end.toISOString(), label: period.label },
        reps,
        totals,
      },
    });
  } catch (err) {
    logger.error('Unexpected error in GET /api/admin/team', { error: String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
