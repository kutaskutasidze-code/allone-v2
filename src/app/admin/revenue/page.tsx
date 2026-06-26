"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface Deal {
  leadId: string;
  name: string | null;
  company: string | null;
  repName: string | null;
  value: number;
  collected: number;
  outstanding: number;
}
interface Month {
  key: string;
  label: string;
  revenue: number;
  collected: number;
  outstanding: number;
  deals: Deal[];
}
interface Totals {
  revenue: number;
  collected: number;
  outstanding: number;
  count: number;
}

const fmt = (n: number) =>
  `₾${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

const CARD =
  "bg-[var(--bg-surface)] border border-[var(--allone-line-soft)] rounded-[var(--radius-md)] shadow-[var(--shadow-xs)] shadow-black/[0.02] p-4";

const TH =
  "px-4 py-2.5 text-[11px] uppercase tracking-wider text-[var(--ink-500)] font-medium";

// Muted chart palette (not the bright emerald/amber).
const COLLECTED_COLOR = "#5c8a72";
const OUTSTANDING_COLOR = "#c2a878";

// Build a fixed 12-month window starting from the earliest month that has data,
// so the chart always reads as a full year (empty months render as ₾0).
function buildYearChart(months: Month[]) {
  const real = months.filter((m) => m.key !== "undated");
  const map = new Map(real.map((m) => [m.key, m]));
  const startKey = real.length
    ? [...real.map((m) => m.key)].sort()[0]
    : new Date().toISOString().slice(0, 7);
  const [sy, sm] = startKey.split("-").map(Number);
  const out: { name: string; Collected: number; Outstanding: number }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(Date.UTC(sy, sm - 1 + i, 1));
    const m = map.get(d.toISOString().slice(0, 7));
    out.push({
      name: d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
      Collected: m ? m.collected : 0,
      Outstanding: m ? m.outstanding : 0,
    });
  }
  return out;
}

export default function RevenuePage() {
  const [months, setMonths] = useState<Month[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/admin/revenue")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed"))))
      .then((json) => {
        if (active) {
          setMonths(json.data?.months || []);
          setTotals(json.data?.totals || null);
        }
      })
      .catch(() => {
        if (active) setError("Failed to load revenue");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-[var(--ink-400)]">
        Loading revenue...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-[var(--ink-900)] font-display">
          Revenue
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-500)]">
          Closed deals by month — revenue, collected, and outstanding.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-[var(--radius-sm)] text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Overall totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(
          [
            ["Revenue", totals?.revenue ?? 0, "text-[var(--ink-900)]"],
            ["Collected", totals?.collected ?? 0, "text-emerald-600"],
            ["Outstanding", totals?.outstanding ?? 0, "text-amber-600"],
          ] as const
        ).map(([label, val, cls]) => (
          <div key={label} className={CARD}>
            <div className="text-[11px] uppercase tracking-wider text-[var(--ink-500)]">
              {label}
            </div>
            <div className={`mt-1 text-2xl font-semibold ${cls}`}>{fmt(val)}</div>
          </div>
        ))}
      </div>

      {/* Chart: revenue per month, split into collected (paid) + outstanding */}
      {months.length > 0 && (
        <div className={CARD}>
          <div className="text-[11px] uppercase tracking-wider text-[var(--ink-500)] mb-3">
            Revenue by month
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={buildYearChart(months)}
                margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  interval={0}
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                  tickFormatter={(v) =>
                    `₾${(Number(v) / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}k`
                  }
                />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.03)" }}
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #f3f4f6",
                    borderRadius: "8px",
                    fontSize: "12px",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                  }}
                  formatter={(value, name) => [fmt(Number(value)), name]}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="Collected" stackId="a" fill={COLLECTED_COLOR} />
                <Bar
                  dataKey="Outstanding"
                  stackId="a"
                  fill={OUTSTANDING_COLOR}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Monthly summary (no project detail) */}
      {months.length > 0 && (
        <div>
          <div className="text-[11px] uppercase tracking-wider text-[var(--ink-500)] mb-2 px-1">
            By month
          </div>
          <div className={`${CARD} overflow-x-auto p-0`}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--allone-line)] text-left">
                  <th className={TH}>Month</th>
                  <th className={`${TH} text-right`}>Revenue</th>
                  <th className={`${TH} text-right`}>Collected</th>
                  <th className={`${TH} text-right`}>Outstanding</th>
                </tr>
              </thead>
              <tbody>
                {months.map((m) => (
                  <tr
                    key={m.key}
                    className="border-b border-[var(--allone-line-soft)] last:border-0 hover:bg-[var(--bg-surface-alt)]"
                  >
                    <td className="px-4 py-2.5 font-medium text-[var(--ink-900)]">
                      {m.label}
                    </td>
                    <td className="px-4 py-2.5 text-right text-[var(--ink-700)]">
                      {fmt(m.revenue)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-emerald-600">
                      {fmt(m.collected)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-amber-600">
                      {fmt(m.outstanding)}
                    </td>
                  </tr>
                ))}
              </tbody>
              {totals && (
                <tfoot>
                  <tr className="border-t-2 border-[var(--allone-line)] font-semibold text-[var(--ink-900)]">
                    <td className="px-4 py-2.5">Total</td>
                    <td className="px-4 py-2.5 text-right">{fmt(totals.revenue)}</td>
                    <td className="px-4 py-2.5 text-right text-emerald-600">
                      {fmt(totals.collected)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-amber-600">
                      {fmt(totals.outstanding)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {months.length === 0 ? (
        <div className={`${CARD} text-center text-sm text-[var(--ink-500)] py-12`}>
          No closed deals yet.
        </div>
      ) : (
        months.map((m) => (
          <div key={m.key} className="space-y-2">
            {/* Month header */}
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-1">
              <h2 className="text-base font-semibold text-[var(--ink-900)]">
                {m.label}
              </h2>
              <div className="text-sm text-[var(--ink-500)]">
                <span className="font-medium text-[var(--ink-900)]">
                  {fmt(m.revenue)}
                </span>
                {" · collected "}
                <span className="text-emerald-600">{fmt(m.collected)}</span>
                {" · outstanding "}
                <span className="text-amber-600">{fmt(m.outstanding)}</span>
              </div>
            </div>

            {/* Deals */}
            <div className={`${CARD} overflow-x-auto p-0`}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--allone-line)] text-left">
                    <th className={TH}>Project</th>
                    <th className={`hidden sm:table-cell ${TH}`}>Rep</th>
                    <th className={`${TH} text-right`}>Value</th>
                    <th className={`${TH} text-right`}>Collected</th>
                    <th className={`${TH} text-right`}>Outstanding</th>
                  </tr>
                </thead>
                <tbody>
                  {m.deals.map((d) => (
                    <tr
                      key={d.leadId}
                      className="border-b border-[var(--allone-line-soft)] last:border-0 hover:bg-[var(--bg-surface-alt)]"
                    >
                      <td className="px-4 py-2.5">
                        <Link
                          href={`/admin/leads/${d.leadId}`}
                          className="font-medium text-[var(--ink-900)] hover:text-[var(--ao-accent)]"
                        >
                          {d.company || d.name || "Lead"}
                        </Link>
                      </td>
                      <td className="hidden sm:table-cell px-4 py-2.5 text-[var(--ink-700)]">
                        {d.repName || "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right text-[var(--ink-700)]">
                        {fmt(d.value)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-emerald-600">
                        {fmt(d.collected)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-amber-600">
                        {fmt(d.outstanding)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
