import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

// Returns per-rep activity over a configurable window: today / week /
// month / all.
//
//   - assigned  → leads.assigned_at within window
//   - called    → leads.status_changed_at within window AND status != new
//   - callbacks → leads.callback_at within the today bucket of the window
//                 (still useful as a "what's due now" signal regardless of
//                  range — admins want to see today's callbacks even when
//                  viewing the month tab)
//   - byStatus  → for time-bounded ranges: leads transitioned to status X
//                 inside the window. For "all": current status distribution
//                 of this rep's entire book (so 0/250-still-new shows up).

type Range = "today" | "week" | "month" | "all";

function windowStart(range: Range): Date | null {
  if (range === "all") return null;
  const now = new Date();
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  if (range === "week") {
    // Monday-as-start-of-week
    const day = start.getUTCDay(); // 0 Sun .. 6 Sat
    const back = (day + 6) % 7; // Mon→0, Tue→1, ... Sun→6
    start.setUTCDate(start.getUTCDate() - back);
  } else if (range === "month") {
    start.setUTCDate(1);
  }
  return start;
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const rawRange = url.searchParams.get("range") || "today";
    const range: Range = (["today", "week", "month", "all"] as const).includes(
      rawRange as Range,
    )
      ? (rawRange as Range)
      : "today";

    const admin = createAdminClient();

    const start = windowStart(range);
    const sinceIso = start ? start.toISOString() : null;

    // Today bucket for callbacks (unchanged across range)
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);
    const todayIso = startOfDay.toISOString();
    const tomorrowIso = endOfDay.toISOString();

    const { data: reps } = await admin
      .from("sales_users")
      .select("id, name, email, role, daily_target")
      .order("name", { ascending: true });

    if (!reps || reps.length === 0) {
      return NextResponse.json({
        data: {
          range,
          reps: [],
          totals: { assigned: 0, called: 0, callbacks: 0 },
        },
      });
    }

    // For "all", we need every owned lead to compute current-state byStatus.
    // For time-bounded, only leads with relevant timestamps in window.
    // Page through results so we don't truncate at 1000 (PostgREST default).
    type LeadRow = {
      id: string;
      sales_user_id: string | null;
      status: string;
      assigned_at: string | null;
      status_changed_at: string | null;
      callback_at: string | null;
    };

    const fetched: LeadRow[] = [];
    const pageSize = 1000;
    let from = 0;
    while (true) {
      let q = admin
        .from("leads")
        .select(
          "id, sales_user_id, status, assigned_at, status_changed_at, callback_at",
        )
        .not("sales_user_id", "is", null)
        .range(from, from + pageSize - 1);
      if (sinceIso) {
        q = q.or(
          `assigned_at.gte.${sinceIso},status_changed_at.gte.${sinceIso},and(callback_at.gte.${todayIso},callback_at.lt.${tomorrowIso})`,
        );
      }
      const { data, error } = await q;
      if (error) {
        logger.error("Failed to load activity", { error: error.message });
        return NextResponse.json(
          { error: "Failed to load activity" },
          { status: 500 },
        );
      }
      const batch = (data as LeadRow[]) || [];
      fetched.push(...batch);
      if (batch.length < pageSize) break;
      from += pageSize;
      if (from > 100_000) break;
    }

    type Stats = {
      assigned: number;
      called: number;
      callbacks: number;
      byStatus: Record<string, number>;
    };
    const perRep = new Map<string, Stats>();
    for (const r of reps)
      perRep.set(r.id, { assigned: 0, called: 0, callbacks: 0, byStatus: {} });

    let totalAssigned = 0;
    let totalCalled = 0;
    let totalCallbacks = 0;

    for (const row of fetched) {
      if (!row.sales_user_id) continue;
      const s = perRep.get(row.sales_user_id);
      if (!s) continue;

      if (sinceIso) {
        if (row.assigned_at && row.assigned_at >= sinceIso) {
          s.assigned++;
          totalAssigned++;
        }
        if (
          row.status_changed_at &&
          row.status_changed_at >= sinceIso &&
          row.status !== "new"
        ) {
          s.called++;
          s.byStatus[row.status] = (s.byStatus[row.status] || 0) + 1;
          totalCalled++;
        }
      } else {
        // all-time: count each lead once in its current status
        if (row.status !== "new") {
          s.called++;
          totalCalled++;
        }
        s.byStatus[row.status] = (s.byStatus[row.status] || 0) + 1;
        if (row.assigned_at) {
          s.assigned++;
          totalAssigned++;
        }
      }

      if (
        row.callback_at &&
        row.callback_at >= todayIso &&
        row.callback_at < tomorrowIso
      ) {
        s.callbacks++;
        totalCallbacks++;
      }
    }

    const result = reps.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role,
      dailyTarget: r.daily_target ?? 80,
      ...perRep.get(r.id)!,
    }));

    return NextResponse.json({
      data: {
        range,
        reps: result,
        totals: {
          assigned: totalAssigned,
          called: totalCalled,
          callbacks: totalCallbacks,
        },
      },
    });
  } catch (err) {
    logger.error("Unexpected error in GET /api/admin/leads/daily-activity", {
      error: String(err),
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
