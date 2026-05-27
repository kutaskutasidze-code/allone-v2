"use client";

// Adapted from travelplace-bf's RealtimeStatusPill. Same UX (dot in the
// topbar reflecting Supabase Realtime websocket state) but reads our
// supabase client + drops the i18n strings (uses plain English here).

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type RealtimeStatus = "connecting" | "connected" | "reconnecting" | "offline";

export const REALTIME_STATUS_EVENT = "ao.realtime.status";

export function dispatchRealtimeStatus(status: RealtimeStatus) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(REALTIME_STATUS_EVENT, { detail: { status } }),
  );
}

export function RealtimeStatusPill() {
  const [status, setStatus] = useState<RealtimeStatus>("connecting");

  useEffect(() => {
    function onStatus(e: Event) {
      const detail = (e as CustomEvent<{ status: RealtimeStatus }>).detail;
      if (detail?.status) setStatus(detail.status);
    }
    window.addEventListener(REALTIME_STATUS_EVENT, onStatus);

    // Heartbeat channel — keeps the pill accurate on pages that don't
    // subscribe to any postgres_changes themselves. Broadcast type is
    // auth-free, so any reachable websocket reports as connected.
    let cleanup: (() => void) | null = null;
    try {
      const sb = createClient();
      const ch = sb.channel("ao-rt-heartbeat").subscribe((s) => {
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

    return () => {
      window.removeEventListener(REALTIME_STATUS_EVENT, onStatus);
      if (cleanup) cleanup();
    };
  }, []);

  const meta =
    status === "connected"
      ? { dot: "bg-emerald-500", label: "Live" }
      : status === "reconnecting"
        ? { dot: "bg-amber-500 animate-pulse", label: "Reconnecting" }
        : status === "offline"
          ? { dot: "bg-rose-500", label: "Offline" }
          : { dot: "bg-[var(--ink-300)]", label: "Connecting" };

  return (
    <span
      className="hidden sm:inline-flex h-8 w-8 items-center justify-center"
      title={`${meta.label} — realtime status`}
      aria-label={`${meta.label} — realtime status`}
    >
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${meta.dot}`} />
    </span>
  );
}
