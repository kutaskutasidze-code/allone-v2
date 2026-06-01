"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  RefreshCw,
  Trash2,
  Loader2,
  ArrowRight,
} from "lucide-react";

export function DemoDetailActions({
  jobId,
  status,
  demoUrl,
  leadId,
}: {
  jobId: string;
  status: string;
  demoUrl: string | null;
  leadId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<null | "retry" | "teardown">(null);

  const retry = async () => {
    if (status !== "failed") return;
    setBusy("retry");
    try {
      await fetch(`/api/admin/demos/${jobId}/retry`, { method: "POST" });
    } finally {
      setBusy(null);
      router.refresh();
    }
  };

  const teardown = async () => {
    if (
      !confirm(
        "Tear down this demo? Vercel project + seed data will be deleted.",
      )
    )
      return;
    setBusy("teardown");
    try {
      await fetch(`/api/admin/demos/${jobId}/teardown`, { method: "POST" });
    } finally {
      setBusy(null);
      router.refresh();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={`/sales/leads/${leadId}`}
        className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--ink-900)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--ink-900)]"
      >
        Review draft on lead page
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
      {demoUrl && (
        <a
          href={demoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--allone-line)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--ink-900)] hover:bg-[var(--bg-surface-alt)]"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open demo
        </a>
      )}
      {status === "failed" && (
        <button
          type="button"
          onClick={retry}
          disabled={busy !== null}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--allone-line)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--ink-900)] hover:bg-[var(--bg-surface-alt)] disabled:opacity-50"
        >
          {busy === "retry" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Retry pipeline
        </button>
      )}
      {!["deleted", "expired"].includes(status) && (
        <button
          type="button"
          onClick={teardown}
          disabled={busy !== null}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          {busy === "teardown" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
          Tear down
        </button>
      )}
    </div>
  );
}
