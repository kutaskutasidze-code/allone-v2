import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/sales-auth";
import { AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { fetchAllRows } from "@/lib/supabase/paginate";

export const dynamic = "force-dynamic";

// "Who owes what" across won deals: for each won lead with an outstanding
// balance, how much is paid, owed, and overdue. Owed = leads.value − collected.
export async function GET() {
  try {
    await requireRole(["admin", "supervisor"]);
    const admin = createAdminClient();

    const round2 = (n: number) => Math.round(n * 100) / 100;
    // Today's calendar date in Tbilisi (UTC+4) for overdue comparison.
    const today = new Date(Date.now() + 4 * 3600_000).toISOString().slice(0, 10);

    const wonLeads = await fetchAllRows<{
      id: string;
      name: string | null;
      company: string | null;
      value: number | null;
      sales_user_id: string | null;
    }>((from, to) =>
      admin
        .from("leads")
        .select("id, name, company, value, sales_user_id")
        .eq("status", "won")
        .gt("value", 0)
        .range(from, to),
    );

    if (wonLeads.length === 0) {
      return NextResponse.json({
        data: { rows: [], totals: { outstanding: 0, overdue: 0, collected: 0, count: 0 } },
      });
    }

    const wonIds = new Set(wonLeads.map((l) => l.id));

    const payments = await fetchAllRows<{
      lead_id: string;
      amount: number | null;
      paid_at: string | null;
      due_date: string | null;
    }>((from, to) =>
      admin
        .from("lead_payments")
        .select("lead_id, amount, paid_at, due_date")
        .range(from, to),
    );

    const byLead = new Map<
      string,
      { paid: number; overdue: number; nextDue: string | null }
    >();
    for (const p of payments) {
      if (!wonIds.has(p.lead_id)) continue;
      const agg = byLead.get(p.lead_id) || { paid: 0, overdue: 0, nextDue: null };
      const amt = Number(p.amount || 0);
      if (p.paid_at) {
        agg.paid += amt;
      } else {
        if (p.due_date && p.due_date < today) agg.overdue += amt;
        if (p.due_date && (!agg.nextDue || p.due_date < agg.nextDue))
          agg.nextDue = p.due_date;
      }
      byLead.set(p.lead_id, agg);
    }

    const { data: users } = await admin
      .from("sales_users")
      .select("id, name");
    const userName = new Map((users || []).map((u) => [u.id, u.name]));

    let outstanding = 0;
    let overdue = 0;
    let collected = 0;
    const rows = wonLeads
      .map((l) => {
        const value = Number(l.value || 0);
        const agg = byLead.get(l.id) || { paid: 0, overdue: 0, nextDue: null };
        const paid = Math.min(agg.paid, value);
        const owed = round2(Math.max(0, value - agg.paid));
        outstanding += owed;
        overdue += round2(agg.overdue);
        collected += round2(agg.paid);
        return {
          leadId: l.id,
          name: l.name,
          company: l.company,
          repName: l.sales_user_id ? userName.get(l.sales_user_id) ?? null : null,
          value: round2(value),
          paid: round2(paid),
          owed,
          overdueAmount: round2(agg.overdue),
          nextDue: agg.nextDue,
        };
      })
      .filter((r) => r.owed > 0)
      .sort((a, b) => b.owed - a.owed);

    return NextResponse.json({
      data: {
        rows,
        totals: {
          outstanding: round2(outstanding),
          overdue: round2(overdue),
          collected: round2(collected),
          count: rows.length,
        },
      },
    });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    logger.error("Unexpected error in GET /api/admin/receivables", {
      error: String(err),
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
