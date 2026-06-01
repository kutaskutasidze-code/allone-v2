"use client";

import { useEffect, useState } from "react";
import { Sparkles, Target, Calendar, CalendarRange } from "lucide-react";
import type { AimResult } from "@/lib/sales-aims";
import { metricLabel, metricFormat } from "@/lib/sales-aims";

type Period = "day" | "week" | "month";

interface AimsBoardResponse {
  success?: boolean;
  data?: { day: AimResult[]; week: AimResult[]; month: AimResult[] };
  error?: string;
}

const TABS: Array<{ key: Period; label: string; Icon: typeof Calendar }> = [
  { key: "day", label: "Today", Icon: Calendar },
  { key: "week", label: "This week", Icon: CalendarRange },
  { key: "month", label: "This month", Icon: Target },
];

export function AimsBoard() {
  const [tab, setTab] = useState<Period>("day");
  const [data, setData] = useState<AimsBoardResponse["data"]>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/sales/aims");
        const json = (await res.json()) as AimsBoardResponse;
        if (cancelled) return;
        if (!res.ok || !json.success) {
          setError(json.error ?? "Failed to load aims");
          return;
        }
        setData(json.data);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const current = data?.[tab] ?? [];

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--allone-line)] bg-[var(--bg-surface)] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-amber-50 text-amber-600">
            <Sparkles className="h-4 w-4" />
          </div>
          <h2 className="text-sm font-semibold text-[var(--ink-900)]">
            Aims & results
          </h2>
        </div>
        <div className="flex items-center gap-1 rounded-[var(--radius-sm)] bg-[var(--bg-surface-alt)] p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 rounded-[var(--radius-xs)] px-3 py-1 text-xs font-medium transition ${
                tab === t.key
                  ? "bg-[var(--bg-surface)] text-[var(--ink-900)] shadow-[var(--shadow-xs)]"
                  : "text-[var(--ink-500)] hover:text-[var(--ink-900)]"
              }`}
            >
              <t.Icon className="h-3 w-3" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-[var(--radius-xs)] border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {current.length === 0 ? (
        <p className="py-6 text-center text-sm text-[var(--ink-500)]">
          Computing aims… (need a few days of activity to baseline.)
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {current.map((a) => (
            <AimCard key={a.metric} aim={a} />
          ))}
        </div>
      )}
    </div>
  );
}

function AimCard({ aim }: { aim: AimResult }) {
  const label = metricLabel(aim.metric);
  const aimVal = metricFormat(aim.metric, aim.aim);
  const actualVal = metricFormat(aim.metric, aim.actual);
  const pct = aim.progress_pct;
  const tone = pct >= 100 ? "emerald" : pct >= 60 ? "sky" : "amber";
  const ringClass =
    tone === "emerald"
      ? "bg-emerald-500"
      : tone === "sky"
        ? "bg-sky-500"
        : "bg-amber-500";

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--bg-sunken)] p-3">
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-medium text-[var(--gray-600)]">{label}</p>
        <p className="text-xs font-mono text-[var(--ink-500)]">{pct}%</p>
      </div>
      <p className="mt-1 text-xl font-semibold text-[var(--ink-900)]">
        {actualVal}
        <span className="ml-1 text-sm font-normal text-[var(--ink-500)]">
          / {aimVal}
        </span>
      </p>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-sunken)]">
        <div
          className={`h-full transition-all duration-500 ${ringClass}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <p className="mt-1 text-[10px] text-[var(--gray-400)]">
        baseline {metricFormat(aim.metric, aim.baseline)} · +{aim.growth_pct}%
      </p>
    </div>
  );
}
