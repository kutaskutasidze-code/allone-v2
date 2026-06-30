"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Download, Mail, Phone, Linkedin } from "lucide-react";
import { PageHeader } from "@/components/admin";
import {
  APPLICATION_STATUSES,
  type ApplicationStatus,
  type JobApplication,
  type Vacancy,
} from "@/lib/validations/careers";

type AppWithAI = JobApplication & {
  ai_score?: number | null;
  ai_decision?: string | null;
  ai_confidence?: number | null;
  ai_rationale?: string | null;
  ai_email_status?: string | null;
  meeting_status?: string | null;
  meeting_starts_at?: string | null;
};

const inputCls =
  "px-3 py-2 text-sm rounded-[var(--radius-sm)] bg-[var(--bg-surface)] border border-[var(--allone-line)] text-[var(--ink-900)] focus:border-gray-400 focus:outline-none cursor-pointer";

const statusStyle: Record<ApplicationStatus, string> = {
  new: "bg-sky-50 text-sky-700 ring-sky-200",
  reviewing: "bg-amber-50 text-amber-700 ring-amber-200",
  shortlisted: "bg-violet-50 text-violet-700 ring-violet-200",
  interview: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  rejected: "bg-[var(--bg-surface-alt)] text-[var(--ink-500)] ring-gray-200",
  hired: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

function ApplicationsContent() {
  const searchParams = useSearchParams();
  const [apps, setApps] = useState<AppWithAI[]>([]);
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [vacancyFilter, setVacancyFilter] = useState(
    searchParams.get("vacancy") || "all",
  );
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetch("/api/admin/careers")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j?.data && setVacancies(j.data))
      .catch(() => {});
  }, []);

  const fetchApps = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (vacancyFilter !== "all") params.set("vacancy_id", vacancyFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    try {
      const res = await fetch(
        `/api/admin/careers/applications?${params.toString()}`,
      );
      const json = await res.json();
      setApps(res.ok ? json.data || [] : []);
    } finally {
      setLoading(false);
    }
  }, [vacancyFilter, statusFilter]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  const setStatus = async (id: string, status: string) => {
    setApps((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: status as ApplicationStatus } : a,
      ),
    );
    await fetch(`/api/admin/careers/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  };

  return (
    <div>
      <Link
        href="/admin/careers"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--ink-500)] hover:text-[var(--ink-900)] mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Vacancies
      </Link>
      <PageHeader
        title="Applications"
        description="Review and triage applicants. CV links are signed and expire in 60 seconds."
      />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select
          className={inputCls}
          value={vacancyFilter}
          onChange={(e) => setVacancyFilter(e.target.value)}
        >
          <option value="all">All vacancies</option>
          {vacancies.map((v) => (
            <option key={v.id} value={v.id}>
              {v.title}
            </option>
          ))}
        </select>
        <select
          className={inputCls}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          {APPLICATION_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <span className="ml-auto text-sm text-[var(--ink-500)]">
          {apps.length} application{apps.length === 1 ? "" : "s"}
        </span>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--ink-500)]">Loading…</p>
      ) : apps.length === 0 ? (
        <div className="bg-[var(--bg-surface)] border border-[var(--allone-line)] rounded-[var(--radius-sm)] p-10 text-center text-sm text-[var(--ink-500)]">
          No applications match these filters.
        </div>
      ) : (
        <div className="space-y-2">
          {apps.map((a) => (
            <div
              key={a.id}
              className="bg-[var(--bg-surface)] border border-[var(--allone-line)] rounded-[var(--radius-sm)] px-4 py-3"
            >
              <div className="flex items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-[var(--ink-900)]">
                      {a.name}
                    </span>
                    <span className="text-xs text-[var(--ink-400)]">
                      → {a.vacancy_title || "Unlinked"}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--ink-500)]">
                    <a
                      href={`mailto:${a.email}`}
                      className="inline-flex items-center gap-1 hover:text-[var(--ink-900)]"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      {a.email}
                    </a>
                    {a.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" />
                        {a.phone}
                      </span>
                    )}
                    {a.linkedin && (
                      <a
                        href={
                          a.linkedin.startsWith("http")
                            ? a.linkedin
                            : `https://${a.linkedin}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 hover:text-[var(--ink-900)]"
                      >
                        <Linkedin className="h-3.5 w-3.5" />
                        LinkedIn
                      </a>
                    )}
                    <span>{new Date(a.created_at).toLocaleDateString()}</span>
                  </div>
                  {a.projects && (
                    <p className="mt-2 text-sm text-[var(--ink-700)] whitespace-pre-wrap break-words">
                      <span className="text-[var(--ink-400)]">Projects: </span>
                      {a.projects}
                    </p>
                  )}
                  {a.note && (
                    <p className="mt-1 text-sm text-[var(--ink-700)] whitespace-pre-wrap break-words">
                      <span className="text-[var(--ink-400)]">Note: </span>
                      {a.note}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span
                    className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-[var(--radius-xs)] ring-1 ${statusStyle[a.status]}`}
                  >
                    {APPLICATION_STATUSES.find((s) => s.value === a.status)
                      ?.label || a.status}
                  </span>
                  <select
                    className={`${inputCls} text-xs py-1`}
                    value={a.status}
                    onChange={(e) => setStatus(a.id, e.target.value)}
                  >
                    {APPLICATION_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  {a.cv_path && (
                    <a
                      href={`/api/admin/careers/applications/${a.id}/cv`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-white bg-[var(--ink-900)] rounded-[var(--radius-sm)] hover:bg-[var(--ink-800)]"
                    >
                      <Download className="h-3.5 w-3.5" />
                      CV
                    </a>
                  )}
                  {a.ai_score != null ? (
                    <span
                      className="text-xs text-[var(--ink-700)]"
                      title={a.ai_rationale ?? a.ai_decision ?? ""}
                    >
                      {a.ai_score}/100 · {a.ai_decision ?? "—"}
                    </span>
                  ) : (
                    <span className="text-xs text-[var(--ink-400)]">—</span>
                  )}
                  {a.meeting_status && (
                    <span
                      className="text-xs text-violet-700"
                      title={a.meeting_starts_at ?? ""}
                    >
                      · meeting {a.meeting_status}
                      {a.meeting_starts_at
                        ? ` ${new Date(a.meeting_starts_at).toLocaleString()}`
                        : ""}
                    </span>
                  )}
                  {a.ai_email_status && (
                    <span className="text-xs text-[var(--ink-500)]">
                      · email{" "}
                      {a.ai_email_status.startsWith("failed")
                        ? "failed"
                        : a.ai_email_status}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminApplicationsPage() {
  return (
    <Suspense fallback={null}>
      <ApplicationsContent />
    </Suspense>
  );
}
