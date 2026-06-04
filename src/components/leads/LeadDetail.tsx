"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  X,
  AlertCircle,
  Phone,
  CalendarPlus,
  CalendarClock,
  User,
  Clock,
  Globe,
  Facebook,
  MapPin,
  ExternalLink,
} from "lucide-react";
import {
  StatusDropdown,
  LogCallSheet,
  AddTaskSheet,
  ScheduleMeetingSheet,
  TaskQueue,
} from "@/components/leads";
import { LeadStream, type LeadStreamHandle } from "./LeadStream";
import { LeadActionsBar, DemoSection } from "@/components/sales";
import {
  LEAD_SOURCES,
  LEAD_STATUS_LABELS,
  LEAD_STATUS_STYLES,
  LOST_REASONS,
  INFOSHOP_PATTERN,
} from "@/lib/validations/leads";
import { CALL_OUTCOME_LABELS } from "@/lib/validations/activity";
import { formatRelative, safeHttpUrl } from "@/lib/utils";
import type { Lead, LeadStatus } from "@/types/database";

type Role = "admin" | "sales";

interface LeadWithRep extends Lead {
  sales_user?: { id: string; name: string; email: string } | null;
}

interface CallRow {
  id: string;
  outcome: string;
  direction: string;
  duration_seconds: number | null;
  notes: string | null;
  occurred_at: string;
}

const LOST_REASON_LABELS: Record<string, string> = Object.fromEntries(
  LOST_REASONS.map((r) => [r.value, r.label]),
);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const INPUT_CLS =
  "w-full px-3 py-2 text-sm rounded-[var(--radius-sm)] bg-[var(--bg-surface)] border border-[var(--allone-line)] text-[var(--ink-900)] focus:border-gray-400 focus:outline-none transition-colors";

const CARD_CLS =
  "rounded-[var(--radius-md)] border border-[var(--allone-line)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-xs)]";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-[var(--ink-500)]">
        {label}
      </span>
      {children}
    </label>
  );
}

