"use client";

import { formatCurrency } from "@/lib/utils";
import { LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from "@/lib/validations/leads";
import {
  stageWeightedValue,
  weightedForecast,
  OPEN_STAGES,
  type PipelineStageData,
} from "@/lib/forecasting";

export function ForecastStrip({ stages }: { stages: PipelineStageData[] }) {
  const byStatus = new Map(stages.map((s) => [s.status, s]));
  const expected = weightedForecast(stages);
  const won = byStatus.get("won");

  return (
    <div className="flex flex-wrap items-stretch gap-3">
      <div className="rounded-[var(--radius-md)] border border-[var(--allone-line)] bg-[var(--bg-surface)] px-4 py-3 shadow-[var(--shadow-xs)]">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
          Expected to close
        </div>
        <div className="mt-1 text-2xl font-semibold tabular-nums text-[var(--ink-900)]">
          {formatCurrency(expected)}
        </div>
        <div className="mt-0.5 text-[11px] text-[var(--ink-400)]">
          weighted, open stages
        </div>
      </div>

      {won && (
        <div className="rounded-[var(--radius-md)] border border-[var(--allone-line)] bg-[var(--bg-surface)] px-4 py-3 shadow-[var(--shadow-xs)]">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
            Closed won
          </div>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-emerald-600">
            {formatCurrency(won.totalValue)}
          </div>
          <div className="mt-0.5 text-[11px] text-[var(--ink-400)]">
            {won.count} {won.count === 1 ? "deal" : "deals"}
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-wrap items-center gap-x-5 gap-y-1.5 rounded-[var(--radius-md)] border border-[var(--allone-line)] bg-[var(--bg-surface)] px-4 py-3 shadow-[var(--shadow-xs)]">
        {OPEN_STAGES.map((status) => {
          const s = byStatus.get(status);
          if (!s) return null;
          return (
            <div key={status} className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: LEAD_STATUS_COLORS[status] || "#9ca3af" }}
              />
              <span className="text-xs text-[var(--ink-500)]">
                {LEAD_STATUS_LABELS[status]}
              </span>
              <span className="text-xs font-medium tabular-nums text-[var(--ink-900)]">
                {formatCurrency(stageWeightedValue(s.status, s.totalValue))}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
