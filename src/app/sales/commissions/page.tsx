"use client";

import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, Trophy, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface SalespersonRow {
  salesUserId: string | null;
  name: string;
  wonCount: number;
  wonValue: number;
  overrideEarned: number;
}

interface CommissionBreakdown {
  role: "salesperson" | "supervisor";
  period: { start: string; end: string; label: string };
  wonCount: number;
  wonValue: number;
  ownCommission: number;
  overrideCommission: number;
  totalCommission: number;
  perSalesperson?: SalespersonRow[];
}

const PERIODS = [
  { value: "month", label: "This month" },
  { value: "last-month", label: "Last month" },
  { value: "quarter", label: "This quarter" },
  { value: "all", label: "All time" },
] as const;

export default function CommissionsPage() {
  const [period, setPeriod] =
    useState<(typeof PERIODS)[number]["value"]>("month");
  const [data, setData] = useState<CommissionBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/sales/commissions?period=${period}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json() as Promise<CommissionBreakdown>;
      })
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message ?? "Failed to load commissions");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [period]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-[-0.022em] text-[var(--ink-900)] sm:text-2xl">
            Commissions
          </h1>
          <p className="mt-1 text-[13px] text-[var(--ink-500)]">
            Your earnings for closed-won deals, broken down by period.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-[var(--radius-sm)] transition ${
                period === p.value
                  ? "bg-[var(--ink-900)] text-white shadow-[var(--shadow-xs)]"
                  : "bg-[var(--bg-surface)] border border-[var(--allone-line)] text-[var(--ink-700)] hover:border-[var(--allone-line-strong)]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </header>

      {error && (
        <div className="rounded-[var(--radius-md)] border border-red-100 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading || !data ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-[var(--radius-md)] border border-[var(--allone-line)] bg-[var(--bg-surface)] animate-pulse"
            />
          ))}
        </div>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={<DollarSign className="h-4 w-4" strokeWidth={1.75} />}
              label="Total earned"
              value={formatCurrency(data.totalCommission)}
              tone="accent"
              hint={data.period.label}
            />
            <StatCard
              icon={<TrendingUp className="h-4 w-4" strokeWidth={1.75} />}
              label="Own commission"
              value={formatCurrency(data.ownCommission)}
              hint="From deals you closed"
            />
            {data.role === "supervisor" && (
              <StatCard
                icon={<Users className="h-4 w-4" strokeWidth={1.75} />}
                label="Team override"
                value={formatCurrency(data.overrideCommission)}
                hint="From reps you supervise"
              />
            )}
            <StatCard
              icon={<Trophy className="h-4 w-4" strokeWidth={1.75} />}
              label="Won deals"
              value={String(data.wonCount)}
              hint={`${formatCurrency(data.wonValue)} total value`}
            />
          </section>

          {data.role === "supervisor" &&
            data.perSalesperson &&
            data.perSalesperson.length > 0 && (
              <section>
                <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
                  Team breakdown
                </h2>
                <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--allone-line)] bg-[var(--bg-surface)] shadow-[var(--shadow-xs)]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--allone-line-soft)] text-left text-[11px] uppercase tracking-wider text-[var(--ink-500)]">
                        <th className="px-4 py-3 font-medium">Rep</th>
                        <th className="px-4 py-3 font-medium text-right">
                          Won
                        </th>
                        <th className="px-4 py-3 font-medium text-right">
                          Value
                        </th>
                        <th className="px-4 py-3 font-medium text-right">
                          Your override
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.perSalesperson.map((r) => (
                        <tr
                          key={r.salesUserId ?? r.name}
                          className="border-t border-[var(--allone-line-soft)] first:border-t-0 hover:bg-[var(--bg-surface-alt)]"
                        >
                          <td className="px-4 py-3 font-medium text-[var(--ink-900)]">
                            {r.name}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-[var(--ink-700)]">
                            {r.wonCount}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-[var(--ink-700)]">
                            {formatCurrency(r.wonValue)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums font-medium text-emerald-700">
                            {formatCurrency(r.overrideEarned)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
        </>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "accent";
}) {
  const toneClass =
    tone === "accent"
      ? "border-[var(--ao-accent-soft)] bg-[var(--ao-accent-soft)]/40"
      : "border-[var(--allone-line)] bg-[var(--bg-surface)]";
  return (
    <div
      className={`flex h-full flex-col gap-3 rounded-[var(--radius-md)] border ${toneClass} p-4 shadow-[var(--shadow-xs)] transition hover:shadow-[var(--shadow-sm)]`}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--bg-surface-alt)] text-[var(--ink-700)]">
        {icon}
      </div>
      <div>
        <div className="text-3xl font-semibold tracking-[-0.02em] text-[var(--ink-900)] tabular-nums">
          {value}
        </div>
        <div className="text-[12px] text-[var(--ink-500)]">{label}</div>
        {hint && (
          <div className="mt-1.5 text-[11.5px] text-[var(--ink-400)]">
            {hint}
          </div>
        )}
      </div>
    </div>
  );
}
