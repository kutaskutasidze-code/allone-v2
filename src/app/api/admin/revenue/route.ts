import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/sales-auth";
import { AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { fetchAllRows } from "@/lib/supabase/paginate";

export const dynamic = "force-dynamic";

// Closed deals (won leads) grouped by close month. Per month: the projects,
// total revenue (leads.value), collected (paid installments), and outstanding.
// Mirrors the aggregation in /api/admin/receivables, bucketed by won_at.
export async function GET() {
  try {
    await requireRole(["admin", "supervisor"]);
    const admin = createAdminClient();
    const round2 = (n: number) => Math.round(n * 100) / 100;

    const wonLeads = await fetchAllRows<{
      id: string;
      name: string | null;
      company: string | null;
      value: number | null;
      won_at: string | null;
      sales_user_id: string | null;
    }>((from, to) =>
      admin
        .from("leads")
        .select("id, name, company, value, won_at, sales_user_id")
        .eq("status", "won")
        .range(from, to),
    );

    const wonIds = new Set(wonLeads.map((l) => l.id));

    const payments = await fetchAllRows<{
      lead_id: string;
      amount: number | null;
      paid_at: string | null;
    }>((from, to) =>
      admin
        .from("lead_payments")
        .select("lead_id, amount, paid_at")
        .range(from, to),
    );

    const paidByLead = new Map<string, number>();
    for (const p of payments) {
      if (!wonIds.has(p.lead_id) || !p.paid_at) continue;
      paidByLead.set(
        p.lead_id,
        (paidByLead.get(p.lead_id) || 0) + Number(p.amount || 0),
      );
    }

    const { data: users } = await admin.from("sales_users").select("id, name");
    const userName = new Map((users || []).map((u) => [u.id, u.name]));

    type Deal = {
      leadId: string;
      name: string | null;
      company: string | null;
      repName: string | null;
      value: number;
      collected: number;
      outstanding: number;
    };
    const monthMap = new Map<string, Deal[]>();
    let tRevenue = 0;
    let tCollected = 0;
    let tOutstanding = 0;

    for (const l of wonLeads) {
      const value = Number(l.value || 0);
      const paid = paidByLead.get(l.id) || 0;
      const collected = round2(Math.min(paid, value));
      const outstanding = round2(Math.max(0, value - paid));
      tRevenue += value;
      tCollected += collected;
      tOutstanding += outstanding;
      const key = l.won_at ? String(l.won_at).slice(0, 7) : "undated";
      const arr = monthMap.get(key) || [];
      arr.push({
        leadId: l.id,
        name: l.name,
        company: l.company,
        repName: l.sales_user_id ? userName.get(l.sales_user_id) ?? null : null,
        value: round2(value),
        collected,
        outstanding,
      });
      monthMap.set(key, arr);
    }

    const months = [...monthMap.entries()]
      .sort((a, b) => {
        // "undated" last; otherwise YYYY-MM descending (most recent first).
        if (a[0] === "undated") return 1;
        if (b[0] === "undated") return -1;
        return a[0] < b[0] ? 1 : -1;
      })
      .map(([key, deals]) => {
        deals.sort((a, b) => b.value - a.value);
        const revenue = round2(deals.reduce((s, d) => s + d.value, 0));
        const collected = round2(deals.reduce((s, d) => s + d.collected, 0));
        const outstanding = round2(deals.reduce((s, d) => s + d.outstanding, 0));
        const label =
          key === "undated"
            ? "Undated"
            : new Date(key + "-01T00:00:00Z").toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
                timeZone: "UTC",
              });
        return { key, label, revenue, collected, outstanding, deals };
      });

    return NextResponse.json({
      data: {
        months,
        totals: {
          revenue: round2(tRevenue),
          collected: round2(tCollected),
          outstanding: round2(tOutstanding),
          count: wonLeads.length,
        },
      },
    });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    logger.error("Unexpected error in GET /api/admin/revenue", {
      error: String(err),
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
