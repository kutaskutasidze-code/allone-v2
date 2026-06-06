"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Row {
  leadId: string;
  name: string | null;
  company: string | null;
  repName: string | null;
  value: number;
  paid: number;
  owed: number;
  overdueAmount: number;
  nextDue: string | null;
}
interface Totals {
  outstanding: number;
  overdue: number;
  collected: number;
  count: number;
}

const fmt = (n: number) =>
  `₾${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const fmtDate = (iso: string) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const CARD =
  "bg-[var(--bg-surface)] border border-[var(--allone-line-soft)] rounded-[var(--radius-md)] shadow-[var(--shadow-xs)] shadow-black/[0.02] p-4";

export default function ReceivablesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/admin/receivables")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed"))))
      .then((json) => {
        if (active) {
          setRows(json.data?.rows || []);
          setTotals(json.data?.totals || null);
        }
      })
      .catch(() => {
        if (active) setError("Failed to load receivables");
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
        Loading receivables...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-[var(--ink-900)] font-display">
          Receivables
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-500)]">
          Outstanding balances across won deals — who owes what.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-[var(--radius-sm)] text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          ["Outstanding", totals?.outstanding ?? 0, "text-amber-600"],
          ["Overdue", totals?.overdue ?? 0, "text-red-500"],
          ["Collected", totals?.collected ?? 0, "text-emerald-600"],
        ].map(([label, val, cls]) => (
          <div key={label as string} className={CARD}>
            <div className="text-[11px] uppercase tracking-wider text-[var(--ink-500)]">
              {label}
            </div>
            <div className={`mt-1 text-2xl font-semibold ${cls}`}>
              {fmt(val as number)}
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <div className={`${CARD} text-center text-sm text-[var(--ink-500)] py-12`}>
          No outstanding balances. Every won deal is paid in full. 🎉
        </div>
      ) : (
        <div className={`${CARD} overflow-x-auto p-0`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--allone-line)] text-left">
                <th className="px-4 py-2.5 text-[11px] uppercase tracking-wider text-[var(--ink-500)] font-medium">
                  Client
                </th>
                <th className="px-4 py-2.5 text-[11px] uppercase tracking-wider text-[var(--ink-500)] font-medium">
                  Rep
                </th>
                <th className="px-4 py-2.5 text-right text-[11px] uppercase tracking-wider text-[var(--ink-500)] font-medium">
                  Value
                </th>
                <th className="px-4 py-2.5 text-right text-[11px] uppercase tracking-wider text-[var(--ink-500)] font-medium">
                  Paid
                </th>
                <th className="px-4 py-2.5 text-right text-[11px] uppercase tracking-wider text-[var(--ink-500)] font-medium">
                  Owed
                </th>
                <th className="px-4 py-2.5 text-[11px] uppercase tracking-wider text-[var(--ink-500)] font-medium">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const isOverdue = r.overdueAmount > 0;
                return (
                  <tr
                    key={r.leadId}
                    className="border-b border-[var(--allone-line-soft)] last:border-0 hover:bg-[var(--bg-surface-alt)]"
                  >
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/admin/leads/${r.leadId}`}
                        className="font-medium text-[var(--ink-900)] hover:text-[var(--ao-accent)]"
                      >
                        {r.company || r.name || "Lead"}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-[var(--ink-700)]">
                      {r.repName || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right text-[var(--ink-700)]">
                      {fmt(r.value)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-emerald-600">
                      {fmt(r.paid)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-[var(--ink-900)]">
                      {fmt(r.owed)}
                    </td>
                    <td className="px-4 py-2.5">
                      {isOverdue ? (
                        <span className="font-medium text-red-500">
                          Overdue {fmt(r.overdueAmount)}
                        </span>
                      ) : r.nextDue ? (
                        <span className="text-[var(--ink-500)]">
                          Due {fmtDate(r.nextDue)}
                        </span>
                      ) : (
                        <span className="text-[var(--ink-400)]">No schedule</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
