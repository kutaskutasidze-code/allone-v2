import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSalesAuth } from "@/lib/sales-auth";
import { leadStatusSchema } from "@/lib/validations/leads";
import { fetchAllRows } from "@/lib/supabase/paginate";
import { tbilisiDayStart, tbilisiWeekStart, tbilisiMonthStart } from "@/lib/time";

export async function GET(request: NextRequest) {
  try {
    const { salesUser } = await requireSalesAuth();
    const supabase = createAdminClient();

    const days = parseInt(request.nextUrl.searchParams.get("days") || "30", 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const statuses = [...leadStatusSchema.options];
    const services = [
      "chatbots",
      "custom_ai",
      "automation",
      "website",
      "consulting",
    ];

    // Every sales user — including supervisors/admins — only sees their own
    // numbers on /sales/*. Team-wide analytics live behind /admin.
    const scope = <T extends ReturnType<typeof supabase.from>>(q: T) =>
      q.eq("sales_user_id", salesUser.id);

    const [
      totalRes,
      phoneRes,
      emailRes,
      newInPeriodRes,
      ...statusAndServiceResults
    ] = await Promise.all([
      scope(
        supabase.from("leads").select("id", { count: "exact", head: true }),
      ),
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
    const classifiedTotal = Object.values(byService).reduce(
      (sum, v) => sum + v,
      0,
    );
    if (total > classifiedTotal) {
      byService["unclassified"] = total - classifiedTotal;
    }

    // Daily trend - fetch just dates from the period (limit higher)
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
        .eq("outcome", "connected")
        .gte("occurred_at", since.toISOString());
      return count ?? 0;
    };
    const wonRange = async (since: Date) => {
      const { count } = await scope(
        supabase.from("leads").select("id", { count: "exact", head: true }),
      )
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
