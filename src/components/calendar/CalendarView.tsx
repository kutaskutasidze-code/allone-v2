"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Calendar as CalendarIcon,
  AlertCircle,
} from "lucide-react";
import type { CalendarEvent } from "@/lib/calendar";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

const firstOfThisMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

export function CalendarView({ role }: { role: "sales" | "admin" }) {
  const apiBase = role === "admin" ? "/api/admin/calendar" : "/api/sales/calendar";
  const detailBase = role === "admin" ? "/admin/leads" : "/sales/leads";

  const [cursor, setCursor] = useState(firstOfThisMonth);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 6-week (42-cell) grid covering the cursor month, starting Sunday.
  const grid = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const start = grid[0];
    const end = new Date(grid[41]);
    end.setDate(end.getDate() + 1); // exclusive
    try {
      const res = await fetch(
        `${apiBase}?start=${start.toISOString()}&end=${end.toISOString()}`,
      );
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      setEvents(json.data?.events || []);
    } catch {
      setError("Failed to load calendar");
    } finally {
      setLoading(false);
    }
  }, [apiBase, grid]);

  useEffect(() => {
    load();
  }, [load]);

  const byDay = useMemo(() => {
    const m = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const k = dayKey(new Date(e.at));
      const arr = m.get(k);
      if (arr) arr.push(e);
      else m.set(k, [e]);
    }
    return m;
  }, [events]);

  const monthLabel = cursor.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const todayKey = dayKey(new Date());
  const shiftMonth = (delta: number) =>
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));

  const navBtn =
    "flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--allone-line)] text-[var(--ink-700)] hover:bg-[var(--bg-surface-alt)] transition-colors";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => shiftMonth(-1)} className={navBtn} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[150px] text-center text-sm font-semibold text-[var(--ink-900)]">
            {monthLabel}
          </span>
          <button onClick={() => shiftMonth(1)} className={navBtn} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCursor(firstOfThisMonth())}
            className="rounded-[var(--radius-sm)] border border-[var(--allone-line)] px-3 py-1.5 text-xs font-medium text-[var(--ink-700)] hover:bg-[var(--bg-surface-alt)] transition-colors"
          >
            Today
          </button>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[var(--ink-500)]">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> Follow-up
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-purple-500" /> Meeting
          </span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-red-100 bg-red-50 p-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
        </div>
      )}

      <div
        className={`overflow-hidden rounded-[var(--radius-md)] border border-[var(--allone-line)] bg-[var(--bg-surface)] transition-opacity ${
          loading ? "opacity-60" : ""
        }`}
      >
        <div className="grid grid-cols-7 border-b border-[var(--allone-line-soft)]">
          {WEEKDAYS.map((w) => (
            <div
              key={w}
              className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-500)]"
            >
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {grid.map((d, i) => {
            const k = dayKey(d);
            const dayEvents = byDay.get(k) || [];
            const inMonth = d.getMonth() === cursor.getMonth();
            const isToday = k === todayKey;
            return (
              <div
                key={k}
                className={`min-h-[100px] border-b border-[var(--allone-line-soft)] p-1.5 ${
                  i % 7 === 6 ? "" : "border-r"
                } ${inMonth ? "" : "bg-[var(--bg-sunken)]/40"}`}
              >
                <div
                  className={`mb-1 text-[11px] ${
                    isToday
                      ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--ink-900)] font-medium text-white"
                      : inMonth
                        ? "text-[var(--ink-700)]"
                        : "text-[var(--ink-400)]"
                  }`}
                >
                  {d.getDate()}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((e) => (
                    <Link
                      key={e.id}
                      href={`${detailBase}/${e.leadId}`}
                      title={`${e.title} — ${e.leadName || ""}`}
                      className={`flex items-center gap-1 truncate rounded px-1.5 py-0.5 text-[10.5px] transition-opacity hover:opacity-80 ${
                        e.type === "meeting"
                          ? "bg-purple-50 text-purple-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {e.type === "meeting" ? (
                        <CalendarIcon className="h-2.5 w-2.5 shrink-0" />
                      ) : (
                        <CheckSquare className="h-2.5 w-2.5 shrink-0" />
                      )}
                      <span className="truncate">{e.leadName || e.title}</span>
                    </Link>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="px-1.5 text-[10px] text-[var(--ink-400)]">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
