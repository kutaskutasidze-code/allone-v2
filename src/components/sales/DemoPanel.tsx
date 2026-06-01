"use client";

import { ExternalLink, RefreshCw, Loader2 } from "lucide-react";

interface DemoPanelProps {
  demoUrl: string | null;
  status: string;
  onRegenerate: () => void;
  isRegenerating: boolean;
}

export function DemoPanel({
  demoUrl,
  status,
  onRegenerate,
  isRegenerating,
}: DemoPanelProps) {
  const canRegenerate = ["draft_ready", "failed", "expired"].includes(status);

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--allone-line)] bg-[var(--bg-surface)]">
      <div className="flex items-center justify-between border-b border-[var(--allone-line)] px-5 py-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--ink-500)]">
            Demo
          </p>
          <p className="text-sm font-medium text-[var(--ink-900)]">
            {status === "sent" ? "Live (sent)" : status}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {demoUrl && (
            <a
              href={demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--allone-line)] px-3 py-1.5 text-xs font-medium text-[var(--ink-900)] transition hover:bg-[var(--bg-surface-alt)]"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open
            </a>
          )}
          {canRegenerate && (
            <button
              type="button"
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--allone-line)] px-3 py-1.5 text-xs font-medium text-[var(--ink-900)] transition hover:bg-[var(--bg-surface-alt)] disabled:opacity-50"
            >
              {isRegenerating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Regenerate
            </button>
          )}
        </div>
      </div>
      <div className="relative bg-[var(--bg-surface-alt)]" style={{ height: 420 }}>
        {demoUrl ? (
          <iframe
            src={demoUrl}
            className="h-full w-full"
            sandbox="allow-scripts allow-same-origin"
            title="Demo preview"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[var(--ink-500)]">
            Demo URL not yet available
          </div>
        )}
      </div>
    </div>
  );
}
