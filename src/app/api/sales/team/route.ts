import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { requireSupervisorAuth } from '@/lib/sales-auth';
import { AuthError } from '@/lib/auth';
import { getPeriod, calculateSupervisorCommission } from '@/lib/commissions';

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  leadCount: number;
  wonCount: number;
  lostCount: number;
  conversionRate: number;
  wonRevenue: number;
  pipelineValue: number;
  overrideEarned: number;
}

export async function GET(request: NextRequest) {
  try {
    const { salesUser: supervisor } = await requireSupervisorAuth();
    const period = getPeriod(request.nextUrl.searchParams.get('period') || 'month');
    const supabase = getServiceClient();

    // Get all sales users
    const { data: salesUsers, error: usersErr } = await supabase
      .from('sales_users')
      .select('id, name, email, role');
    if (usersErr) throw new Error(usersErr.message);

    // Get all leads in period (created or won)
    const { data: allLeads, error: leadsErr } = await supabase
      .from('leads')
      .select('id, sales_user_id, status, value, won_at, created_at');
    if (leadsErr) throw new Error(leadsErr.message);

    const periodStart = period.start.getTime();
    const periodEnd = period.end.getTime();

    const members: TeamMember[] = [];
    for (const u of salesUsers || []) {
      const userLeads = (allLeads || []).filter(l => l.sales_user_id === u.id);
      const leadCount = userLeads.length;

      // Won in period (by won_at)
      const wonInPeriod = userLeads.filter(l => {
        if (l.status !== 'won' || !l.won_at) return false;
        const t = new Date(l.won_at).getTime();
        return t >= periodStart && t < periodEnd;
      });
      const wonCount = wonInPeriod.length;
      const wonRevenue = wonInPeriod.reduce((sum, l) => sum + Number(l.value || 0), 0);

      const lostCount = userLeads.filter(l => l.status === 'lost').length;
      const pipelineValue = userLeads
        .filter(l => l.status === 'contacted' || l.status === 'qualified')
        .reduce((sum, l) => sum + Number(l.value || 0), 0);

      const conversionRate = leadCount > 0 ? wonCount / leadCount : 0;
      const overrideEarned = u.id === supervisor.id ? 0 : wonRevenue * 0.05;

      members.push({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        leadCount,
        wonCount,
        lostCount,
        conversionRate: Math.round(conversionRate * 1000) / 1000,
        wonRevenue: Math.round(wonRevenue * 100) / 100,
        pipelineValue: Math.round(pipelineValue * 100) / 100,
        overrideEarned: Math.round(overrideEarned * 100) / 100,
      });
    }

    members.sort((a, b) => b.wonRevenue - a.wonRevenue);

    // Also compute supervisor's full commission for header stats
    const supervisorCommission = await calculateSupervisorCommission(supabase, supervisor.id, period);

    return NextResponse.json({
      period: { start: period.start.toISOString(), end: period.end.toISOString(), label: period.label },
      salespeople: members,
      teamTotals: {
        leadCount: members.reduce((s, m) => s + m.leadCount, 0),
        wonCount: members.reduce((s, m) => s + m.wonCount, 0),
        wonRevenue: Math.round(members.reduce((s, m) => s + m.wonRevenue, 0) * 100) / 100,
        supervisorOwn: supervisorCommission.ownCommission,
        supervisorOverride: supervisorCommission.overrideCommission,
        supervisorTotal: supervisorCommission.totalCommission,
      },
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
