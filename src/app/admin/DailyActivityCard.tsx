"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Activity, ArrowRight, Check, PhoneCall } from "lucide-react";
import {
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  LEAD_STATUS_COLORS,
} from "@/lib/validations/leads";

type Range = "today" | "week" | "month" | "all";
const RANGES: { value: Range; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "all", label: "All time" },
];

interface RepActivity {
  id: string;
  name: string;
  email: string;
  role?: string;
  dailyTarget: number;
  assigned: number;
  called: number;
  callbacks: number;
  byStatus: Record<string, number>;
}

function TargetCell({
  rep,
  onSaved,
}: {
  rep: RepActivity;
  onSaved: (target: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(rep.dailyTarget));
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const save = async () => {
    const n = parseInt(value, 10);
    if (isNaN(n) || n < 0 || n > 10000 || n === rep.dailyTarget) {
      setValue(String(rep.dailyTarget));
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/sales-users/${rep.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ daily_target: n }),
      });
      if (res.ok) onSaved(n);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        min={0}
        max={10000}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") {
            setValue(String(rep.dailyTarget));
            setEditing(false);
          }
        }}
        disabled={saving}
        className="w-16 px-2 py-0.5 text-right text-sm rounded border border-gray-300 focus:border-gray-900 focus:outline-none"
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="px-2 py-0.5 rounded hover:bg-gray-100 text-gray-500 transition-colors tabular-nums"
      title="Click to edit daily target"
    >
      {rep.dailyTarget}
    </button>
  );
}

interface ApiResponse {
  data: {
    range: Range;
    reps: RepActivity[];
    totals: { assigned: number; called: number; callbacks: number };
  };
}

export function DailyActivityCard() {
  const [data, setData] = useState<ApiResponse["data"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [range, setRange] = useState<Range>("today");

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    fetch(`/api/admin/leads/daily-activity?range=${range}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((json: ApiResponse) => {
        if (active) setData(json.data);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [range]);

  const callStatuses = LEAD_STATUSES.filter((s) => s.value !== "new");
  const showsAllTime = range === "all";

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm shadow-black/[0.02] overflow-hidden">
      <div className="flex items-center justify-between gap-3 flex-wrap px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900">Call activity</h2>
        </div>
        <div className="flex items-center gap-1 rounded-md bg-gray-50 p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                range === r.value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <Link
          href="/admin/leads/assign"
          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors"
        >
          Assign more
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-[11px] text-gray-500 uppercase tracking-wider">
              <th className="text-left px-5 py-2.5 font-medium">Rep</th>
              <th className="text-right px-3 py-2.5 font-medium">Target</th>
              <th className="text-right px-3 py-2.5 font-medium">
                {showsAllTime ? "Assigned (lifetime)" : "Assigned"}
              </th>
              <th className="text-right px-3 py-2.5 font-medium">
                {showsAllTime ? "Touched" : "Called"}
              </th>
              <th
                className="text-right px-3 py-2.5 font-medium"
                title="Callbacks scheduled for today"
              >
                <span className="inline-flex items-center gap-1.5">
                  <PhoneCall className="w-3 h-3 text-amber-500" />
                  <span className="hidden md:inline">Callbacks</span>
                </span>
              </th>
              {callStatuses.map((s) => (
                <th
                  key={s.value}
                  className="text-right px-3 py-2.5 font-medium"
                  title={LEAD_STATUS_LABELS[s.value]}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-sm"
                      style={{ backgroundColor: LEAD_STATUS_COLORS[s.value] }}
                    />
                    <span className="hidden md:inline">{s.label}</span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={4 + callStatuses.length + 1}
                  className="px-5 py-8 text-center text-xs text-gray-400"
                >
                  Loading…
                </td>
              </tr>
            ) : !data || data.reps.length === 0 ? (
              <tr>
                <td
                  colSpan={4 + callStatuses.length + 1}
                  className="px-5 py-8 text-center text-xs text-gray-400"
                >
                  No sales reps configured yet.
                </td>
              </tr>
            ) : (
              data.reps.map((rep) => {
                const onTarget =
                  !showsAllTime &&
                  rep.called >= rep.dailyTarget &&
                  rep.dailyTarget > 0;
                return (
                  <tr key={rep.id} className="border-t border-gray-50">
                    <td className="px-5 py-3">
                      <span className="font-medium text-gray-900">
                        {rep.name}
                      </span>
                      {rep.role === "supervisor" && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">
                          supervisor
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <TargetCell
                        rep={rep}
                        onSaved={(target) =>
                          setData((d) =>
                            d
                              ? {
                                  ...d,
                                  reps: d.reps.map((r) =>
                                    r.id === rep.id
                                      ? { ...r, dailyTarget: target }
                                      : r,
                                  ),
                                }
                              : d,
                          )
                        }
                      />
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-gray-700">
                      {rep.assigned}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      <span
                        className={`font-semibold inline-flex items-center gap-1 ${onTarget ? "text-emerald-600" : "text-gray-900"}`}
                      >
                        {onTarget && <Check className="w-3.5 h-3.5" />}
                        {rep.called}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      <span
                        className={
                          rep.callbacks > 0
                            ? "text-amber-600 font-medium"
                            : "text-gray-400"
                        }
                      >
                        {rep.callbacks}
                      </span>
                    </td>
                    {callStatuses.map((s) => (
                      <td
                        key={s.value}
                        className="px-3 py-3 text-right tabular-nums text-gray-500"
                      >
                        {rep.byStatus[s.value] || 0}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
