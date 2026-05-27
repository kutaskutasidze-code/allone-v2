// Deep-dive view of a single demo job — phase history with timings, raw
// audit + engagement, deploy + admin links, retry / teardown actions.

import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DemoDetailActions } from "./DemoDetailActions";

interface PhaseEntry {
  phase: string;
  started_at: string;
  ended_at?: string;
  status: "running" | "ok" | "failed";
  error?: string;
  notes?: Record<string, unknown>;
}

interface DemoJob {
  id: string;
  lead_id: string;
  status: string;
  current_phase: string | null;
  progress: number;
  phase_history: PhaseEntry[];
  demo_url: string | null;
  demo_vercel_project_id: string | null;
  audit_results: {
    scores?: Record<string, number>;
    topIssues?: Array<{
      severity: string;
      category: string;
      headline: string;
      oneLineFix: string;
    }>;
    techStack?: {
      platform?: string | null;
      frameworks?: string[];
      cms?: string | null;
    };
  } | null;
  email_draft_id: string | null;
  error_message: string | null;
  expires_at: string | null;
  engagement_count: number;
  last_engaged_at: string | null;
  created_at: string;
  updated_at: string;
  reference_template_id: string | null;
}

interface Engagement {
  id: string;
  event_type: string;
  occurred_at: string;
  metadata: { ua?: string; to?: string; ip?: string } | null;
}

async function getSalesUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) redirect("/sales/login");
  const admin = createAdminClient();
  const { data: salesUser } = await admin
    .from("sales_users")
    .select("*")
    .eq("email", user.email.toLowerCase())
    .maybeSingle();
  if (!salesUser) redirect("/sales/login?error=not_sales_user");
  return { supabase, salesUser };
}

export default async function DemoJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, salesUser } = await getSalesUser();

  const { data: job } = await supabase
    .from("demo_jobs")
    .select("*")
    .eq("id", id)
    .single();
  if (!job) return notFound();

  // Ownership check via the lead's sales_user_id.
  const { data: lead } = await supabase
    .from("leads")
    .select("id, name, company, email, sales_user_id")
    .eq("id", (job as DemoJob).lead_id)
    .single();
  if (
    !lead ||
    (lead as { sales_user_id?: string }).sales_user_id !== salesUser.id
  ) {
    return notFound();
  }

  const { data: engagements } = await supabase
    .from("demo_engagements")
    .select("id, event_type, occurred_at, metadata")
    .eq("demo_job_id", id)
    .order("occurred_at", { ascending: false })
    .limit(50);

  return (
    <DemoDetailView
      job={job as DemoJob}
      lead={
        lead as {
          id: string;
          name: string;
          company: string | null;
          email: string | null;
        }
      }
      engagements={(engagements as Engagement[]) ?? []}
    />
  );
}

