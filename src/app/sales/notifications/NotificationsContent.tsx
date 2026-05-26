"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, AlertCircle, Send, Calendar } from "lucide-react";

interface Send {
  id: string;
  channel_type: string;
  message_type: string;
  period_key: string | null;
  sent_at: string;
  error: string | null;
  external_id: string | null;
}

const KIND_LABEL: Record<string, string> = {
  daily_aim: "Daily aim",
  daily_report: "Daily report",
  weekly_aim: "Weekly aim",
  weekly_report: "Weekly report",
  monthly_aim: "Monthly aim",
  monthly_report: "Monthly report",
  admin_rollup: "Admin rollup",
};

export function NotificationsContent({ sends }: { sends: Send[] }) {
  const [filter, setFilter] = useState<"all" | "failed" | "sent">("all");

  const filtered = useMemo(
    () =>
      sends.filter((s) => {
        if (filter === "failed") return Boolean(s.error);
        if (filter === "sent") return !s.error;
        return true;
      }),
    [sends, filter],
  );

  const counts = useMemo(() => {
    let failed = 0;
    let sent = 0;
    for (const s of sends) s.error ? failed++ : sent++;
    return { all: sends.length, sent, failed };
  }, [sends]);

  return (
    <div
      className="bf-island mx-auto max-w-4xl p-6"
      style={{ borderRadius: 20 }}
    >
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[color:var(--ink-900)]">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-[color:var(--ink-500)]">
            Every Telegram message we&apos;ve sent you, with delivery + error
            trail.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-[color:var(--bg-sunken)] p-1">
          {(["all", "sent", "failed"] as const).map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setFilter(b)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                filter === b
                  ? "bg-white text-[color:var(--ink-900)] shadow-sm"
                  : "text-[color:var(--ink-500)]"
              }`}
            >
              {b} ({counts[b]})
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[color:var(--allonce-line)] py-10 text-center text-sm text-[color:var(--ink-500)]">
          <Send className="mx-auto mb-2 h-5 w-5 text-[color:var(--ink-300)]" />
          No notifications yet for this filter.
        </div>
      ) : (
        <ul className="divide-y divide-[color:var(--allonce-line-soft)]">
          {filtered.map((s) => {
            const ok = !s.error;
            const Icon = ok ? CheckCircle2 : AlertCircle;
            return (
              <li key={s.id} className="flex items-start gap-3 py-3">
                <div
                  className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full ${
                    ok
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-medium text-[color:var(--ink-900)]">
                      {KIND_LABEL[s.message_type] ?? s.message_type}
                    </p>
                    <span className="font-mono text-[11px] text-[color:var(--ink-400)]">
                      {new Date(s.sent_at).toLocaleString("en-CA", {
                        timeZone: "Asia/Tbilisi",
                      })}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-[color:var(--ink-500)]">
                    <span className="rounded bg-[color:var(--bg-sunken)] px-1.5 py-0.5 font-mono">
                      {s.channel_type}
                    </span>
                    {s.period_key && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {s.period_key}
                      </span>
                    )}
                  </div>
                  {s.error && (
                    <p className="mt-1.5 rounded-md bg-red-50 px-2 py-1 text-xs text-red-700">
                      {s.error}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
