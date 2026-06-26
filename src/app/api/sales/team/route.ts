import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSupervisorAuth } from '@/lib/sales-auth';
import { AuthError } from '@/lib/auth';
import { getPeriod, round2, COMMISSION_RATES } from '@/lib/commissions';
import { fetchAllRows } from '@/lib/supabase/paginate';

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
    const supabase = createAdminClient();

    const { data: salesUsers, error: usersErr } = await supabase
      .from('sales_users')
      .select('id, name, email, role')
      .neq('role', 'admin');
    if (usersErr) throw new Error(usersErr.message);

    const allLeads = await fetchAllRows<{
      id: string;
      sales_user_id: string | null;
      status: string;
      value: number | null;
      won_at: string | null;
    }>((from, to) =>
      supabase.from('leads').select('id, sales_user_id, status, value, won_at').range(from, to),
    );

    const periodStart = period.start.getTime();
    const periodEnd = period.end.getTime();

    const members: TeamMember[] = [];
    for (const u of salesUsers || []) {
      const userLeads = (allLeads || []).filter(l => l.sales_user_id === u.id);
      const leadCount = userLeads.length;

      const wonInPeriod = userLeads.filter(l => {
        if (l.status !== 'won' || !l.won_at) return false;
        const t = new Date(l.won_at).getTime();
        return t >= periodStart && t < periodEnd;
      });
      const wonCount = wonInPeriod.length;
      const wonRevenue = wonInPeriod.reduce((sum, l) => sum + Number(l.value || 0), 0);

      const lostCount = userLeads.filter(l => l.status === 'lost').length;
      const pipelineValue = userLeads
        .filter(l => l.status === 'in_process' || l.status === 'interested' || l.status === 'proposal')
        .reduce((sum, l) => sum + Number(l.value || 0), 0);

      const conversionRate = leadCount > 0 ? wonCount / leadCount : 0;
      const isOwn = u.id === supervisor.id;
      const overrideEarned = isOwn ? 0 : wonRevenue * COMMISSION_RATES.supervisorOverride;

      members.push({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        leadCount,
        wonCount,
        lostCount,
        conversionRate: Math.round(conversionRate * 1000) / 1000,
        wonRevenue: round2(wonRevenue),
        pipelineValue: round2(pipelineValue),
        overrideEarned: round2(overrideEarned),
      });
    }

    members.sort((a, b) => b.wonRevenue - a.wonRevenue);

    const supervisorMember = members.find(m => m.id === supervisor.id);
    const supervisorOwn = round2((supervisorMember?.wonRevenue || 0) * COMMISSION_RATES.supervisorOwn);
    const supervisorOverride = round2(members.reduce((sum, m) => sum + m.overrideEarned, 0));
    const supervisorTotal = round2(supervisorOwn + supervisorOverride);

    return NextResponse.json({
      period: { start: period.start.toISOString(), end: period.end.toISOString(), label: period.label },
      salespeople: members,
      teamTotals: {
        leadCount: members.reduce((s, m) => s + m.leadCount, 0),
        wonCount: members.reduce((s, m) => s + m.wonCount, 0),
        wonRevenue: round2(members.reduce((s, m) => s + m.wonRevenue, 0)),
        supervisorOwn,
        supervisorOverride,
        supervisorTotal,
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
