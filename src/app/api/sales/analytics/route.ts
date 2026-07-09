import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSalesAuth } from "@/lib/sales-auth";
import { leadStatusSchema } from "@/lib/validations/leads";
import { fetchAllRows } from "@/lib/supabase/paginate";
import { tbilisiDayStart, tbilisiWeekStart, tbilisiMonthStart } from "@/lib/time";

const KNOWN_SERVICES = [
  "chatbots",
  "custom_ai",
  "automation",
  "website",
  "consulting",
] as const;

type LeadAggregates = {
  total: number;
  withPhone: number;
  withEmail: number;
  newInPeriod: number;
  byStatus: Record<string, number>;
  byService: Record<string, number>;
  dailyTrend: Record<string, number>;
};

// Lead-derived analytics in one round-trip via the sales_analytics_leads RPC
// (single GROUP BY in Postgres). Falls back to the previous count fan-out +
// full-row daily-trend pull if the function isn't present yet.
async function getLeadAggregates(
  supabase: SupabaseClient,
  salesUserId: string,
  startDate: Date,
): Promise<LeadAggregates> {
  const { data, error } = await supabase.rpc("sales_analytics_leads", {
    p_uid: salesUserId,
    p_since: startDate.toISOString(),
  });

  if (error || !data) {
    return leadAggregatesFanout(supabase, salesUserId, startDate);
  }

  const d = data as {
    total: number;
    withPhone: number;
    withEmail: number;
    newInPeriod: number;
    byStatus: Record<string, number>;
    byService: Record<string, number>;
    dailyTrend: Record<string, number>;
  };

  const total = Number(d.total) || 0;

  // Keep only the known statuses (matches the old fixed-list iteration); the RPC
  // only emits statuses with count > 0 already.
  const byStatus: Record<string, number> = {};
  for (const s of leadStatusSchema.options) {
    const c = Number(d.byStatus?.[s]) || 0;
    if (c > 0) byStatus[s] = c;
  }

  // Keep only the 5 known services, then derive "unclassified" the same way the
  // old code did: total minus the sum of the known-service counts.
  const byService: Record<string, number> = {};
  for (const s of KNOWN_SERVICES) {
    const c = Number(d.byService?.[s]) || 0;
    if (c > 0) byService[s] = c;
  }
  const classifiedTotal = Object.values(byService).reduce((sum, v) => sum + v, 0);
  if (total > classifiedTotal) {
    byService["unclassified"] = total - classifiedTotal;
  }

  const dailyTrend: Record<string, number> = {};
  for (const [k, v] of Object.entries(d.dailyTrend ?? {})) {
    dailyTrend[k] = Number(v) || 0;
  }

  return {
    total,
    withPhone: Number(d.withPhone) || 0,
    withEmail: Number(d.withEmail) || 0,
    newInPeriod: Number(d.newInPeriod) || 0,
    byStatus,
    byService,
    dailyTrend,
  };
}

