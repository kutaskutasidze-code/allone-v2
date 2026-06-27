"use client";

import { Fragment, useCallback, useEffect, useState } from "react";

interface Line {
  key: string;
  label: string;
  section: string;
  kind: "input" | "autofeed" | "computed";
  format: "money" | "percent" | "count" | "text";
  total: boolean;
  plan: (number | string | null)[];
  actual: (number | string | null)[];
  variance: (number | null)[];
}
interface MonthCol {
  idx: number;
  label: string;
  key: string;
}
interface Data {
  months: MonthCol[];
  lines: Line[];
  rate: number;
  investment: number;
  activeActualCount: number;
}

type View = "plan" | "actual" | "variance";

const CARD =
  "bg-[var(--bg-surface)] border border-[var(--allone-line-soft)] rounded-[var(--radius-md)] shadow-[var(--shadow-xs)] shadow-black/[0.02]";

const money = (n: number) =>
  `${n < 0 ? "-" : ""}$${Math.round(Math.abs(n)).toLocaleString()}`;

function fmt(line: Line, v: number | string | null): string {
  if (v === null || v === undefined) return "—";
  if (line.format === "text") return String(v);
  const n = Number(v);
  if (line.format === "percent") return `${Math.round(n * 100)}%`;
  if (line.format === "count") return String(Math.round(n));
  return money(n);
}

