import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { requireRole } from "@/lib/sales-auth";
import { AuthError } from "@/lib/auth";
import { fetchAllRows } from "@/lib/supabase/paginate";
import { tbilisiDayStart, tbilisiWeekStart, tbilisiMonthStart } from "@/lib/time";

export const dynamic = "force-dynamic";

// Returns per-rep activity over a configurable window: today / week /
// month / all.
//
//   - assigned       → leads.assigned_at within window
//   - called         → real calls logged (calls.occurred_at) within window
//   - connectedCalls → those calls with outcome='connected'
//   - callbacks      → OPEN tasks (tasks.status='open') due within the today
//                      bucket of the window (still useful as a "what's due now"
//                      signal regardless of range — admins want to see today's
//                      follow-ups even when viewing the month tab)
//   - byStatus       → current status distribution of this rep's book (reads
//                      leads.status). For time-bounded ranges it reflects the
//                      current status of leads with activity in the window.

type Range = "today" | "week" | "month" | "all";

function windowStart(range: Range): Date | null {
  if (range === "all") return null;
  if (range === "week") return tbilisiWeekStart();
  if (range === "month") return tbilisiMonthStart();
  return tbilisiDayStart();
}

export async function GET(request: Request) {
  try {
    await requireRole(['admin', 'supervisor']);

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
    const startOfDay = tbilisiDayStart();
    const endOfDay = new Date(startOfDay.getTime() + 24 * 3600_000);
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
          totals: { assigned: 0, called: 0, connectedCalls: 0, callbacks: 0 },
        },
      });
    }

    // Real calls logged in the window, tallied per rep (total + connected).
    // Supabase JS can't GROUP BY, so fetch and tally in JS.
    const callRows = await fetchAllRows<{ sales_user_id: string | null; outcome: string }>(
      (from, to) => {
        let q = admin.from("calls").select("sales_user_id, outcome").range(from, to);
        if (sinceIso) q = q.gte("occurred_at", sinceIso);
        return q;
      },
    );
    const callsByRep = new Map<string, { called: number; connected: number }>();
    for (const c of callRows) {
      if (!c.sales_user_id) continue;
      const agg = callsByRep.get(c.sales_user_id) || { called: 0, connected: 0 };
      agg.called++;
      if (c.outcome === "connected") agg.connected++;
      callsByRep.set(c.sales_user_id, agg);
    }

    // Open follow-up tasks due today, per rep (regardless of selected range).
    const { data: taskRows, error: tasksError } = await admin
      .from("tasks")
      .select("sales_user_id")
      .eq("status", "open")
      .gte("due_at", todayIso)
      .lt("due_at", tomorrowIso);
    if (tasksError) {
      logger.error("Failed to load tasks activity", { error: tasksError.message });
      return NextResponse.json(
        { error: "Failed to load activity" },
        { status: 500 },
      );
    }
    const callbacksByRep = new Map<string, number>();
    for (const t of taskRows || []) {
      if (!t.sales_user_id) continue;
      callbacksByRep.set(t.sales_user_id, (callbacksByRep.get(t.sales_user_id) || 0) + 1);
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
    };

    const fetched: LeadRow[] = [];
    const pageSize = 1000;
    let from = 0;
    while (true) {
      let q = admin
        .from("leads")
        .select(
          "id, sales_user_id, status, assigned_at, status_changed_at",
        )
        .not("sales_user_id", "is", null)
        .range(from, from + pageSize - 1);
      if (sinceIso) {
        q = q.or(
          `assigned_at.gte.${sinceIso},status_changed_at.gte.${sinceIso}`,
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

    // Leads loop covers only `assigned` and `byStatus` now; `called`/
    // `connectedCalls` come from the calls table and `callbacks` from tasks.
    type Stats = {
      assigned: number;
      byStatus: Record<string, number>;
    };
    const perRep = new Map<string, Stats>();
    for (const r of reps) perRep.set(r.id, { assigned: 0, byStatus: {} });

    let totalAssigned = 0;

    for (const row of fetched) {
      if (!row.sales_user_id) continue;
      const s = perRep.get(row.sales_user_id);
      if (!s) continue;

      if (sinceIso) {
        // byStatus for windowed ranges is computed from lead_status_history
        // below (transition counts), not this current-status snapshot.
        if (row.assigned_at && row.assigned_at >= sinceIso) {
          s.assigned++;
          totalAssigned++;
        }
      } else {
        // all-time: count each lead once in its current status
        s.byStatus[row.status] = (s.byStatus[row.status] || 0) + 1;
        if (row.assigned_at) {
          s.assigned++;
          totalAssigned++;
        }
      }
    }

    // Windowed byStatus = transitions INTO each status during the window (from
    // lead_status_history), not a current-status snapshot — a lead that moved
    // new→in_process→won today counts under each step, attributed to its owner.
    if (sinceIso) {
      const transitions = await fetchAllRows<{ to_status: string; leads: unknown }>(
        (from, to) =>
          admin
            .from("lead_status_history")
            .select("to_status, leads!inner(sales_user_id)")
            .gte("changed_at", sinceIso)
            .neq("to_status", "new")
            .range(from, to),
      );
      for (const t of transitions) {
        const lead = (Array.isArray(t.leads) ? t.leads[0] : t.leads) as
          | { sales_user_id: string | null }
          | null
          | undefined;
        const uid = lead?.sales_user_id;
        if (!uid) continue;
        const s = perRep.get(uid);
        if (!s) continue;
        s.byStatus[t.to_status] = (s.byStatus[t.to_status] || 0) + 1;
      }
    }

    let totalCalled = 0;
    let totalConnected = 0;
    let totalCallbacks = 0;

    const result = reps.map((r) => {
      const calls = callsByRep.get(r.id) || { called: 0, connected: 0 };
      const callbacks = callbacksByRep.get(r.id) || 0;
      totalCalled += calls.called;
      totalConnected += calls.connected;
      totalCallbacks += callbacks;
      return {
        id: r.id,
        name: r.name,
        email: r.email,
        role: r.role,
        dailyTarget: r.daily_target ?? 80,
        called: calls.called,
        connectedCalls: calls.connected,
        callbacks,
        ...perRep.get(r.id)!,
      };
    });

    return NextResponse.json({
      data: {
        range,
        reps: result,
        totals: {
          assigned: totalAssigned,
          called: totalCalled,
          connectedCalls: totalConnected,
          callbacks: totalCallbacks,
        },
      },
    });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    logger.error("Unexpected error in GET /api/admin/leads/daily-activity", {
      error: String(err),
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
