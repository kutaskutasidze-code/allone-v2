"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw, Sparkles, AlertCircle } from "lucide-react";
import { DemoPanel } from "./DemoPanel";
import { AuditPanel } from "./AuditPanel";
import { DraftPanel } from "./DraftPanel";
import { LeadContextPanel } from "./LeadContextPanel";

type DemoStatus =
  | "queued"
  | "enriching"
  | "skinning"
  | "wiring_admin"
  | "deploying"
  | "auditing"
  | "drafting"
  | "draft_ready"
  | "sent"
  | "expired"
  | "deleted"
  | "failed";

const TERMINAL: DemoStatus[] = [
  "draft_ready",
  "sent",
  "expired",
  "deleted",
  "failed",
];
const IN_PROGRESS: DemoStatus[] = [
  "queued",
  "enriching",
  "skinning",
  "wiring_admin",
  "deploying",
  "auditing",
  "drafting",
];

const PHASE_LABEL: Record<string, string> = {
  queued: "Queued",
  enriching: "Enriching company data",
  skinning: "Skinning the reference",
  wiring_admin: "Wiring admin shell",
  deploying: "Deploying to Vercel",
  auditing: "Auditing existing site",
  drafting: "Drafting email",
};

interface DemoJob {
  id: string;
  status: DemoStatus;
  current_phase: string | null;
  progress: number;
  demo_url: string | null;
  audit_results: {
    scores?: { overall?: number };
    topIssues?: Array<{
      severity: string;
      category: string;
      headline: string;
      oneLineFix: string;
    }>;
  } | null;
  error_message: string | null;
  draft?: {
    id: string;
    subject: string;
    body_html: string;
  } | null;
}

interface Lead {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  source: string | null;
}

export function DemoSection({
  leadId,
  lead,
}: {
  leadId: string;
  lead: Lead | null;
}) {
  const [job, setJob] = useState<DemoJob | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLatest = useCallback(async () => {
    const res = await fetch(`/api/admin/demos?lead_id=${leadId}`);
    if (!res.ok) return;
    const json = await res.json();
    const latest: DemoJob | undefined = json.data?.[0];
    if (!latest) return;
    if (latest.id) {
      const detail = await fetch(`/api/admin/demos/${latest.id}`).then((r) =>
        r.json(),
      );
      if (detail?.data) setJob(detail.data);
    }
  }, [leadId]);

  useEffect(() => {
    fetchLatest();
  }, [fetchLatest]);

  // Poll while in-progress
  useEffect(() => {
    if (!job || !IN_PROGRESS.includes(job.status)) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }
    pollRef.current = setInterval(fetchLatest, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [job, fetchLatest]);

  const startDemo = async () => {
    setIsStarting(true);
    try {
      const res = await fetch("/api/admin/demos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: leadId }),
      });
      if (res.ok) await fetchLatest();
    } finally {
      setIsStarting(false);
    }
  };

  const retryDemo = async () => {
    if (!job) return;
    setIsRetrying(true);
    try {
      const res = await fetch(`/api/admin/demos/${job.id}/retry`, {
        method: "POST",
      });
      if (res.ok) await fetchLatest();
    } finally {
      setIsRetrying(false);
    }
  };

  if (!job) {
    return (
      <div className="mb-8 rounded-2xl border border-[var(--allone-line)] bg-[var(--bg-surface)] p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display text-xl text-[var(--ink-900)]">
              Personalized demo
            </h3>
            <p className="mt-1 text-sm text-[var(--ink-500)]">
              Generate a working demo branded for{" "}
              {lead?.company || lead?.name || "this lead"} — clone, skin,
              deploy, audit, drafted email. Takes about 3-5 minutes.
            </p>
          </div>
          <button
            type="button"
            onClick={startDemo}
            disabled={isStarting}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--ao-accent)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--ao-accent-hover)] disabled:opacity-50"
          >
            {isStarting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generate demo
          </button>
        </div>
      </div>
    );
  }

  if (IN_PROGRESS.includes(job.status)) {
    return (
      <div className="mb-8 rounded-2xl border border-[var(--allone-line)] bg-[var(--bg-surface)] p-6">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--ao-accent)]" />
          <div className="flex-1">
            <div className="flex items-baseline justify-between">
              <p className="font-medium text-[var(--ink-900)]">
                {PHASE_LABEL[job.current_phase ?? job.status] ?? job.status}
              </p>
              <span className="text-sm text-[var(--ink-500)]">
                {job.progress}%
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-sunken)]">
              <div
                className="h-full bg-[var(--ao-accent)] transition-all duration-500"
                style={{ width: `${Math.max(5, job.progress)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (job.status === "failed") {
    return (
      <div className="mb-8 rounded-2xl border border-red-100 bg-red-50/50 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
          <div className="flex-1">
            <p className="font-medium text-red-900">Demo pipeline failed</p>
            <p className="mt-1 text-sm text-red-800">
              {job.error_message || "Unknown error"} — phase:{" "}
              {job.current_phase ?? "—"}
            </p>
            <button
              type="button"
              onClick={retryDemo}
              disabled={isRetrying}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-300 bg-[var(--bg-surface)] px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
            >
              {isRetrying ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // draft_ready, sent, expired, deleted — show the 4-panel review.
  // For sent/expired/deleted we still show the panels but with the action bar
  // adjusted (handled inside DraftPanel).
  return (
    <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
      <DemoPanel
        demoUrl={job.demo_url}
        status={job.status}
        onRegenerate={retryDemo}
        isRegenerating={isRetrying}
      />
      <AuditPanel audit={job.audit_results} />
      <DraftPanel
        draft={job.draft ?? null}
        jobId={job.id}
        status={job.status}
      />
      <LeadContextPanel lead={lead} />
    </div>
  );
}