export default function FinancialsPage() {
  const [data, setData] = useState<Data | null>(null);
  const [view, setView] = useState<View>("actual");
  const [year, setYear] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    fetch("/api/admin/pnl")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed"))))
      .then((j) => setData(j.data))
      .catch(() => setError("Failed to load P&L"))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => load(), [load]);

  const saveCell = async (lineKey: string, monthIdx: number, raw: string) => {
    const value = raw.trim() === "" ? null : Number(raw);
    if (value !== null && !Number.isFinite(value)) return;
    await fetch("/api/admin/pnl", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ line_key: lineKey, month_idx: monthIdx, value }),
    });
    load();
  };

  const saveRate = async (raw: string) => {
    const rate = Number(raw);
    if (!Number.isFinite(rate) || rate <= 0) return;
    await fetch("/api/admin/pnl", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rate }),
    });
    load();
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-sm text-[var(--ink-400)]">
        Loading P&L…
      </div>
    );
  if (!data)
    return (
      <div className="p-3 bg-red-50 border border-red-100 rounded-[var(--radius-sm)] text-red-600 text-sm">
        {error || "No data"}
      </div>
    );

  const cols = data.months.filter((m) => (year === 1 ? m.idx <= 12 : m.idx >= 13));
  const valueAt = (line: Line, idx: number): number | string | null =>
    (line[view] as (number | string | null)[])[idx - 1];

  // Per-line total across the shown year (money + count lines only).
  const totalFor = (line: Line): number | null => {
    if (line.format !== "money" && line.format !== "count") return null;
    let sum = 0;
    let any = false;
    for (const m of cols) {
      const v = valueAt(line, m.idx);
      if (typeof v === "number") {
        sum += v;
        any = true;
      }
    }
    return any ? sum : null;
  };

  let lastSection = "";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--ink-900)] font-display">
          P&amp;L
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-500)]">
          Monthly P&amp;L vs the investor plan (USD). Plan is fixed; revenue and
          projects auto-feed from won deals.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-[var(--radius-sm)] text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-[var(--radius-sm)] border border-[var(--allone-line)] overflow-hidden">
          {(["plan", "actual", "variance"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                view === v
                  ? "bg-[var(--ink-900)] text-white"
                  : "bg-[var(--bg-surface)] text-[var(--ink-600)] hover:bg-[var(--bg-surface-alt)]"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="inline-flex rounded-[var(--radius-sm)] border border-[var(--allone-line)] overflow-hidden">
          {([1, 2] as const).map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                year === y
                  ? "bg-[var(--ink-900)] text-white"
                  : "bg-[var(--bg-surface)] text-[var(--ink-600)] hover:bg-[var(--bg-surface-alt)]"
              }`}
            >
              Year {y}
            </button>
          ))}
        </div>
        {view === "actual" && (
          <span className="text-xs text-[var(--ink-400)]">
            Editable cells are blue — type to update; computed rows recalc.
          </span>
        )}
        <label className="flex items-center gap-1.5 text-xs text-[var(--ink-500)] ml-auto">
          USD/GEL rate
          <input
            type="number"
            step="0.01"
            min="0"
            defaultValue={data.rate}
            key={`rate-${data.rate}`}
            onBlur={(e) => {
              if (Number(e.target.value) !== data.rate) saveRate(e.target.value);
            }}
            className="w-20 text-right px-1.5 py-1 rounded border border-[var(--allone-line)] focus:border-[var(--ao-accent)] focus:outline-none"
          />
        </label>
      </div>

      <div className={`${CARD} overflow-x-auto`}>
        <table className="text-xs border-collapse min-w-full">
          <thead>
            <tr className="border-b border-[var(--allone-line)]">
              <th className="sticky left-0 z-10 bg-[var(--bg-surface)] text-left px-3 py-2 font-medium text-[var(--ink-500)] uppercase tracking-wider text-[10px] min-w-[190px]">
                {view}
              </th>
              {cols.map((m) => (
                <th
                  key={m.idx}
                  className="px-3 py-2 text-right font-medium text-[var(--ink-500)] whitespace-nowrap min-w-[78px]"
                >
                  {m.label}
                </th>
              ))}
              <th className="px-3 py-2 text-right font-semibold text-[var(--ink-700)] min-w-[88px]">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {data.lines.map((line) => {
              const header =
                line.section !== lastSection ? ((lastSection = line.section), line.section) : null;
              const editable = view === "actual" && line.kind === "input";
              const total = totalFor(line);
              return (
                <Fragment key={line.key}>
                  {header && (
                    <tr className="bg-[var(--bg-surface-alt)]">
                      <td
                        colSpan={cols.length + 2}
                        className="sticky left-0 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-500)]"
                      >
                        {header}
                      </td>
                    </tr>
                  )}
                  <tr
                    key={line.key}
                    className="border-b border-[var(--allone-line-soft)] last:border-0 hover:bg-[var(--bg-surface-alt)]/50"
                  >
                    <td
                      className={`sticky left-0 z-10 bg-[var(--bg-surface)] px-3 py-1.5 whitespace-nowrap ${
                        line.total ? "font-semibold text-[var(--ink-900)]" : "text-[var(--ink-700)]"
                      }`}
                    >
                      {line.label}
                      {line.kind === "autofeed" && (
                        <span className="ml-1.5 text-[9px] text-[var(--ao-accent)] uppercase">
                          live
                        </span>
                      )}
                    </td>
                    {cols.map((m) => {
                      const v = valueAt(line, m.idx);
                      if (editable && m.idx <= data.activeActualCount) {
                        const raw =
                          line.actual[m.idx - 1] === null ? "" : String(line.actual[m.idx - 1]);
                        return (
                          <td key={m.idx} className="px-1 py-1 text-right">
                            <input
                              type="number"
                              defaultValue={raw}
                              key={`${line.key}-${m.idx}-${raw}`}
                              onBlur={(e) => {
                                if (e.target.value !== raw) saveCell(line.key, m.idx, e.target.value);
                              }}
                              className="w-[68px] text-right px-1 py-0.5 rounded border border-[var(--ao-accent)]/30 bg-[var(--ao-accent)]/[0.04] focus:border-[var(--ao-accent)] focus:outline-none"
                            />
                          </td>
                        );
                      }
                      const isVar = view === "variance" && typeof v === "number";
                      return (
                        <td
                          key={m.idx}
                          className={`px-3 py-1.5 text-right whitespace-nowrap ${
                            line.total ? "font-semibold" : ""
                          } ${
                            isVar
                              ? (v as number) >= 0
                                ? "text-emerald-700"
                                : "text-red-600"
                              : "text-[var(--ink-800)]"
                          }`}
                        >
                          {isVar && (v as number) > 0 ? "+" : ""}
                          {fmt(line, v)}
                        </td>
                      );
                    })}
                    <td
                      className={`px-3 py-1.5 text-right whitespace-nowrap font-semibold ${
                        view === "variance" && typeof total === "number"
                          ? total >= 0
                            ? "text-emerald-700"
                            : "text-red-600"
                          : "text-[var(--ink-900)]"
                      }`}
                    >
                      {total === null ? "" : `${view === "variance" && total > 0 ? "+" : ""}${fmt(line, total)}`}
                    </td>
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
