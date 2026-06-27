/**
 * Seed the P&L tables from the investor Excel.
 *   - pnl_plan   ← "Monthly P&L (2)" sheet (all rows, 24 months) — the fixed plan.
 *   - pnl_actual ← "Actual P&L" sheet (input rows only, months that have actuals).
 * Autofed lines (revenue / projects / commission) are NOT imported — they come
 * live from the CRM. Idempotent: wipes both tables and re-inserts.
 *
 *   node scripts/import-pnl.mjs "<path to .xlsx>"
 */
import ExcelJS from "exceljs";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const FILE = process.argv[2];
if (!FILE) {
  console.error('Usage: node scripts/import-pnl.mjs "<path to .xlsx>"');
  process.exit(1);
}

const env = {};
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Both sheets share this row layout. Map by row number ("Infrastructure" is in
// both COGS row 16 and CapEx row 42, so labels alone are ambiguous).
const ROW_TO_KEY = {
  3: "headcount_sales", 4: "headcount_tech",
  7: "new_projects", 8: "cumulative_projects",
  13: "revenue",
  16: "cogs_infra", 17: "cogs_commission", 18: "total_cogs",
  20: "gross_profit", 21: "gross_margin",
  24: "opex_tech_salaries", 25: "opex_founders", 26: "opex_accountant",
  27: "opex_mktg_mgr", 28: "opex_payroll_tax", 29: "opex_pension",
  30: "opex_marketing", 31: "opex_other", 32: "total_opex",
  34: "ebitda", 35: "ebitda_margin", 36: "net_income", 37: "net_margin",
  40: "capex_hardware", 41: "capex_software", 42: "capex_infra", 43: "total_capex",
  45: "total_expenses",
  51: "cumulative_net_income", 52: "investment_remaining", 53: "payback",
};
const INPUT_KEYS = new Set([
  "headcount_sales", "headcount_tech", "cogs_infra",
  "opex_tech_salaries", "opex_founders", "opex_accountant", "opex_mktg_mgr",
  "opex_payroll_tax", "opex_pension", "opex_marketing", "opex_other",
  "capex_hardware", "capex_software", "capex_infra",
]);
const colForIdx = (i) => (i <= 12 ? i + 2 : i + 3); // skip the Y1-TOTAL column
const resolve = (ws, r, c) => {
  let v = ws.getCell(r, c).value;
  if (v && typeof v === "object") v = "result" in v ? v.result : null;
  return v;
};
const num = (ws, r, c) => {
  const v = resolve(ws, r, c);
  return typeof v === "number" ? v : null;
};

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(FILE);
const plan = wb.getWorksheet("Monthly P&L (2)");
const actual = wb.getWorksheet("Actual P&L");
if (!plan || !actual) throw new Error("Expected sheets 'Monthly P&L (2)' + 'Actual P&L'");

// PLAN — every row, 24 months.
const planRows = [];
for (const [r, key] of Object.entries(ROW_TO_KEY)) {
  for (let idx = 1; idx <= 24; idx++) {
    const c = colForIdx(idx);
    if (key === "payback") {
      const v = resolve(plan, +r, c);
      if (v != null && v !== "") planRows.push({ line_key: key, month_idx: idx, text_value: String(v), value: null });
    } else {
      const n = num(plan, +r, c);
      if (n != null) planRows.push({ line_key: key, month_idx: idx, value: n, text_value: null });
    }
  }
}

// ACTUAL — input rows only, for months where a revenue actual is present.
const activeMonths = [];
for (let idx = 1; idx <= 24; idx++) if (num(actual, 13, colForIdx(idx)) != null) activeMonths.push(idx);
const actualRows = [];
for (const [r, key] of Object.entries(ROW_TO_KEY)) {
  if (!INPUT_KEYS.has(key)) continue;
  for (const idx of activeMonths) {
    const n = num(actual, +r, colForIdx(idx));
    if (n != null) actualRows.push({ line_key: key, month_idx: idx, value: n });
  }
}

console.log("plan rows:", planRows.length, "| actual input rows:", actualRows.length, "| active actual months:", activeMonths);

await sb.from("pnl_plan").delete().neq("month_idx", 0);
await sb.from("pnl_actual").delete().neq("month_idx", 0);
for (let i = 0; i < planRows.length; i += 500) {
  const { error } = await sb.from("pnl_plan").insert(planRows.slice(i, i + 500));
  if (error) throw error;
}
for (let i = 0; i < actualRows.length; i += 500) {
  const { error } = await sb.from("pnl_actual").insert(actualRows.slice(i, i + 500));
  if (error) throw error;
}
console.log("imported ✓");