function DemoDetailView({
  job,
  lead,
  engagements,
}: {
  job: DemoJob;
  lead: {
    id: string;
    name: string;
    company: string | null;
    email: string | null;
  };
  engagements: Engagement[];
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href="/sales/demos"
          className="text-xs font-medium text-[var(--gray-500)] hover:text-[var(--black)]"
        >
          ← All demos
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--black)]">
          Demo for {lead.name}
        </h1>
        <p className="text-sm text-[var(--gray-500)]">
          {lead.company ?? lead.email ?? "—"} ·{" "}
          <Link href={`/sales/leads/${lead.id}`} className="underline">
            open lead
          </Link>
        </p>
      </div>

      <DemoDetailActions
        jobId={job.id}
        status={job.status}
        demoUrl={job.demo_url}
        leadId={lead.id}
      />

      {job.error_message && (
        <div className="rounded-2xl border border-red-100 bg-red-50/60 p-5">
          <p className="text-sm font-medium text-red-900">
            Failed at: {job.current_phase ?? "unknown phase"}
          </p>
          <p className="mt-1 text-sm text-red-800">{job.error_message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <KV label="Status" value={job.status} />
        <KV label="Progress" value={`${job.progress}%`} />
        <KV label="Created" value={new Date(job.created_at).toLocaleString()} />
        <KV label="Updated" value={new Date(job.updated_at).toLocaleString()} />
        <KV
          label="Expires"
          value={
            job.expires_at ? new Date(job.expires_at).toLocaleString() : "—"
          }
        />
        <KV label="Engagement" value={String(job.engagement_count)} />
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--gray-500)]">
          Phase history
        </h2>
        <PhaseTimeline
          history={job.phase_history ?? []}
          current={job.current_phase}
        />
      </section>

      {job.audit_results && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--gray-500)]">
            Audit
          </h2>
          <AuditDetail audit={job.audit_results} />
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--gray-500)]">
          Engagement ({engagements.length})
        </h2>
        {engagements.length === 0 ? (
          <p className="rounded-2xl border border-[var(--gray-200)] bg-white p-5 text-sm text-[var(--gray-500)]">
            No engagement events yet. Will appear after the lead opens or clicks
            the email.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[var(--gray-200)] bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--gray-200)] text-left text-[11px] font-mono uppercase tracking-wider text-[var(--gray-500)]">
                  <th className="px-5 py-2 font-medium">When</th>
                  <th className="px-5 py-2 font-medium">Event</th>
                  <th className="px-5 py-2 font-medium">Detail</th>
                </tr>
              </thead>
              <tbody>
                {engagements.map((e) => (
                  <tr
                    key={e.id}
                    className="border-b border-[var(--gray-100)] last:border-b-0"
                  >
                    <td className="px-5 py-2 text-xs text-[var(--gray-700)]">
                      {new Date(e.occurred_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-2 text-xs">
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                        {e.event_type}
                      </span>
                    </td>
                    <td className="px-5 py-2 truncate text-xs text-[var(--gray-500)]">
                      {e.metadata?.to ?? e.metadata?.ua ?? ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--gray-200)] bg-white p-4">
      <p className="text-[11px] font-mono uppercase tracking-wider text-[var(--gray-500)]">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium text-[var(--black)]">{value}</p>
    </div>
  );
}

function PhaseTimeline({
  history,
  current,
}: {
  history: PhaseEntry[];
  current: string | null;
}) {
  if (history.length === 0) {
    return (
      <p className="rounded-2xl border border-[var(--gray-200)] bg-white p-5 text-sm text-[var(--gray-500)]">
        No phase events yet.
      </p>
    );
  }
  return (
    <ol className="space-y-2">
      {history.map((p, i) => {
        const start = new Date(p.started_at);
        const end = p.ended_at ? new Date(p.ended_at) : null;
        const dur = end
          ? Math.round((end.getTime() - start.getTime()) / 100) / 10
          : null;
        const isCurrent = current && p.phase === current && !end;
        const color =
          p.status === "ok"
            ? "border-emerald-200 bg-emerald-50/60"
            : p.status === "failed"
              ? "border-red-200 bg-red-50/60"
              : "border-blue-200 bg-blue-50/60";
        return (
          <li key={i} className={`rounded-xl border ${color} px-4 py-2.5`}>
            <div className="flex items-baseline justify-between gap-3">
              <div className="font-medium text-[var(--black)]">{p.phase}</div>
              <div className="text-xs text-[var(--gray-500)]">
                {start.toLocaleTimeString()}
                {dur != null && (
                  <>
                    {" "}
                    · <span className="font-mono">{dur}s</span>
                  </>
                )}
                {isCurrent && (
                  <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                    running
                  </span>
                )}
              </div>
            </div>
            {p.notes && Object.keys(p.notes).length > 0 && (
              <pre className="mt-2 overflow-x-auto rounded-md bg-white/80 p-2 text-[11px] text-[var(--gray-700)]">
                {JSON.stringify(p.notes, null, 2)}
              </pre>
            )}
            {p.error && (
              <p className="mt-2 text-xs text-red-700">Error: {p.error}</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function AuditDetail({
  audit,
}: {
  audit: NonNullable<DemoJob["audit_results"]>;
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-[var(--gray-200)] bg-white p-5">
      {audit.scores && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {Object.entries(audit.scores).map(([k, v]) => (
            <div
              key={k}
              className="rounded-lg border border-[var(--gray-100)] p-3"
            >
              <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--gray-500)]">
                {k}
              </p>
              <p className="mt-0.5 font-mono text-lg">{v}</p>
            </div>
          ))}
        </div>
      )}
      {audit.topIssues && audit.topIssues.length > 0 && (
        <ul className="space-y-2">
          {audit.topIssues.map((i, n) => (
            <li
              key={n}
              className="rounded-lg border border-[var(--gray-100)] px-3 py-2 text-sm"
            >
              <div className="flex items-baseline justify-between">
                <span className="font-medium text-[var(--black)]">
                  {i.headline}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--gray-500)]">
                  {i.category} · {i.severity}
                </span>
              </div>
              {i.oneLineFix && (
                <p className="mt-1 text-xs text-[var(--gray-600)]">
                  {i.oneLineFix}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
