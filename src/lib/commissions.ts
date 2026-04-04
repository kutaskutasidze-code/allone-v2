import type { SupabaseClient } from '@supabase/supabase-js';

export const COMMISSION_RATES = {
  salesperson: 0.10,
  supervisorOwn: 0.10,
  supervisorOverride: 0.05,
} as const;

export interface Period {
  start: Date;
  end: Date;
  label: string;
}

export interface SalespersonBreakdown {
  salesUserId: string | null;
  name: string;
  wonCount: number;
  wonValue: number;
  overrideEarned: number; // what the supervisor earns from this person
}

export interface CommissionBreakdown {
  role: 'salesperson' | 'supervisor';
  period: { start: string; end: string; label: string };
  wonCount: number;
  wonValue: number;
  ownCommission: number;
  overrideCommission: number;
  totalCommission: number;
  perSalesperson?: SalespersonBreakdown[];
}

export function getCurrentMonth(): Period {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start, end, label: 'This Month' };
}

export function getLastMonth(): Period {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return { start, end, label: 'Last Month' };
}

export function getQuarter(): Period {
  const now = new Date();
  const quarter = Math.floor(now.getUTCMonth() / 3);
  const start = new Date(Date.UTC(now.getUTCFullYear(), quarter * 3, 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), quarter * 3 + 3, 1));
  return { start, end, label: 'This Quarter' };
}

export function getAllTime(): Period {
  return { start: new Date('2020-01-01'), end: new Date('2100-01-01'), label: 'All Time' };
}

export function getPeriod(name: string): Period {
  switch (name) {
    case 'last-month': return getLastMonth();
    case 'quarter': return getQuarter();
    case 'all': return getAllTime();
    case 'month':
    default: return getCurrentMonth();
  }
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

interface WonAggregate {
  sales_user_id: string | null;
  won_count: number;
  won_value: number;
}

/**
 * Fetch won leads aggregated by sales_user_id for a period.
 */
async function getWonLeadsBySalesperson(
  supabase: SupabaseClient,
  period: Period,
): Promise<WonAggregate[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('sales_user_id, value')
    .eq('status', 'won')
    .gte('won_at', period.start.toISOString())
    .lt('won_at', period.end.toISOString());

  if (error) throw new Error(`Failed to fetch won leads: ${error.message}`);

  const grouped = new Map<string | null, WonAggregate>();
  for (const lead of data || []) {
    const key = lead.sales_user_id;
    const existing = grouped.get(key) || { sales_user_id: key, won_count: 0, won_value: 0 };
    existing.won_count += 1;
    existing.won_value += Number(lead.value || 0);
    grouped.set(key, existing);
  }
  return Array.from(grouped.values());
}

export async function calculateSalespersonCommission(
  supabase: SupabaseClient,
  salesUserId: string,
  period: Period,
): Promise<CommissionBreakdown> {
  const aggregates = await getWonLeadsBySalesperson(supabase, period);
  const own = aggregates.find(a => a.sales_user_id === salesUserId);
  const wonValue = own?.won_value || 0;
  const wonCount = own?.won_count || 0;
  const ownCommission = wonValue * COMMISSION_RATES.salesperson;

  return {
    role: 'salesperson',
    period: { start: period.start.toISOString(), end: period.end.toISOString(), label: period.label },
    wonCount,
    wonValue: round2(wonValue),
    ownCommission: round2(ownCommission),
    overrideCommission: 0,
    totalCommission: round2(ownCommission),
  };
}

export async function calculateSupervisorCommission(
  supabase: SupabaseClient,
  supervisorId: string,
  period: Period,
): Promise<CommissionBreakdown> {
  const aggregates = await getWonLeadsBySalesperson(supabase, period);

  // Get all salespeople names for the breakdown
  const { data: salesUsers } = await supabase
    .from('sales_users')
    .select('id, name');
  const nameMap = new Map((salesUsers || []).map(u => [u.id, u.name]));

  let ownValue = 0;
  let ownCount = 0;
  let overrideTotal = 0;
  const perSalesperson: SalespersonBreakdown[] = [];

  for (const agg of aggregates) {
    if (agg.sales_user_id === supervisorId) {
      ownValue = agg.won_value;
      ownCount = agg.won_count;
    } else {
      const overrideEarned = agg.won_value * COMMISSION_RATES.supervisorOverride;
      overrideTotal += overrideEarned;
      perSalesperson.push({
        salesUserId: agg.sales_user_id,
        name: agg.sales_user_id ? (nameMap.get(agg.sales_user_id) || 'Unknown') : 'Unassigned',
        wonCount: agg.won_count,
        wonValue: round2(agg.won_value),
        overrideEarned: round2(overrideEarned),
      });
    }
  }

  perSalesperson.sort((a, b) => b.wonValue - a.wonValue);

  const ownCommission = ownValue * COMMISSION_RATES.supervisorOwn;
  const totalCommission = ownCommission + overrideTotal;

  return {
    role: 'supervisor',
    period: { start: period.start.toISOString(), end: period.end.toISOString(), label: period.label },
    wonCount: ownCount,
    wonValue: round2(ownValue),
    ownCommission: round2(ownCommission),
    overrideCommission: round2(overrideTotal),
    totalCommission: round2(totalCommission),
    perSalesperson,
  };
}
