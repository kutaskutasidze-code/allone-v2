"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, X } from "lucide-react";
import { ForecastStrip } from "./ForecastStrip";
import { formatCurrency } from "@/lib/utils";
import { LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from "@/lib/validations/leads";
import {
  FUNNEL_PATH,
  SIDE_STAGES,
  type PipelineStageData,
} from "@/lib/forecasting";

export function PipelineSummary({ role }: { role: "sales" | "admin" }) {
  const apiBase = role === "admin" ? "/api/admin/pipeline" : "/api/sales/pipeline";
  const listBase = role === "admin" ? "/admin/leads" : "/sales/leads";

  const [stages, setStages] = useState<PipelineStageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(apiBase);
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      setStages(json.data?.stages || []);
    } catch {
      setError("Failed to load pipeline");
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    load();
  }, [load]);

  const byStatus = useMemo(
    () => new Map(stages.map((s) => [s.status, s])),
    [stages],
  );
  const maxCount = useMemo(
    () => Math.max(1, ...FUNNEL_PATH.map((s) => byStatus.get(s)?.count ?? 0)),
    [byStatus],
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--allone-line)] border-t-[var(--ink-900)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-red-100 bg-red-50 p-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError("")}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <ForecastStrip stages={stages} />

      {/* Conversion funnel */}
      <div className="rounded-[var(--radius-md)] border border-[var(--allone-line)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-xs)]">
        <h2 className="mb-4 text-sm font-semibold text-[var(--ink-900)]">
          Conversion funnel
        </h2>
        <div className="space-y-3">
          {FUNNEL_PATH.map((status, i) => {
            const s = byStatus.get(status);
            const count = s?.count ?? 0;
            const value = s?.totalValue ?? 0;
            const widthPct = Math.max(4, (count / maxCount) * 100);
            const prev = i > 0 ? byStatus.get(FUNNEL_PATH[i - 1]) : null;
            const conv =
              prev && prev.count > 0 ? (count / prev.count) * 100 : null;
            const accent = LEAD_STATUS_COLORS[status] || "#9ca3af";
            return (
              <Link
                key={status}
                href={`${listBase}?status=${status}`}
                className="group block"
              >
                <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                  <span className="font-medium text-[var(--ink-700)] group-hover:text-[var(--ink-900)]">
                    {LEAD_STATUS_LABELS[status]}
                  </span>
                  <span className="flex items-center gap-3 text-[var(--ink-500)]">
                    {conv !== null && (
                      <span className="tabular-nums text-[var(--ink-400)]">
                        {conv < 10 ? conv.toFixed(1) : Math.round(conv)}% of prev
                      </span>
                    )}
                    <span className="tabular-nums">{formatCurrency(value)}</span>
                    <span className="tabular-nums font-semibold text-[var(--ink-900)]">
                      {count.toLocaleString()}
                    </span>
                  </span>
                </div>
                <div className="h-7 w-full overflow-hidden rounded-[var(--radius-xs)] bg-[var(--bg-sunken)]">
                  <div
                    className="h-full rounded-[var(--radius-xs)] transition-all group-hover:opacity-90"
                    style={{ width: `${widthPct}%`, backgroundColor: accent }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] text-[var(--ink-400)]">
          Click a stage to open its leads.
        </p>
      </div>

      {/* Off-path stages */}
      <div className="grid gap-3 sm:grid-cols-2">
        {SIDE_STAGES.map((status) => {
          const s = byStatus.get(status);
          const count = s?.count ?? 0;
          const value = s?.totalValue ?? 0;
          const accent = LEAD_STATUS_COLORS[status] || "#9ca3af";
          return (
            <Link
              key={status}
              href={`${listBase}?status=${status}`}
              className="rounded-[var(--radius-md)] border border-[var(--allone-line)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-xs)] transition-colors hover:border-[var(--allone-line-strong)]"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: accent }}
                />
                <span className="text-sm font-medium text-[var(--ink-700)]">
                  {LEAD_STATUS_LABELS[status]}
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-semibold tabular-nums text-[var(--ink-900)]">
                  {count.toLocaleString()}
                </span>
                <span className="text-xs text-[var(--ink-400)]">
                  {formatCurrency(value)}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
