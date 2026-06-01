"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  ExternalLink,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";

interface Job {
  id: string;
  status: string;
  current_phase: string | null;
  progress: number;
  demo_url: string | null;
  audit_results: { scores?: { overall?: number } } | null;
  expires_at: string | null;
  engagement_count: number;
  created_at: string;
  lead_id: string;
  lead: { name: string; company: string | null; email: string | null } | null;
}

const STATUS_BUCKETS = [
  { value: "all", label: "All" },
  { value: "in_progress", label: "In progress" },
  { value: "draft_ready", label: "Ready to send" },
  { value: "sent", label: "Sent" },
  { value: "failed", label: "Failed" },
  { value: "expired", label: "Expired" },
] as const;

const IN_PROGRESS = new Set([
  "queued",
  "enriching",
  "skinning",
  "wiring_admin",
  "deploying",
  "auditing",
  "drafting",
]);

const STATUS_STYLE: Record<
  string,
  { bg: string; fg: string; Icon: typeof Clock }
> = {
  draft_ready: { bg: "bg-[var(--ao-accent-soft)]", fg: "text-[var(--ao-accent-hover)]", Icon: CheckCircle2 },
  sent: { bg: "bg-emerald-50", fg: "text-emerald-700", Icon: CheckCircle2 },
  failed: { bg: "bg-red-50", fg: "text-red-700", Icon: AlertCircle },
  expired: { bg: "bg-[var(--bg-sunken)]", fg: "text-slate-600", Icon: Clock },
  deleted: { bg: "bg-[var(--bg-sunken)]", fg: "text-[var(--ink-500)]", Icon: Clock },
};

const PHASE_LABEL: Record<string, string> = {
  queued: "Queued",
  enriching: "Enriching",
  skinning: "Skinning",
  wiring_admin: "Wiring admin",
  deploying: "Deploying",
  auditing: "Auditing",
  drafting: "Drafting",
};

export function DemosOverviewContent({
  jobs,
  errorMessage,
}: {
  jobs: Job[];
  errorMessage: string | null;
}) {
  const [search, setSearch] = useState("");
  const [bucket, setBucket] =
    useState<(typeof STATUS_BUCKETS)[number]["value"]>("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobs.filter((j) => {
      if (bucket === "in_progress" && !IN_PROGRESS.has(j.status)) return false;
      if (bucket !== "all" && bucket !== "in_progress" && j.status !== bucket)
        return false;
      if (!q) return true;
      return (
        j.lead?.name?.toLowerCase().includes(q) ||
        j.lead?.company?.toLowerCase().includes(q) ||
        j.lead?.email?.toLowerCase().includes(q)
      );
    });
  }, [jobs, search, bucket]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: jobs.length, in_progress: 0 };
    for (const j of jobs) {
      if (IN_PROGRESS.has(j.status)) c.in_progress = (c.in_progress ?? 0) + 1;
      c[j.status] = (c[j.status] ?? 0) + 1;
    }
    return c;
  }, [jobs]);

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--ink-900)]">
            Demos
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-500)]">
            Personalized demo pipelines across your leads.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link
            href="/sales/demos/references"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--allone-line)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--ink-700)] hover:bg-[var(--bg-surface-alt)]"
          >
            Reference library
          </Link>
          <span className="text-[var(--ink-500)]">
            {filtered.length} of {jobs.length}
          </span>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--gray-400)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search lead, company, email…"
            className="w-full rounded-lg border border-[var(--allone-line)] bg-[var(--bg-surface)] py-2 pl-9 pr-3 text-sm focus:border-[var(--ao-accent)] focus:outline-none"
          />
        </div>
        {STATUS_BUCKETS.map((b) => (
          <button
            key={b.value}
            type="button"
            onClick={() => setBucket(b.value)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              bucket === b.value
                ? "border-[var(--ao-accent)] bg-[var(--ao-accent)]/10 text-[var(--ao-accent)]"
                : "border-[var(--allone-line)] bg-[var(--bg-surface)] text-[var(--gray-600)] hover:bg-[var(--bg-surface-alt)]"
            }`}
          >
            {b.label}
            <span className="rounded-full bg-[var(--bg-sunken)] px-1.5 py-0.5 text-[10px] text-[var(--gray-600)]">
              {counts[b.value] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--allone-line)] bg-[var(--bg-surface)] p-12 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-[var(--gray-300)]" />
          <p className="mt-3 text-sm text-[var(--ink-500)]">
            No demo jobs match this filter.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--allone-line)] bg-[var(--bg-surface)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--allone-line)] text-left text-[11px] font-mono uppercase tracking-wider text-[var(--ink-500)]">
                <th className="px-5 py-3 font-medium">Lead</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Audit</th>
                <th className="px-5 py-3 font-medium">Engagement</th>
                <th className="px-5 py-3 font-medium">Created</th>
                <th className="px-5 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((j) => (
                <Row key={j.id} job={j} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Row({ job }: { job: Job }) {
  const inProgress = IN_PROGRESS.has(job.status);
  const style = STATUS_STYLE[job.status];
  const audit = job.audit_results?.scores?.overall;

  return (
    <tr className="border-b border-[var(--bg-sunken)] last:border-b-0">
      <td className="px-5 py-3">
        <Link
          href={`/sales/demos/${job.id}`}
          className="block transition hover:opacity-80"
        >
          <div className="font-medium text-[var(--ink-900)]">
            {job.lead?.name ?? "Unknown lead"}
          </div>
          <div className="text-xs text-[var(--ink-500)]">
            {job.lead?.company ?? job.lead?.email ?? "—"}
          </div>
        </Link>
      </td>
      <td className="px-5 py-3">
        {inProgress ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ao-accent-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--ao-accent-hover)]">
            <Loader2 className="h-3 w-3 animate-spin" />
            {PHASE_LABEL[job.current_phase ?? job.status] ?? job.status}
            <span className="text-[var(--ao-accent)]">· {job.progress}%</span>
          </span>
        ) : style ? (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.fg}`}
          >
            <style.Icon className="h-3 w-3" />
            {job.status}
          </span>
        ) : (
          <span className="text-xs text-[var(--ink-500)]">{job.status}</span>
        )}
      </td>
      <td className="px-5 py-3">
        {audit != null ? (
          <span className="font-mono text-xs text-[var(--ink-700)]">
            {audit}/100
          </span>
        ) : (
          <span className="text-xs text-[var(--gray-400)]">—</span>
        )}
      </td>
      <td className="px-5 py-3 text-xs text-[var(--ink-700)]">
        {job.engagement_count > 0 ? (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
            {job.engagement_count}
          </span>
        ) : (
          <span className="text-[var(--gray-400)]">—</span>
        )}
      </td>
      <td className="px-5 py-3 text-xs text-[var(--ink-500)]">
        {new Date(job.created_at).toLocaleDateString()}
      </td>
      <td className="px-5 py-3 text-right">
        {job.demo_url && (
          <a
            href={job.demo_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--ao-accent)] hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Open
          </a>
        )}
      </td>
    </tr>
  );
}
