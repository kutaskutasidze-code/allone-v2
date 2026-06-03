"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  AlertCircle,
  Phone,
  PhoneCall,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { CALL_OUTCOME_LABELS } from "@/lib/validations/activity";

const PERIODS = [
  { value: "month", label: "This Month" },
  { value: "last-month", label: "Last Month" },
  { value: "quarter", label: "This Quarter" },
  { value: "all", label: "All Time" },
];

const OUTCOME_ORDER = [
  "connected",
  "no_answer",
  "voicemail",
  "busy",
  "callback_requested",
  "not_interested",
  "wrong_number",
];

interface ActivityData {
  rep: {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    dailyTarget: number;
    industries: string[];
  };
  period: { start: string; end: string; label: string };
  calls: {
    total: number;
    today: number;
    connected: number;
    byOutcome: Record<string, number>;
  };
  tasks: {
    open: number;
    dueToday: number;
    overdue: number;
    completedInPeriod: number;
  };
  results: {
    wonCount: number;
    wonRevenue: number;
    conversionRate: number;
  };
}

function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--allone-line)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-xs)]">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
        {icon}
        {label}
      </div>
      <div>
        <div className="text-3xl font-semibold tracking-[-0.02em] text-[var(--ink-900)] tabular-nums">
          {value}
        </div>
        {sub && (
          <div className="mt-1.5 text-[11.5px] text-[var(--ink-400)]">{sub}</div>
        )}
      </div>
    </div>
  );
}

export default function RepActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [period, setPeriod] = useState("month");
  const [data, setData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/team/${id}/activity?period=${period}`);
      if (!res.ok) throw new Error("Failed to load");
      const json = await res.json();
      setData(json.data);
    } catch {
      setError("Failed to load rep activity");
    } finally {
      setLoading(false);
    }
  }, [id, period]);

  useEffect(() => {
    load();
  }, [load]);

  const connectRate =
    data && data.calls.total > 0
      ? Math.round((data.calls.connected / data.calls.total) * 100)
      : 0;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <div>
        <Link
          href="/admin/team"
          className="inline-flex items-center gap-2 text-sm text-[var(--ink-500)] hover:text-[var(--ink-900)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Team
        </Link>
        <div className="mt-4 flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-semibold tracking-[-0.022em] text-[var(--ink-900)] sm:text-2xl">
              {data ? data.rep.name : "Rep activity"}
            </h1>
            {data && (
              <p className="mt-1 text-[13px] text-[var(--ink-500)]">
                {data.rep.email} · {data.rep.role}
                {!data.rep.isActive && " · inactive"}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-[var(--radius-sm)] transition-all ${
              period === p.value
                ? "bg-[var(--ink-900)] text-white shadow-[var(--shadow-xs)]"
                : "bg-[var(--bg-surface)] border border-[var(--allone-line)] text-[var(--ink-700)] hover:border-[var(--allone-line-strong)]"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-[var(--radius-sm)] text-red-700 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span className="flex-1">{error}</span>
          <button onClick={load} className="text-xs text-red-700 underline">
            Retry
          </button>
        </div>
      )}

      {loading && !data ? (
        <div className="px-4 py-10 text-center text-xs text-[var(--ink-400)]">
          Loading…
        </div>
      ) : data ? (
        <>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            <StatCard
              label="Calls (period)"
              value={String(data.calls.total)}
              sub={`${data.calls.today} today`}
              icon={<Phone className="w-3.5 h-3.5" />}
            />
            <StatCard
              label="Connect rate"
              value={`${connectRate}%`}
              sub={`${data.calls.connected} connected`}
              icon={<PhoneCall className="w-3.5 h-3.5" />}
            />
            <StatCard
              label="Won"
              value={String(data.results.wonCount)}
              sub={`${formatCurrency(data.results.wonRevenue)} · ${(data.results.conversionRate * 100).toFixed(1)}% conv`}
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
            />
            <StatCard
              label="Tasks overdue"
              value={String(data.tasks.overdue)}
              sub={`${data.tasks.dueToday} due today · ${data.tasks.open} open`}
              icon={<Clock className="w-3.5 h-3.5" />}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-[var(--bg-surface)] border border-[var(--allone-line-soft)] rounded-[var(--radius-md)] shadow-[var(--shadow-xs)] overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--allone-line-soft)]">
                <h2 className="text-sm font-semibold text-[var(--ink-900)]">
                  Call outcomes
                </h2>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {OUTCOME_ORDER.map((o) => {
                    const count = data.calls.byOutcome[o] || 0;
                    const pct =
                      data.calls.total > 0
                        ? Math.round((count / data.calls.total) * 100)
                        : 0;
                    return (
                      <tr
                        key={o}
                        className="border-t border-[var(--allone-line-soft)] first:border-t-0"
                      >
                        <td className="px-5 py-2.5 text-[var(--ink-700)]">
                          {CALL_OUTCOME_LABELS[o] || o}
                        </td>
                        <td className="px-5 py-2.5 text-right tabular-nums text-[var(--ink-900)] font-medium">
                          {count}
                        </td>
                        <td className="px-5 py-2.5 text-right tabular-nums text-[var(--ink-400)] w-16">
                          {pct}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="bg-[var(--bg-surface)] border border-[var(--allone-line-soft)] rounded-[var(--radius-md)] shadow-[var(--shadow-xs)] overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--allone-line-soft)]">
                <h2 className="text-sm font-semibold text-[var(--ink-900)]">
                  Follow-up tasks
                </h2>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-t border-[var(--allone-line-soft)] first:border-t-0">
                    <td className="px-5 py-2.5 text-[var(--ink-700)]">
                      Overdue
                    </td>
                    <td className="px-5 py-2.5 text-right tabular-nums font-medium text-amber-600">
                      {data.tasks.overdue}
                    </td>
                  </tr>
                  <tr className="border-t border-[var(--allone-line-soft)]">
                    <td className="px-5 py-2.5 text-[var(--ink-700)]">
                      Due today
                    </td>
                    <td className="px-5 py-2.5 text-right tabular-nums font-medium text-[var(--ink-900)]">
                      {data.tasks.dueToday}
                    </td>
                  </tr>
                  <tr className="border-t border-[var(--allone-line-soft)]">
                    <td className="px-5 py-2.5 text-[var(--ink-700)]">
                      Open (total)
                    </td>
                    <td className="px-5 py-2.5 text-right tabular-nums text-[var(--ink-900)]">
                      {data.tasks.open}
                    </td>
                  </tr>
                  <tr className="border-t border-[var(--allone-line-soft)]">
                    <td className="px-5 py-2.5 text-[var(--ink-700)]">
                      Completed (period)
                    </td>
                    <td className="px-5 py-2.5 text-right tabular-nums text-[var(--ink-900)]">
                      {data.tasks.completedInPeriod}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