// Fallback: the original per-status/service count fan-out (16 counts) plus a
// paged pull of every lead in the period to bucket by day in JS. Retained so
// analytics keeps working before the sales_analytics_leads migration is applied.
async function leadAggregatesFanout(
  supabase: SupabaseClient,
  salesUserId: string,
  startDate: Date,
): Promise<LeadAggregates> {
  const statuses = [...leadStatusSchema.options];
  const services = [...KNOWN_SERVICES];
  const scope = <T extends ReturnType<typeof supabase.from>>(q: T) =>
    q.eq("sales_user_id", salesUserId);

  const [totalRes, phoneRes, emailRes, newInPeriodRes, ...statusAndServiceResults] =
    await Promise.all([
      scope(supabase.from("leads").select("id", { count: "exact", head: true })),
      scope(
        supabase.from("leads").select("id", { count: "exact", head: true }),
      ).not("phone", "is", null),
      scope(
        supabase.from("leads").select("id", { count: "exact", head: true }),
      ).not("email", "is", null),
      scope(
        supabase.from("leads").select("id", { count: "exact", head: true }),
      ).gte("created_at", startDate.toISOString()),
      ...statuses.map((s) =>
        scope(
          supabase.from("leads").select("id", { count: "exact", head: true }),
        ).eq("status", s),
      ),
      ...services.map((s) =>
        scope(
          supabase.from("leads").select("id", { count: "exact", head: true }),
        ).eq("matched_service", s),
      ),
    ]);

  const total = totalRes.count || 0;

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

  const classifiedTotal = Object.values(byService).reduce((sum, v) => sum + v, 0);
  if (total > classifiedTotal) {
    byService["unclassified"] = total - classifiedTotal;
  }

  const recentDates = await fetchAllRows<{ created_at: string }>((from, to) =>
    scope(supabase.from("leads").select("created_at"))
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true })
      .range(from, to),
  );

  const dailyTrend: Record<string, number> = {};
  for (const row of recentDates) {
    const date = new Date(row.created_at).toISOString().split("T")[0];
    dailyTrend[date] = (dailyTrend[date] || 0) + 1;
  }

  return {
    total,
    withPhone: phoneRes.count || 0,
    withEmail: emailRes.count || 0,
    newInPeriod: newInPeriodRes.count || 0,
    byStatus,
    byService,
    dailyTrend,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { salesUser } = await requireSalesAuth();
    const supabase = createAdminClient();

    const days = parseInt(request.nextUrl.searchParams.get("days") || "30", 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Lead-derived aggregates (overview, byStatus, byService, dailyTrend) in a
    // single RPC round-trip, with a fallback to the old fan-out (see helpers).
    const { total, withPhone, withEmail, newInPeriod, byStatus, byService, dailyTrend } =
      await getLeadAggregates(supabase, salesUser.id, startDate);

    // Goal progress — daily / weekly / monthly call & won counts vs target.
    // `daily_target` is configured per-rep on sales_users; week = 5×, month = 21×.
    const dailyTarget = Math.max(salesUser.daily_target ?? 0, 0);
    const weekTarget = dailyTarget * 5;
    const monthTarget = dailyTarget * 21;

    const now = new Date();
    const dayStart = tbilisiDayStart(now);
    const weekStart = tbilisiWeekStart(now);
    const monthStart = tbilisiMonthStart(now);

    const callsRange = async (since: Date) => {
      // Real calls logged by this rep in the window.
      const { count } = await supabase
        .from("calls")
        .select("id", { count: "exact", head: true })
        .eq("sales_user_id", salesUser.id)
        .gte("occurred_at", since.toISOString());
      return count ?? 0;
    };
    const connectedRange = async (since: Date) => {
      const { count } = await supabase
        .from("calls")
        .select("id", { count: "exact", head: true })
        .eq("sales_user_id", salesUser.id)
        .eq("outcome", "contacted")
        .gte("occurred_at", since.toISOString());
      return count ?? 0;
    };
    const wonRange = async (since: Date) => {
      const { count } = await supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("sales_user_id", salesUser.id)
        .eq("status", "won")
        .gte("status_changed_at", since.toISOString());
      return count ?? 0;
    };

    const [
      callsToday,
      callsWeek,
      callsMonth,
      connectedToday,
      connectedWeek,
      connectedMonth,
      wonToday,
      wonWeek,
      wonMonth,
    ] = await Promise.all([
      callsRange(dayStart),
      callsRange(weekStart),
      callsRange(monthStart),
      connectedRange(dayStart),
      connectedRange(weekStart),
      connectedRange(monthStart),
      wonRange(dayStart),
      wonRange(weekStart),
      wonRange(monthStart),
    ]);

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
        goals: {
          dailyTarget,
          weekTarget,
          monthTarget,
          callsToday,
          callsWeek,
          callsMonth,
          connectedToday,
          connectedWeek,
          connectedMonth,
          wonToday,
          wonWeek,
          wonMonth,
        },
      },
    });
  } catch (err) {
    console.error("Analytics error:", err);
    return NextResponse.json({ error: "Analytics failed" }, { status: 500 });
  }
}