export function LeadDetail({ leadId, role }: { leadId: string; role: Role }) {
  const apiBase = role === "admin" ? "/api/admin" : "/api/sales";
  const backHref = role === "admin" ? "/admin/leads" : "/sales/leads";
  const updateMethod = role === "admin" ? "PATCH" : "PUT";

  const [lead, setLead] = useState<LeadWithRep | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");

  // Overview (contact) form state
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
  });
  const [savingOverview, setSavingOverview] = useState(false);
  const [overviewSaved, setOverviewSaved] = useState(false);

  // Details state
  const [value, setValue] = useState(0);
  const [source, setSource] = useState("");
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsSaved, setDetailsSaved] = useState(false);

  // Note state
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);

  // Sheets
  const [logCallOpen, setLogCallOpen] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [meetingOpen, setMeetingOpen] = useState(false);

  // Recent calls (always via /api/sales — it authorizes admins too)
  const [calls, setCalls] = useState<CallRow[]>([]);

  // Rep roster for the manager-only reassign control (admin role only).
  const [reps, setReps] = useState<{ id: string; name: string }[]>([]);

  const streamRef = useRef<LeadStreamHandle>(null);

  const applyLead = useCallback((l: LeadWithRep) => {
    setLead(l);
    setForm({
      name: l.name || "",
      email: l.email || "",
      phone: l.phone || "",
      company: l.company || "",
    });
    setValue(l.value || 0);
    setSource(l.source || "");
    setNote(l.notes || "");
  }, []);

  const fetchLead = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/leads/${leadId}`);
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      applyLead(json.data || json);
    } catch {
      setLoadError("Failed to load lead");
    } finally {
      setIsLoading(false);
    }
  }, [apiBase, leadId, applyLead]);

  const fetchCalls = useCallback(async () => {
    try {
      const res = await fetch(`/api/sales/leads/${leadId}/calls?page=1&limit=5`);
      if (!res.ok) return;
      const json = await res.json();
      setCalls(json.data || []);
    } catch {
      /* non-blocking */
    }
  }, [leadId]);

  useEffect(() => {
    fetchLead();
    fetchCalls();
  }, [fetchLead, fetchCalls]);

  useEffect(() => {
    if (role !== "admin") return;
    fetch("/api/admin/sales-users")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.data) {
          const users = j.data as { id: string; name: string; role?: string }[];
          setReps(users.filter((u) => u.role !== "admin"));
        }
      })
      .catch(() => {});
  }, [role]);

  // Shared updater. Returns the updated lead row on success.
  const update = useCallback(
    async (patch: Record<string, unknown>): Promise<LeadWithRep | null> => {
      const res = await fetch(`${apiBase}/leads/${leadId}`, {
        method: updateMethod,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to update lead");
      }
      const json = await res.json();
      const updated: LeadWithRep = json.data || json;
      // Merge so we keep the joined rep that PATCH/PUT responses omit.
      setLead((prev) => (prev ? { ...prev, ...updated } : updated));
      return updated;
    },
    [apiBase, leadId, updateMethod],
  );

  const saveOverview = async () => {
    setSavingOverview(true);
    setError("");
    try {
      await update({
        name: form.name,
        email: form.email,
        phone: form.phone,
        company: form.company,
      });
      setOverviewSaved(true);
      setTimeout(() => setOverviewSaved(false), 2000);
      streamRef.current?.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update lead");
    } finally {
      setSavingOverview(false);
    }
  };

  const saveDetails = async () => {
    setSavingDetails(true);
    setError("");
    try {
      await update({ value: Number(value) || 0, source });
      setDetailsSaved(true);
      setTimeout(() => setDetailsSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update lead");
    } finally {
      setSavingDetails(false);
    }
  };

  const changeStatus = async (
    status: string,
    extra?: { lost_reason?: string },
  ) => {
    setError("");
    try {
      await update({ status, ...extra });
      streamRef.current?.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update status");
    }
  };

  // Manager-only: move the lead to another rep (or back to the pool) via the
  // override endpoint, then refresh to show the new owner.
  const reassign = async (salesUserId: string | null) => {
    setError("");
    try {
      const res = await fetch("/api/admin/leads/reassign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds: [leadId], salesUserId }),
      });
      if (!res.ok) throw new Error();
      await fetchLead();
    } catch {
      setError("Failed to reassign lead");
    }
  };

  const saveNote = async () => {
    setSavingNote(true);
    setError("");
    try {
      await update({ notes: note });
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 2000);
      streamRef.current?.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save note");
    } finally {
      setSavingNote(false);
    }
  };

  const afterActivity = () => {
    streamRef.current?.refresh();
    fetchCalls();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-[var(--allone-line)] border-t-[var(--ink-900)] rounded-full animate-spin" />
      </div>
    );
  }

  if (loadError || !lead) {
    return (
      <div className="max-w-2xl mx-auto">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm text-[var(--ink-500)] hover:text-[var(--ink-900)] mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Leads
        </Link>
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-[var(--radius-md)] text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          {loadError || "Lead not found"}
        </div>
      </div>
    );
  }

  const status = lead.status as LeadStatus;
  const webHref =
    lead.website && !INFOSHOP_PATTERN.test(lead.website)
      ? safeHttpUrl(lead.website)
      : null;
  const fbHref = safeHttpUrl(lead.facebook_url);
  const srcHref =
    lead.source_url && !INFOSHOP_PATTERN.test(lead.source_url)
      ? safeHttpUrl(lead.source_url)
      : null;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <LogCallSheet
        leadId={leadId}
        open={logCallOpen}
        onClose={() => setLogCallOpen(false)}
        onLogged={afterActivity}
      />
      <AddTaskSheet
        leadId={leadId}
        open={addTaskOpen}
        onClose={() => setAddTaskOpen(false)}
        onAdded={afterActivity}
      />
      <ScheduleMeetingSheet
        leadId={leadId}
        open={meetingOpen}
        onClose={() => setMeetingOpen(false)}
        onScheduled={afterActivity}
      />

      {/* Back + header */}
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm text-[var(--ink-500)] hover:text-[var(--ink-900)] mb-5"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Leads
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--ink-900)] truncate">
            {lead.company || lead.name || "Lead"}
          </h1>
          {lead.company && lead.name && (
            <p className="mt-0.5 text-sm text-[var(--ink-500)]">{lead.name}</p>
          )}
        </div>
        <StatusDropdown currentStatus={status} onSelect={changeStatus} />
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-[var(--radius-md)] text-red-600 text-sm">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError("")}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sales-only: actions + demo pipeline (admin omits these) */}
      {role === "sales" && (
        <div className="mb-6">
          <LeadActionsBar
            leadId={leadId}
            leadName={lead.name}
            leadStatus={status}
            onStatusChange={(s) =>
              setLead((prev) =>
                prev ? { ...prev, status: s as LeadStatus } : prev,
              )
            }
          />
          <DemoSection
            leadId={leadId}
            lead={{
              id: leadId,
              name: lead.name,
              email: lead.email,
              company: lead.company,
              source: lead.source,
            }}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* MAIN COLUMN */}
        <div className="space-y-6 lg:col-span-2">
          {/* Overview */}
          <div className={CARD_CLS}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-medium text-[var(--ink-900)]">
                Overview
              </h2>
            </div>
            <div className="space-y-4">
              <Field label="Name">
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  placeholder="Lead name"
                  className={INPUT_CLS}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email">
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="email@company.com"
                    className={INPUT_CLS}
                  />
                </Field>
                <Field label="Phone">
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    placeholder="+995..."
                    className={INPUT_CLS}
                  />
                </Field>
              </div>
              <Field label="Company">
                <input
                  value={form.company}
                  onChange={(e) =>
                    setForm({ ...form, company: e.target.value })
                  }
                  placeholder="Company"
                  className={INPUT_CLS}
                />
              </Field>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={saveOverview}
                disabled={savingOverview || !form.name}
                className="px-4 py-2 text-sm font-medium text-white bg-[var(--ink-900)] rounded-[var(--radius-sm)] hover:bg-[var(--ink-800)] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {savingOverview
                  ? "Saving…"
                  : overviewSaved
                    ? "Saved"
                    : "Save"}
              </button>
            </div>
          </div>

          {/* Details */}
          <div className={CARD_CLS}>
            <h2 className="mb-4 text-sm font-medium text-[var(--ink-900)]">
              Details
            </h2>
            <div className="space-y-4">
              <Field label="Status">
                <div className="flex items-center gap-3">
                  <StatusDropdown
                    currentStatus={status}
                    onSelect={changeStatus}
                  />
                  {status === "lost" && lead.lost_reason && (
                    <span className="text-xs text-[var(--ink-500)]">
                      Lost reason:{" "}
                      <span className="font-medium text-[var(--ink-700)]">
                        {LOST_REASON_LABELS[lead.lost_reason] ||
                          lead.lost_reason}
                      </span>
                    </span>
                  )}
                </div>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Value ($)">
                  <input
                    type="number"
                    min={0}
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    placeholder="0"
                    className={INPUT_CLS}
                  />
                </Field>
                <Field label="Source">
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className={`${INPUT_CLS} cursor-pointer`}
                  >
                    <option value="">Select a source…</option>
                    {LEAD_SOURCES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={saveDetails}
                disabled={savingDetails}
                className="px-4 py-2 text-sm font-medium text-white bg-[var(--ink-900)] rounded-[var(--radius-sm)] hover:bg-[var(--ink-800)] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {savingDetails ? "Saving…" : detailsSaved ? "Saved" : "Save"}
              </button>
            </div>
          </div>

          {/* Stream */}
          <div className={CARD_CLS}>
            <h2 className="mb-4 text-sm font-medium text-[var(--ink-900)]">
              Activity
            </h2>

            {/* Note composer — saves to the lead's single `notes` field */}
            <div className="mb-5 rounded-[var(--radius-sm)] border border-[var(--allone-line-soft)] bg-[var(--bg-surface-alt)] p-3">
              <textarea
                value={note}
                onChange={(e) => {
                  setNote(e.target.value);
                  setNoteSaved(false);
                }}
                rows={2}
                placeholder="Add a note about this lead…"
                className="w-full px-3 py-2 text-sm rounded-[var(--radius-sm)] bg-[var(--bg-surface)] border border-[var(--allone-line)] text-[var(--ink-900)] focus:border-gray-400 focus:outline-none resize-none"
              />
              <div className="mt-2 flex justify-end">
                <button
                  onClick={saveNote}
                  disabled={savingNote || note === (lead.notes || "")}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-[var(--ink-900)] rounded-[var(--radius-xs)] hover:bg-[var(--ink-800)] disabled:opacity-50 transition-all"
                >
                  {savingNote
                    ? "Saving…"
                    : noteSaved
                      ? "Saved"
                      : "Save note"}
                </button>
              </div>
            </div>

            <LeadStream ref={streamRef} leadId={leadId} apiBase={apiBase} />
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-6">
          {/* Quick actions */}
          <div className={CARD_CLS}>
            <h2 className="mb-3 text-sm font-medium text-[var(--ink-900)]">
              Quick actions
            </h2>
            <div className="space-y-2">
              <button
                onClick={() => setLogCallOpen(true)}
                className="w-full flex items-center gap-3 px-4 py-2.5 bg-[var(--bg-surface)] border border-[var(--allone-line)] rounded-[var(--radius-sm)] text-sm text-[var(--ink-800)] hover:border-[var(--allone-line-strong)] hover:bg-[var(--bg-surface-alt)] transition-all"
              >
                <Phone className="w-4 h-4 text-[var(--ink-400)]" />
                <span className="flex-1 text-left">Log call</span>
              </button>
              <button
                onClick={() => setAddTaskOpen(true)}
                className="w-full flex items-center gap-3 px-4 py-2.5 bg-[var(--bg-surface)] border border-[var(--allone-line)] rounded-[var(--radius-sm)] text-sm text-[var(--ink-800)] hover:border-[var(--allone-line-strong)] hover:bg-[var(--bg-surface-alt)] transition-all"
              >
                <CalendarPlus className="w-4 h-4 text-[var(--ink-400)]" />
                <span className="flex-1 text-left">Add follow-up</span>
              </button>
              <button
                onClick={() => setMeetingOpen(true)}
                className="w-full flex items-center gap-3 px-4 py-2.5 bg-[var(--bg-surface)] border border-[var(--allone-line)] rounded-[var(--radius-sm)] text-sm text-[var(--ink-800)] hover:border-[var(--allone-line-strong)] hover:bg-[var(--bg-surface-alt)] transition-all"
              >
                <CalendarClock className="w-4 h-4 text-[var(--ink-400)]" />
                <span className="flex-1 text-left">Schedule meeting</span>
              </button>
            </div>
          </div>

          {/* Research — the business's own web presence, for pre-call research */}
          {(webHref || fbHref || srcHref) && (
            <div className={CARD_CLS}>
              <h2 className="mb-3 text-sm font-medium text-[var(--ink-900)]">
                Research
              </h2>
              <div className="space-y-2">
                {webHref && (
                  <a
                    href={webHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--allone-line)] bg-[var(--bg-surface)] px-4 py-2.5 text-sm text-[var(--ink-800)] transition-all hover:border-[var(--allone-line-strong)] hover:bg-[var(--bg-surface-alt)]"
                  >
                    <Globe className="h-4 w-4 text-green-600" />
                    <span className="flex-1 truncate text-left">Website</span>
                    <ExternalLink className="h-3.5 w-3.5 text-[var(--ink-400)]" />
                  </a>
                )}
                {fbHref && (
                  <a
                    href={fbHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--allone-line)] bg-[var(--bg-surface)] px-4 py-2.5 text-sm text-[var(--ink-800)] transition-all hover:border-[var(--allone-line-strong)] hover:bg-[var(--bg-surface-alt)]"
                  >
                    <Facebook className="h-4 w-4 text-[#1877f2]" />
                    <span className="flex-1 truncate text-left">Facebook</span>
                    <ExternalLink className="h-3.5 w-3.5 text-[var(--ink-400)]" />
                  </a>
                )}
                {srcHref && (
                  <a
                    href={srcHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--allone-line)] bg-[var(--bg-surface)] px-4 py-2.5 text-sm text-[var(--ink-800)] transition-all hover:border-[var(--allone-line-strong)] hover:bg-[var(--bg-surface-alt)]"
                  >
                    <MapPin className="h-4 w-4 text-[var(--ao-accent)]" />
                    <span className="flex-1 truncate text-left">
                      {/google/i.test(srcHref) ? "Google Maps" : "Source listing"}
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 text-[var(--ink-400)]" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className={CARD_CLS}>
            <h2 className="mb-3 text-sm font-medium text-[var(--ink-900)]">
              Details
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <User className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ink-400)]" />
                <div className="min-w-0">
                  <dt className="text-xs text-[var(--ink-500)]">
                    Assigned rep
                  </dt>
                  {role === "admin" ? (
                    <dd className="mt-0.5">
                      <select
                        value={lead.sales_user?.id ?? ""}
                        onChange={(e) => reassign(e.target.value || null)}
                        className="w-full cursor-pointer rounded-[var(--radius-sm)] border border-[var(--allone-line)] bg-[var(--bg-surface)] px-2 py-1 text-sm text-[var(--ink-900)]"
                      >
                        <option value="">Unassigned</option>
                        {reps.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </dd>
                  ) : (
                    <dd className="text-[var(--ink-900)]">
                      {lead.sales_user?.name || (
                        <span className="text-[var(--ink-400)] italic">
                          Unassigned
                        </span>
                      )}
                    </dd>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ink-400)]" />
                <div className="min-w-0">
                  <dt className="text-xs text-[var(--ink-500)]">Created</dt>
                  <dd className="text-[var(--ink-900)]">
                    {formatDate(lead.created_at)}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ink-400)]" />
                <div className="min-w-0">
                  <dt className="text-xs text-[var(--ink-500)]">Updated</dt>
                  <dd className="text-[var(--ink-900)]">
                    {formatDate(lead.updated_at)}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-full ${LEAD_STATUS_STYLES[status]}`}
                >
                  {LEAD_STATUS_LABELS[status] || status}
                </span>
              </div>
            </dl>
          </div>

          {/* Activities — open follow-ups */}
          <div className={CARD_CLS}>
            <h2 className="mb-3 text-sm font-medium text-[var(--ink-900)]">
              Follow-ups
            </h2>
            <TaskQueue scope="open" leadId={leadId} />
          </div>

          {/* Recent calls */}
          <div className={CARD_CLS}>
            <h2 className="mb-3 text-sm font-medium text-[var(--ink-900)]">
              Recent calls
            </h2>
            {calls.length === 0 ? (
              <p className="text-xs text-[var(--ink-500)]">No calls logged.</p>
            ) : (
              <ul className="space-y-3">
                {calls.map((c) => (
                  <li key={c.id} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                      <Phone className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-[var(--ink-900)]">
                        {CALL_OUTCOME_LABELS[c.outcome] || c.outcome}
                      </p>
                      <p className="text-xs text-[var(--ink-500)]">
                        {formatRelative(c.occurred_at)}
                      </p>
                      {c.notes && (
                        <p className="mt-1 text-xs text-[var(--ink-700)] whitespace-pre-wrap break-words">
                          {c.notes}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
