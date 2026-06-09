"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/useLocale";
import type { RealtimeStatus } from "@/lib/realtime";

/**
 * Connection status pill — listens for `tp.realtime.status` window events
 * dispatched by realtime-using pages, plus pings the supabase Realtime
 * client directly via a heartbeat channel so the pill shows green on
 * pages that don't subscribe to anything else.
 *
 * Visual states:
 *   connected     → green dot · "Live"
 *   reconnecting  → amber dot · "Reconnecting"
 *   offline       → red dot   · "Offline"
 *   connecting    → grey dot  · "Connecting" (first paint only)
 *
 * Hidden on `sm` breakpoint and smaller (`hidden sm:inline-flex`).
 */
export const REALTIME_STATUS_EVENT = "tp.realtime.status";

export function dispatchRealtimeStatus(status: RealtimeStatus) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(REALTIME_STATUS_EVENT, { detail: { status } }),
  );
}

export function RealtimeStatusPill() {
  const { t } = useLocale();
  const [status, setStatus] = useState<RealtimeStatus>("connecting");

  useEffect(() => {
    function onStatus(e: Event) {
      const detail = (e as CustomEvent<{ status: RealtimeStatus }>).detail;
      if (detail?.status) setStatus(detail.status);
    }
    window.addEventListener(REALTIME_STATUS_EVENT, onStatus);

    // Heartbeat channel — keeps the pill accurate on pages that don't
    // subscribe to any postgres_changes channel themselves. Uses Realtime's
    // "broadcast" type which is auth-free, so it always succeeds when the
    // websocket is reachable.
    let cleanup: (() => void) | null = null;
    (async () => {
      try {
        const { getRealtimeClient } = await import("@/lib/realtime");
        const sb = getRealtimeClient();
        if (!sb) {
          setStatus("offline");
          return;
        }
        const ch = sb.channel("rt-heartbeat").subscribe((s) => {
          if (s === "SUBSCRIBED") setStatus("connected");
          else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT")
            setStatus("reconnecting");
          else if (s === "CLOSED") setStatus("offline");
        });
        cleanup = () => {
          try {
            sb.removeChannel(ch);
          } catch {
            /* ignore */
          }
        };
      } catch {
        setStatus("offline");
      }
    })();

    return () => {
      window.removeEventListener(REALTIME_STATUS_EVENT, onStatus);
      if (cleanup) cleanup();
    };
  }, []);

  const meta =
    status === "connected"
      ? {
          dot: "bg-emerald-500",
          label: t("realtime.status.connected"),
        }
      : status === "reconnecting"
        ? {
            dot: "bg-amber-500 animate-pulse",
            label: t("realtime.status.reconnecting"),
          }
        : status === "offline"
          ? {
              dot: "bg-rose-500",
              label: t("realtime.status.offline"),
            }
          : {
              dot: "bg-[var(--ink-300)]",
              label: t("realtime.status.connecting"),
            };

  // Minimal pill — just the dot. Label moved to title/aria for screen
  // readers; visible text felt noisy in the topbar per operator feedback.
  return (
    <span
      className="hidden sm:inline-flex h-8 w-8 items-center justify-center"
      title={`${meta.label} — ${t("realtime.tooltip")}`}
      aria-label={`${meta.label} — ${t("realtime.tooltip")}`}
    >
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${meta.dot}`} />
    </span>
  );
}
