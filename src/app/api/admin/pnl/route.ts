import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/sales-auth";
import { AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { fetchAllRows } from "@/lib/supabase/paginate";
import {
  PNL_LINES,
  PNL_MONTHS,
  PNL_INPUT_KEYS,
  PNL_START,
  USD_GEL_RATE,
  TOTAL_INVESTMENT_USD,
  monthIdxToKey,
  monthIdxToLabel,
  computeColumn,
} from "@/lib/pnl-config";

export const dynamic = "force-dynamic";

// How many months are "realized" (≤ current calendar month, or have entered data).
function currentMonthIdx(): number {
  const now = new Date();
  const idx =
    (now.getUTCFullYear() - PNL_START.year) * 12 +
    (now.getUTCMonth() + 1 - PNL_START.month) +
    1;
  return Math.max(0, Math.min(PNL_MONTHS, idx));
}

export async function GET() {
  try {
    await requireRole(["admin", "supervisor"]);
    const admin = createAdminClient();

    // Plan (fixed) + stored actual inputs + editable settings.
    const [{ data: planRows }, { data: actualRows }, { data: settingRows }] =
      await Promise.all([
        admin.from("pnl_plan").select("line_key, month_idx, value, text_value"),
        admin.from("pnl_actual").select("line_key, month_idx, value"),
        admin.from("pnl_settings").select("key, value"),
      ]);
    const rate =
      Number(settingRows?.find((s) => s.key === "usd_gel_rate")?.value) || USD_GEL_RATE;

    const plan: Record<string, Record<number, number | null>> = {};
    const planText: Record<string, Record<number, string | null>> = {};
    for (const r of planRows || []) {
      (plan[r.line_key] ??= {})[r.month_idx] = r.value == null ? null : Number(r.value);
      (planText[r.line_key] ??= {})[r.month_idx] = r.text_value ?? null;
    }
    const storedActual: Record<string, Record<number, number>> = {};
    let maxStored = 0;
    for (const r of actualRows || []) {
      (storedActual[r.line_key] ??= {})[r.month_idx] = Number(r.value || 0);
      if (r.month_idx > maxStored) maxStored = r.month_idx;
    }

    // Auto-feed from the CRM: won-deal revenue + counts by calendar month.
    const won = await fetchAllRows<{ value: number | null; won_at: string | null }>(
      (from, to) =>
        admin.from("leads").select("value, won_at").eq("status", "won").range(from, to),
    );
    const gelRevByMonth: Record<string, number> = {};
    const wonCountByMonth: Record<string, number> = {};
    for (const l of won) {
      if (!l.won_at) continue;
      const k = String(l.won_at).slice(0, 7);
      gelRevByMonth[k] = (gelRevByMonth[k] || 0) + Number(l.value || 0);
      wonCountByMonth[k] = (wonCountByMonth[k] || 0) + 1;
    }

    const activeCount = Math.max(currentMonthIdx(), maxStored);

    // Build the actual columns month by month (running cumulatives).
    const actualCols: (Record<string, number> | null)[] = [];
    let cumNI = 0;
    let cumProj = 0;
    for (let idx = 1; idx <= PNL_MONTHS; idx++) {
      if (idx > activeCount) {
        actualCols.push(null);
        continue;
      }
      const col: Record<string, number> = {};
      for (const key of PNL_INPUT_KEYS) col[key] = storedActual[key]?.[idx] ?? 0;
      const mkey = monthIdxToKey(idx);
      const rev = (gelRevByMonth[mkey] || 0) / rate;
      col.revenue = rev;
      col.new_projects = wonCountByMonth[mkey] || 0;
      // cogs_commission is an entered input (not all revenue carries commission) —
      // it's already loaded above from pnl_actual.
      cumProj += col.new_projects;
      col.cumulative_projects = cumProj;
      computeColumn(col, cumNI);
      cumNI = col.cumulative_net_income;
      actualCols.push(col);
    }

    const round2 = (n: number) => Math.round(n * 100) / 100;
    const lines = PNL_LINES.map((line) => {
      const planArr: (number | string | null)[] = [];
      const actualArr: (number | string | null)[] = [];
      const varianceArr: (number | null)[] = [];
      for (let idx = 1; idx <= PNL_MONTHS; idx++) {
        // plan
        let pv: number | string | null;
        if (line.format === "text") pv = planText[line.key]?.[idx] ?? null;
        else pv = plan[line.key]?.[idx] ?? null;
        planArr.push(typeof pv === "number" ? round2(pv) : pv);

        // actual
        const col = actualCols[idx - 1];
        let av: number | string | null = null;
        if (col) {
          if (line.format === "text") {
            av = col.cumulative_net_income >= TOTAL_INVESTMENT_USD ? "Yes" : "No";
          } else {
            av = round2(col[line.key] ?? 0);
          }
        }
        actualArr.push(av);

        // variance (numeric only, both present)
        varianceArr.push(
          typeof pv === "number" && typeof av === "number" ? round2(av - pv) : null,
        );
      }
      return {
        key: line.key,
        label: line.label,
        section: line.section,
        kind: line.kind,
        format: line.format,
        total: !!line.total,
        plan: planArr,
        actual: actualArr,
        variance: varianceArr,
      };
    });

    return NextResponse.json({
      data: {
        months: Array.from({ length: PNL_MONTHS }, (_, i) => ({
          idx: i + 1,
          label: monthIdxToLabel(i + 1),
          key: monthIdxToKey(i + 1),
        })),
        lines,
        rate,
        investment: TOTAL_INVESTMENT_USD,
        activeActualCount: activeCount,
      },
    });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    logger.error("Unexpected error in GET /api/admin/pnl", { error: String(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Edit one actual input cell. Body: { line_key, month_idx, value }.
export async function PATCH(request: Request) {
  try {
    await requireRole(["admin"]);
    const body = await request.json();
    const admin = createAdminClient();

    // Update the editable USD/GEL rate.
    if (body?.rate !== undefined) {
      const newRate = Number(body.rate);
      if (!Number.isFinite(newRate) || newRate <= 0)
        return NextResponse.json({ error: "Invalid rate" }, { status: 400 });
      await admin
        .from("pnl_settings")
        .upsert({ key: "usd_gel_rate", value: newRate }, { onConflict: "key" });
      return NextResponse.json({ data: { ok: true } });
    }

    const lineKey = String(body?.line_key || "");
    const monthIdx = Number(body?.month_idx);
    const value = body?.value === null || body?.value === "" ? null : Number(body?.value);

    if (!PNL_INPUT_KEYS.includes(lineKey))
      return NextResponse.json({ error: "Not an editable line" }, { status: 400 });
    if (!Number.isInteger(monthIdx) || monthIdx < 1 || monthIdx > PNL_MONTHS)
      return NextResponse.json({ error: "Invalid month" }, { status: 400 });
    if (value !== null && !Number.isFinite(value))
      return NextResponse.json({ error: "Invalid value" }, { status: 400 });

    if (value === null) {
      await admin.from("pnl_actual").delete().eq("line_key", lineKey).eq("month_idx", monthIdx);
    } else {
      await admin
        .from("pnl_actual")
        .upsert(
          { line_key: lineKey, month_idx: monthIdx, value, updated_at: new Date().toISOString() },
          { onConflict: "line_key,month_idx" },
        );
    }
    return NextResponse.json({ data: { ok: true } });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    logger.error("Unexpected error in PATCH /api/admin/pnl", { error: String(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
