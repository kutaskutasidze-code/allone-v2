// Sales aim computation.
//
// An "aim" is a per-(user, metric, period) target computed from the user's
// own history with a configurable growth rate. No admin UI required for v1.
//
// Periods:
//   - day   — single weekday (mon-fri); baseline = mean of the previous 5 weekdays
//   - week  — Mon-Sun; baseline = mean of the previous 3 weeks
//   - month — calendar month; baseline = mean of the previous 3 months
//
// Metrics: see Metric type. Pure functions take `events` (a flat array of
// metric records pulled by the caller) so we can unit-test without touching
// Supabase.

import { tbilisiDayStart, tbilisiWeekStart, tbilisiMonthStart } from "@/lib/time";

export type Metric =
  | "leads_contacted"
  | "leads_qualified"
  | "leads_won_count"
  | "leads_won_revenue"
  | "demos_sent"
  | "demos_engaged";

export type Period = "day" | "week" | "month";

export interface MetricEvent {
  metric: Metric;
  occurred_at: string; // ISO date or datetime
  value: number; // 1 for counts, revenue amount for leads_won_revenue
}

export interface AimResult {
  metric: Metric;
  period: Period;
  baseline: number;
  growth_pct: number;
  aim: number;
  actual: number;
  progress_pct: number; // 0..100+, clamped to 0 floor
}

const DEFAULT_GROWTH_PCT: Record<Metric, number> = {
  leads_contacted: 15,
  leads_qualified: 15,
  leads_won_count: 20,
  leads_won_revenue: 20,
  demos_sent: 15,
  demos_engaged: 25,
};

const ALL_METRICS: Metric[] = [
  "leads_contacted",
  "leads_qualified",
  "leads_won_count",
  "leads_won_revenue",
  "demos_sent",
  "demos_engaged",
];

export function metricsOfInterest(): Metric[] {
  return [...ALL_METRICS];
}

// Tbilisi-anchored window (UTC+4). Returns a closed [start, end] interval —
// `end` is the last millisecond of the period.
export function periodWindow(
  now: Date,
  period: Period,
): { start: Date; end: Date } {
  if (period === "day") {
    const start = tbilisiDayStart(now);
    return { start, end: new Date(start.getTime() + 24 * 3600_000 - 1) };
  }
  if (period === "week") {
    const start = tbilisiWeekStart(now);
    return { start, end: new Date(start.getTime() + 7 * 24 * 3600_000 - 1) };
  }
  const start = tbilisiMonthStart(now, 0);
  return { start, end: new Date(tbilisiMonthStart(now, 1).getTime() - 1) };
}

function sumInWindow(
  events: MetricEvent[],
  metric: Metric,
  start: Date,
  end: Date,
): number {
  let s = 0;
  for (const e of events) {
    if (e.metric !== metric) continue;
    const t = new Date(e.occurred_at).getTime();
    if (t >= start.getTime() && t <= end.getTime()) s += e.value;
  }
  return s;
}

// Baseline = mean of the previous N completed periods.
export function baselineForPeriod(
  events: MetricEvent[],
  metric: Metric,
  period: Period,
  now: Date,
): number {
  const N = period === "day" ? 5 : 3;
  let total = 0;
  let counted = 0;
  for (let i = 1; i <= N; i++) {
    const ref = shiftPeriod(now, period, -i);
    const { start, end } = periodWindow(ref, period);

    // For 'day', skip Sat/Sun so the baseline reflects working days only.
    if (period === "day") {
      const dow = start.getDay();
      if (dow === 0 || dow === 6) {
        continue;
      }
    }

    total += sumInWindow(events, metric, start, end);
    counted += 1;
  }
  if (counted === 0) return 0;
  return total / counted;
}

function shiftPeriod(d: Date, period: Period, deltaPeriods: number): Date {
  const out = new Date(d);
  if (period === "day") out.setDate(out.getDate() + deltaPeriods);
  else if (period === "week") out.setDate(out.getDate() + deltaPeriods * 7);
  else out.setMonth(out.getMonth() + deltaPeriods);
  return out;
}

export interface AimInputs {
  events: MetricEvent[];
  now: Date;
  metric: Metric;
  period: Period;
  growthPctOverride?: number;
}

export function computeAim(input: AimInputs): AimResult {
  const baseline = baselineForPeriod(
    input.events,
    input.metric,
    input.period,
    input.now,
  );
  const growth_pct =
    input.growthPctOverride ?? DEFAULT_GROWTH_PCT[input.metric];
  const aim = Math.max(0, Math.ceil(baseline * (1 + growth_pct / 100)));

  const { start, end } = periodWindow(input.now, input.period);
  const actual = sumInWindow(input.events, input.metric, start, end);

  const progress_pct =
    aim === 0 ? (actual > 0 ? 100 : 0) : Math.round((actual / aim) * 100);

  return {
    metric: input.metric,
    period: input.period,
    baseline: Math.round(baseline * 100) / 100,
    growth_pct,
    aim,
    actual,
    progress_pct: Math.max(0, progress_pct),
  };
}

export function computeAllAims(
  events: MetricEvent[],
  now: Date,
  period: Period,
): AimResult[] {
  return ALL_METRICS.map((metric) =>
    computeAim({ events, now, metric, period }),
  );
}

// Pretty label helpers for the dashboard + Telegram messages.
export function metricLabel(m: Metric): string {
  switch (m) {
    case "leads_contacted":
      return "Leads contacted";
    case "leads_qualified":
      return "Leads qualified";
    case "leads_won_count":
      return "Leads won";
    case "leads_won_revenue":
      return "Revenue won";
    case "demos_sent":
      return "Demos sent";
    case "demos_engaged":
      return "Demos with engagement";
  }
}

export function metricFormat(m: Metric, value: number): string {
  if (m === "leads_won_revenue") {
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
    return `$${value.toFixed(0)}`;
  }
  return String(Math.round(value));
}
