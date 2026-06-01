"use client";

import { useState } from "react";
import { Loader2, Send, Power, ExternalLink, CheckCircle2 } from "lucide-react";

interface TelegramConnectProps {
  initial?: { connected: boolean; username?: string | null };
}

export function TelegramConnect({ initial }: TelegramConnectProps) {
  const [connected, setConnected] = useState(initial?.connected ?? false);
  const [username, setUsername] = useState(initial?.username ?? null);
  const [busy, setBusy] = useState(false);
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startConnect = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/telegram/connect", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error ?? "Failed to start Telegram connect");
        return;
      }
      setDeepLink(json.data.url);
      window.open(json.data.url, "_blank", "noopener,noreferrer");
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    if (!confirm("Stop Telegram notifications?")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/telegram/disconnect", { method: "POST" });
      if (res.ok) {
        setConnected(false);
        setUsername(null);
        setDeepLink(null);
      }
    } finally {
      setBusy(false);
    }
  };

  const sendPreview = async (kind: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/sales/notifications/preview?kind=${encodeURIComponent(kind)}`,
        { method: "POST" },
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error ?? "Preview send failed");
        return;
      }
      if (json.delivered > 0) {
        setError(null);
        alert("Sent — check your Telegram.");
      } else {
        const firstErr = json.errors?.[0]?.error ?? "no active channel";
        setError(`Not delivered: ${firstErr}`);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--allone-line)] bg-[var(--bg-surface)] p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
            <Send className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--ink-900)]">
              Telegram
            </h2>
            <p className="mt-0.5 text-xs text-[var(--ink-500)]">
              Daily aim, EOD report, weekly + monthly summaries straight to your
              chat.
            </p>
          </div>
        </div>
        <div>
          {connected ? (
            <button
              type="button"
              onClick={disconnect}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--allone-line)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--ink-700)] hover:bg-[var(--bg-surface-alt)] disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Power className="h-3.5 w-3.5" />
              )}
              Disconnect
            </button>
          ) : (
            <button
              type="button"
              onClick={startConnect}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-600 disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Connect Telegram
            </button>
          )}
        </div>
      </div>

      {connected && (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="h-3 w-3" />
              {username ? `@${username}` : "Connected"}
            </span>
            <button
              type="button"
              onClick={() => sendPreview("daily_aim")}
              disabled={busy}
              className="rounded-full border border-[var(--allone-line)] px-2.5 py-1 text-[11px] font-medium text-[var(--ink-700)] hover:bg-[var(--bg-surface-alt)] disabled:opacity-50"
            >
              Preview daily aim
            </button>
            <button
              type="button"
              onClick={() => sendPreview("daily_report")}
              disabled={busy}
              className="rounded-full border border-[var(--allone-line)] px-2.5 py-1 text-[11px] font-medium text-[var(--ink-700)] hover:bg-[var(--bg-surface-alt)] disabled:opacity-50"
            >
              Preview EOD report
            </button>
            <button
              type="button"
              onClick={() => sendPreview("weekly_report")}
              disabled={busy}
              className="rounded-full border border-[var(--allone-line)] px-2.5 py-1 text-[11px] font-medium text-[var(--ink-700)] hover:bg-[var(--bg-surface-alt)] disabled:opacity-50"
            >
              Preview weekly report
            </button>
          </div>
        </>
      )}

      {deepLink && !connected && (
        <p className="mt-3 text-xs text-[var(--ink-500)]">
          Telegram should have opened.{" "}
          <a
            href={deepLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sky-600 hover:underline"
          >
            Tap Start on the bot <ExternalLink className="h-3 w-3" />
          </a>{" "}
          to finish. Link is valid for 15 minutes.
        </p>
      )}

      {error && (
        <p className="mt-3 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
