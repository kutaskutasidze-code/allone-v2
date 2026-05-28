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
    <div className="overflow-hidden rounded-2xl border border-[var(--gray-200)] bg-[var(--bg-surface)]">
      <div className="flex items-center justify-between border-b border-[var(--gray-200)] px-5 py-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--gray-500)]">
            Demo
          </p>
          <p className="text-sm font-medium text-[#071D2F]">
            {status === "sent" ? "Live (sent)" : status}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {demoUrl && (
            <a
              href={demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--gray-200)] px-3 py-1.5 text-xs font-medium text-[#071D2F] transition hover:bg-[var(--gray-50)]"
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
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--gray-200)] px-3 py-1.5 text-xs font-medium text-[#071D2F] transition hover:bg-[var(--gray-50)] disabled:opacity-50"
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
      <div className="relative bg-[var(--gray-50)]" style={{ height: 420 }}>
        {demoUrl ? (
          <iframe
            src={demoUrl}
            className="h-full w-full"
            sandbox="allow-scripts allow-same-origin"
            title="Demo preview"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[var(--gray-500)]">
            Demo URL not yet available
          </div>
        )}
      </div>
    </div>
  );
}
