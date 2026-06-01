"use client";

import { useMemo, useState } from "react";
import { Loader2, RotateCcw, Save } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}
interface Override {
  sales_user_id: string;
  metric: string;
  growth_pct: number;
}

const METRICS = [
  { key: "leads_contacted", label: "Leads contacted", default: 15 },
  { key: "leads_qualified", label: "Leads qualified", default: 15 },
  { key: "leads_won_count", label: "Leads won (count)", default: 20 },
  { key: "leads_won_revenue", label: "Revenue won", default: 20 },
  { key: "demos_sent", label: "Demos sent", default: 15 },
  { key: "demos_engaged", label: "Demos engaged", default: 25 },
] as const;

export function AimOverridesContent({
  users: initialUsers,
  overrides: initialOverrides,
}: {
  users: User[];
  overrides: Override[];
}) {
  const [overrides, setOverrides] = useState<Override[]>(initialOverrides);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const byUser = useMemo(() => {
    const out: Record<string, Record<string, number>> = {};
    for (const o of overrides) {
      out[o.sales_user_id] ??= {};
      out[o.sales_user_id][o.metric] = o.growth_pct;
    }
    return out;
  }, [overrides]);

  const save = async (user_id: string, metric: string, growth_pct: number) => {
    const key = `${user_id}:${metric}`;
    setBusyKey(key);
    try {
      const res = await fetch("/api/sales/admin/aim-overrides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sales_user_id: user_id, metric, growth_pct }),
      });
      if (res.ok) {
        setOverrides((prev) => {
          const filtered = prev.filter(
            (o) => !(o.sales_user_id === user_id && o.metric === metric),
          );
          return [...filtered, { sales_user_id: user_id, metric, growth_pct }];
        });
      }
    } finally {
      setBusyKey(null);
    }
  };

  const reset = async (user_id: string, metric: string) => {
    const key = `${user_id}:${metric}`;
    setBusyKey(key);
    try {
      const res = await fetch(
        `/api/sales/admin/aim-overrides?sales_user_id=${user_id}&metric=${metric}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        setOverrides((prev) =>
          prev.filter(
            (o) => !(o.sales_user_id === user_id && o.metric === metric),
          ),
        );
      }
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div
      className="bf-island mx-auto max-w-6xl p-6"
      style={{ borderRadius: 20 }}
    >
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-[color:var(--ink-900)]">
          Aim growth overrides
        </h1>
        <p className="mt-1 text-sm text-[color:var(--ink-500)]">
          Tune the growth percentage per sales user × metric. When unset, aims
          use the per-metric default (15-25%).
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[color:var(--allone-line-soft)] text-left text-[11px] font-mono uppercase tracking-wider text-[color:var(--ink-500)]">
              <th className="px-3 py-2 font-medium">Sales user</th>
              {METRICS.map((m) => (
                <th key={m.key} className="px-3 py-2 font-medium">
                  {m.label}
                  <span className="ml-1 text-[10px] text-[color:var(--ink-400)]">
                    ({m.default}%)
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {initialUsers.map((u) => (
              <tr
                key={u.id}
                className="border-b border-[color:var(--allone-line-soft)]"
              >
                <td className="px-3 py-3">
                  <div className="font-medium text-[color:var(--ink-900)]">
                    {u.name}
                  </div>
                  <div className="text-[11px] text-[color:var(--ink-500)]">
                    {u.email} · {u.role}
                  </div>
                </td>
                {METRICS.map((m) => {
                  const key = `${u.id}:${m.key}`;
                  const current = byUser[u.id]?.[m.key];
                  return (
                    <td key={m.key} className="px-3 py-2">
                      <Cell
                        defaultPct={m.default}
                        currentPct={current}
                        busy={busyKey === key}
                        onSave={(p) => save(u.id, m.key, p)}
                        onReset={() => reset(u.id, m.key)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Cell({
  defaultPct,
  currentPct,
  busy,
  onSave,
  onReset,
}: {
  defaultPct: number;
  currentPct?: number;
  busy: boolean;
  onSave: (pct: number) => void;
  onReset: () => void;
}) {
  const [val, setVal] = useState<string>(
    currentPct !== undefined ? String(currentPct) : "",
  );
  const isOverridden = currentPct !== undefined;
  const parsed = parseInt(val, 10);
  const isValid = !Number.isNaN(parsed) && parsed >= -100 && parsed <= 500;

  return (
    <div className="inline-flex items-center gap-1">
      <input
        type="number"
        min={-100}
        max={500}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder={String(defaultPct)}
        className={`w-14 rounded-[var(--radius-xs)] border px-1.5 py-1 text-sm focus:outline-none ${
          isOverridden
            ? "border-[color:var(--ao-accent)] bg-[color:var(--ao-accent-soft)] text-[color:var(--ao-accent)]"
            : "border-[color:var(--allone-line)] text-[color:var(--ink-700)]"
        }`}
      />
      <button
        type="button"
        onClick={() => isValid && onSave(parsed)}
        disabled={busy || !isValid || (isOverridden && parsed === currentPct)}
        aria-label="Save override"
        className="rounded-[var(--radius-xs)] p-1 text-[color:var(--ink-500)] hover:bg-[color:var(--bg-sunken)] disabled:opacity-30"
      >
        {busy ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Save className="h-3 w-3" />
        )}
      </button>
      {isOverridden && (
        <button
          type="button"
          onClick={onReset}
          disabled={busy}
          aria-label="Reset to default"
          className="rounded-[var(--radius-xs)] p-1 text-[color:var(--ink-500)] hover:bg-[color:var(--bg-sunken)] disabled:opacity-30"
        >
          <RotateCcw className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
