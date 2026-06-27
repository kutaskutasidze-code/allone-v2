// P&L line-item model — mirrors the investor Excel ("Monthly P&L" structure).
// 24 months, M1 = April 2026. Currency: USD (CRM GEL figures are converted at
// USD_GEL_RATE for the auto-fed lines). The PLAN is fixed (imported once); the
// ACTUAL is maintained in the CRM — input rows are entered, autofed rows come
// live from won deals + commissions, computed rows are derived here.

export const PNL_MONTHS = 24;
export const PNL_START = { year: 2026, month: 4 }; // M1 = April 2026
export const USD_GEL_RATE = 2.7; // model rate; GEL → USD = gel / rate
export const TOTAL_INVESTMENT_USD = 240000;

export type LineKind = "input" | "autofeed" | "computed";
export type LineFormat = "money" | "percent" | "count" | "text";

export interface PnlLine {
  key: string;
  label: string;
  section: string; // section header it belongs to
  kind: LineKind;
  format: LineFormat;
  total?: boolean; // bold "total/headline" row
}

// month index (1..24) → { year, month } calendar date
export function monthIdxToDate(idx: number): { year: number; month: number } {
  const zero = PNL_START.month - 1 + (idx - 1);
  return { year: PNL_START.year + Math.floor(zero / 12), month: (zero % 12) + 1 };
}
// month index → "YYYY-MM"
export function monthIdxToKey(idx: number): string {
  const { year, month } = monthIdxToDate(idx);
  return `${year}-${String(month).padStart(2, "0")}`;
}
// month index → short label like "Apr '26"
export function monthIdxToLabel(idx: number): string {
  const { year, month } = monthIdxToDate(idx);
  const m = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", {
    month: "short",
    timeZone: "UTC",
  });
  return `${m} '${String(year).slice(2)}`;
}

// Lines in display order. `section` doubles as the grouping header.
export const PNL_LINES: PnlLine[] = [
  { key: "headcount_sales", label: "Sales Team", section: "Headcount", kind: "input", format: "count" },
  { key: "headcount_tech", label: "Tech Team", section: "Headcount", kind: "input", format: "count" },

  { key: "new_projects", label: "New Projects", section: "Projects", kind: "autofeed", format: "count" },
  { key: "cumulative_projects", label: "Cumulative Projects", section: "Projects", kind: "computed", format: "count" },

  { key: "revenue", label: "Total Revenue", section: "Revenue", kind: "autofeed", format: "money", total: true },

  { key: "cogs_infra", label: "Infrastructure", section: "Cost of Revenue", kind: "input", format: "money" },
  { key: "cogs_commission", label: "Sales Commission", section: "Cost of Revenue", kind: "input", format: "money" },
  { key: "total_cogs", label: "Total COGS", section: "Cost of Revenue", kind: "computed", format: "money", total: true },

  { key: "gross_profit", label: "Gross Profit", section: "Gross Profit", kind: "computed", format: "money", total: true },
  { key: "gross_margin", label: "Gross Margin %", section: "Gross Profit", kind: "computed", format: "percent" },

  { key: "opex_tech_salaries", label: "Tech Team Salaries", section: "Operating Expenses", kind: "input", format: "money" },
  { key: "opex_founders", label: "Founder Salaries", section: "Operating Expenses", kind: "input", format: "money" },
  { key: "opex_accountant", label: "Accountant Salary", section: "Operating Expenses", kind: "input", format: "money" },
  { key: "opex_mktg_mgr", label: "Marketing Manager Salary", section: "Operating Expenses", kind: "input", format: "money" },
  { key: "opex_payroll_tax", label: "Payroll Tax", section: "Operating Expenses", kind: "input", format: "money" },
  { key: "opex_pension", label: "Pension", section: "Operating Expenses", kind: "input", format: "money" },
  { key: "opex_marketing", label: "Marketing", section: "Operating Expenses", kind: "input", format: "money" },
  { key: "opex_other", label: "Other Expenses", section: "Operating Expenses", kind: "input", format: "money" },
  { key: "total_opex", label: "Total OpEx", section: "Operating Expenses", kind: "computed", format: "money", total: true },

  { key: "ebitda", label: "EBITDA", section: "EBITDA", kind: "computed", format: "money", total: true },
  { key: "ebitda_margin", label: "EBITDA Margin %", section: "EBITDA", kind: "computed", format: "percent" },

  { key: "net_income", label: "Net Income", section: "Net Income", kind: "computed", format: "money", total: true },
  { key: "net_margin", label: "Net Margin %", section: "Net Income", kind: "computed", format: "percent" },

  { key: "capex_hardware", label: "Hardware", section: "CapEx", kind: "input", format: "money" },
  { key: "capex_software", label: "Accountant Software", section: "CapEx", kind: "input", format: "money" },
  { key: "capex_infra", label: "Infrastructure", section: "CapEx", kind: "input", format: "money" },
  { key: "total_capex", label: "Total CapEx", section: "CapEx", kind: "computed", format: "money", total: true },

  { key: "total_expenses", label: "Total Expenses", section: "Totals", kind: "computed", format: "money", total: true },

  { key: "cumulative_net_income", label: "Cumulative Net Income", section: "Investment Payback", kind: "computed", format: "money" },
  { key: "investment_remaining", label: "Investment Remaining", section: "Investment Payback", kind: "computed", format: "money" },
  { key: "payback", label: "Payback Achieved?", section: "Investment Payback", kind: "computed", format: "text" },
];

export const PNL_LINE_BY_KEY: Record<string, PnlLine> = Object.fromEntries(
  PNL_LINES.map((l) => [l.key, l]),
);

// Input rows a user can enter for a month's actuals (excludes autofed + computed).
export const PNL_INPUT_KEYS = PNL_LINES.filter((l) => l.kind === "input").map((l) => l.key);

/**
 * Derive the computed rows for one month from a column of values keyed by line.
 * `col` must already contain the input + autofed values. Mutates and returns it.
 * `cumulativeNI` is the running net income BEFORE this month.
 */
export function computeColumn(
  col: Record<string, number>,
  prevCumulativeNI: number,
): Record<string, number> {
  const v = (k: string) => col[k] || 0;
  const revenue = v("revenue");

  col.total_cogs = v("cogs_infra") + v("cogs_commission");
  col.gross_profit = revenue - col.total_cogs;
  col.gross_margin = revenue ? col.gross_profit / revenue : 0;

  col.total_opex =
    v("opex_tech_salaries") + v("opex_founders") + v("opex_accountant") +
    v("opex_mktg_mgr") + v("opex_payroll_tax") + v("opex_pension") +
    v("opex_marketing") + v("opex_other");

  col.ebitda = col.gross_profit - col.total_opex;
  col.ebitda_margin = revenue ? col.ebitda / revenue : 0;
  col.net_income = col.ebitda; // model has no interest/tax/D&A above net
  col.net_margin = revenue ? col.net_income / revenue : 0;

  col.total_capex = v("capex_hardware") + v("capex_software") + v("capex_infra");
  col.total_expenses = col.total_cogs + col.total_opex + col.total_capex;

  col.cumulative_net_income = prevCumulativeNI + col.net_income;
  col.investment_remaining = TOTAL_INVESTMENT_USD - col.cumulative_net_income;
  return col;
}
