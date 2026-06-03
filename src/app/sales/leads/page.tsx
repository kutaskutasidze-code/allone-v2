"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  X,
  Users,
  MessageSquare,
  ExternalLink,
  Phone,
  Mail,
  Globe,
  Trash2,
  Sun,
  Moon,
  Inbox,
  PhoneCall,
  Layers,
  Download,
  CalendarClock,
} from "lucide-react";
import { PageHeader, EmptyState } from "@/components/admin";
import { StatusDropdown, AddTaskSheet } from "@/components/leads";
import {
  LEAD_STATUSES,
  HOTLINE_PHONE_PREFIX_PARAM,
  INFOSHOP_PATTERN,
} from "@/lib/validations/leads";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { useSalesTheme } from "@/app/sales/SalesThemeContext";

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const PITCH_LABELS: Record<string, string> = {
  no_website: "No website",
  website_broken: "Website broken",
  no_https: "Not secure (HTTP)",
  not_mobile_friendly: "Not mobile-friendly",
  no_chat_widget: "No chat widget",
  no_online_booking: "No online booking",
  no_social_links: "No social media",
  slow_website: "Slow website",
  basic_website_builder: "Wix/Tilda site",
  new_business: "New business",
  newly_registered: "Newly registered",
};

const HIDDEN_TAGS = new Set(["enrich_attempted", "website_audited"]);

function LeadNotes({
  leadId,
  initialNotes,
  onSave,
}: {
  leadId: string;
  initialNotes: string;
  onSave: (id: string, notes: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(initialNotes);
  const [saved, setSaved] = useState(true);

  const handleSave = () => {
    if (notes !== initialNotes) {
      onSave(leadId, notes);
      setSaved(true);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="p-1 rounded hover:bg-[var(--bg-surface-alt)] text-[var(--ink-400)] hover:text-[var(--ink-900)] transition-colors"
        title="Notes"
      >
        <MessageSquare className="w-3.5 h-3.5" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="col-span-full overflow-hidden"
          >
            <div className="px-4 py-3 bg-[var(--bg-surface-alt)] border-t border-[var(--allone-line-soft)]">
              <textarea
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  setSaved(false);
                }}
                onBlur={handleSave}
                placeholder="Add notes about this lead..."
                rows={2}
                className="w-full px-3 py-2 text-sm bg-[var(--bg-surface)] border border-[var(--allone-line)] rounded-[var(--radius-sm)] focus:border-gray-400 focus:outline-none resize-none"
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setOpen(false)}
                  className="px-3 py-1 text-xs text-[var(--ink-500)] hover:text-[var(--ink-900)]"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleSave();
                    setOpen(false);
                  }}
                  className={`px-3 py-1 text-xs rounded-[var(--radius-xs)] ${saved ? "bg-[var(--bg-sunken)] text-[var(--ink-500)]" : "bg-[var(--ink-900)] text-white hover:bg-[var(--ink-800)]"}`}
                >
                  {saved ? "Saved" : "Save"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

type ScopeMode = "today" | "mine" | "callbacks" | "done";

function LeadsPageContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "all";
  const { theme, toggleTheme } = useSalesTheme();
  const [taskForLeadId, setTaskForLeadId] = useState<string | null>(null);
  const initialScopeParam = searchParams.get("scope");

  const [scopeMode, setScopeMode] = useState<ScopeMode>(
    initialScopeParam === "today"
      ? "today"
      : initialStatus === "callback"
        ? "callbacks"
        : "mine",
  );

  const [leads, setLeads] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [serviceFilter, setServiceFilter] = useState("all");
  const [websiteFilter, setWebsiteFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const limit = 50;

  const exportMyLeads = async () => {
    if (exporting) return;
    setExporting(true);
    setError("");
    try {
      const res = await fetch("/api/sales/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "export_sales_report",
          input: { weeks: 12 },
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        data?: { url?: string };
      };
      if (!res.ok || !json.ok || !json.data?.url) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      window.open(json.data.url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const debouncedSearch = useDebounce(search, 350);

  const fetchLeads = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();

      if (scopeMode === "today") {
        params.set("scope", "today");
      } else if (scopeMode === "callbacks") {
        params.set("status", "in_process");
      }

      // Honor an explicit status pill click only when no scope filter overrides it.
      if (
        scopeMode !== "today" &&
        scopeMode !== "callbacks" &&
        statusFilter !== "all"
      ) {
        params.set("status", statusFilter);
      }
      if (serviceFilter !== "all") params.set("service", serviceFilter);
      if (websiteFilter !== "all") params.set("has_website", websiteFilter);
      if (sourceFilter !== "all") params.set("has_source", sourceFilter);
      if (debouncedSearch) params.set("search", debouncedSearch);
      params.set("page", page.toString());
      params.set("limit", limit.toString());
      params.set("exclude_phone_prefix", HOTLINE_PHONE_PREFIX_PARAM);

      const res = await fetch(`/api/sales/leads?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch leads");
      const result = await res.json();
      let data: Record<string, unknown>[] = result.data || [];

      if (scopeMode === "done") {
        const startOfDay = new Date();
        startOfDay.setUTCHours(0, 0, 0, 0);
        data = data.filter((l) => {
          const status = l.status as string;
          const changed = l.status_changed_at as string | undefined;
          return status !== "new" && changed && new Date(changed) >= startOfDay;
        });
      }

      setLeads(data);
      setTotal(result.pagination?.total || 0);
    } catch {
      setError("Failed to load leads");
    } finally {
      setIsLoading(false);
    }
  }, [
    scopeMode,
    statusFilter,
    serviceFilter,
    websiteFilter,
    sourceFilter,
    debouncedSearch,
    page,
  ]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const updateLead = async (id: string, updates: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/sales/leads/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update");
      const result = await res.json();
      setLeads((prev) =>
        prev.map((l) =>
          (l as { id: string }).id === id ? { ...l, ...result.data } : l,
        ),
      );
    } catch {
      setError("Failed to update lead");
    }
  };

  const deleteLead = async (id: string) => {
    if (!confirm("Delete this lead?")) return;
    try {
      const res = await fetch(`/api/sales/leads/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setLeads((prev) => prev.filter((l) => (l as { id: string }).id !== id));
      setTotal((t) => t - 1);
    } catch {
      setError("Failed to delete lead");
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      {taskForLeadId && (
        <AddTaskSheet
          leadId={taskForLeadId}
          open={!!taskForLeadId}
          onClose={() => setTaskForLeadId(null)}
        />
      )}
      <PageHeader
        title="Leads"
        description={`${total} leads · your pipeline`}
        action={{ label: "Add Lead", href: "/sales/leads/new" }}
        extras={
          <>
            <button
              onClick={exportMyLeads}
              disabled={exporting}
              title="Export your pipeline as xlsx (deals, summary, by-week, calls)"
              className="inline-flex items-center gap-2 px-3 h-10 text-sm font-medium text-[var(--ink-700)] bg-[var(--bg-surface)] border border-[var(--allone-line)] rounded-[var(--radius-sm)] shadow-[var(--shadow-xs)] hover:border-[var(--allone-line-strong)] active:scale-[0.98] transition-all duration-150 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {exporting ? "Exporting…" : "Export"}
            </button>
            <button
              onClick={toggleTheme}
              aria-label={
                theme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
              className="inline-flex items-center justify-center w-10 h-10 text-[var(--ink-700)] bg-[var(--bg-surface)] border border-[var(--allone-line)] rounded-[var(--radius-sm)] shadow-[var(--shadow-xs)] hover:border-[var(--allone-line-strong)] active:scale-[0.98] transition-all duration-150"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          </>
        }
      />

      {error && (
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-[var(--radius-sm)] text-red-600 text-sm">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError("")}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Scope chips — high-level view selector for the rep's daily workflow. */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { value: "today" as ScopeMode, label: "Today's Queue", icon: Sun },
          { value: "mine" as ScopeMode, label: "All Mine", icon: Inbox },
          {
            value: "callbacks" as ScopeMode,
            label: "Callbacks",
            icon: PhoneCall,
          },
          { value: "done" as ScopeMode, label: "Done Today", icon: Layers },
        ].map((chip) => {
          const Icon = chip.icon;
          const active = scopeMode === chip.value;
          return (
            <button
              key={chip.value}
              onClick={() => {
                setScopeMode(chip.value);
                setStatusFilter("all");
                setPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-sm)] text-xs font-medium transition-all ${active ? "bg-[var(--ink-900)] text-white shadow-[var(--shadow-xs)]" : "bg-[var(--bg-surface)] border border-[var(--allone-line)] text-[var(--ink-700)] hover:border-[var(--allone-line-strong)]"}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Status filter (only meaningful within the All-Mine scope) */}
      {scopeMode === "mine" && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setStatusFilter("all");
              setPage(1);
            }}
            className={`px-3 py-2 rounded-[var(--radius-sm)] text-xs font-medium transition-all ${statusFilter === "all" ? "bg-[var(--ink-900)] text-white shadow-[var(--shadow-xs)]" : "bg-[var(--bg-surface)] border border-[var(--allone-line)] text-[var(--ink-700)] hover:border-[var(--allone-line-strong)]"}`}
          >
            All
          </button>
          {LEAD_STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => {
                setStatusFilter(s.value);
                setPage(1);
              }}
              className={`px-3 py-2 rounded-[var(--radius-sm)] text-xs font-medium transition-all ${statusFilter === s.value ? "bg-[var(--ink-900)] text-white shadow-[var(--shadow-xs)]" : "bg-[var(--bg-surface)] border border-[var(--allone-line)] text-[var(--ink-700)] hover:border-[var(--allone-line-strong)]"}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Toolbar: search + filter dropdowns in a single BF-card row. */}
      <div className="rounded-[var(--radius-md)] border border-[var(--allone-line)] bg-[var(--bg-surface)] p-3 shadow-[var(--shadow-xs)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ink-400)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, email, phone, company, city..."
              className="w-full pl-10 pr-10 py-2 text-sm rounded-[var(--radius-sm)] bg-[var(--bg-surface-alt)] border border-[var(--allone-line)] focus:border-[var(--ao-accent)] focus:outline-none transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-400)] hover:text-[var(--ink-900)]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={websiteFilter}
              onChange={(e) => {
                setWebsiteFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs rounded-[var(--radius-sm)] bg-[var(--bg-surface-alt)] border border-[var(--allone-line)] focus:border-[var(--ao-accent)] focus:outline-none cursor-pointer"
            >
              <option value="all">All websites</option>
              <option value="yes">Has website</option>
              <option value="no">No website</option>
            </select>
            <select
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs rounded-[var(--radius-sm)] bg-[var(--bg-surface-alt)] border border-[var(--allone-line)] focus:border-[var(--ao-accent)] focus:outline-none cursor-pointer"
            >
              <option value="all">All sources</option>
              <option value="yes">Has source</option>
              <option value="no">No source</option>
            </select>
            <select
              value={serviceFilter}
              onChange={(e) => {
                setServiceFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs rounded-[var(--radius-sm)] bg-[var(--bg-surface-alt)] border border-[var(--allone-line)] focus:border-[var(--ao-accent)] focus:outline-none cursor-pointer"
            >
              <option value="all">All services</option>
              <option value="website">Website</option>
              <option value="chatbots">Chatbots</option>
              <option value="automation">Automation</option>
              <option value="consulting">Consulting</option>
              <option value="custom_ai">Custom AI</option>
            </select>
            {(serviceFilter !== "all" ||
              websiteFilter !== "all" ||
              sourceFilter !== "all") && (
              <button
                onClick={() => {
                  setServiceFilter("all");
                  setWebsiteFilter("all");
                  setSourceFilter("all");
                  setPage(1);
                }}
                className="text-[11px] text-[var(--ink-500)] hover:text-[var(--ink-900)] underline-offset-2 hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-5 h-5 border-2 border-[var(--allone-line)] border-t-gray-900 rounded-full animate-spin" />
        </div>
      ) : leads.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No leads found"
          description={
            search || statusFilter !== "all"
              ? "Try adjusting your filters."
              : "No leads yet."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--allone-line)] bg-[var(--bg-surface)] shadow-[var(--shadow-xs)]">
          {leads.map((lead, idx) => {
            const l = lead as Record<string, string | number | string[] | null>;
            const tags = (l.tags as string[] | null) || [];
            const visibleTags = tags.filter((t) => !HIDDEN_TAGS.has(t));
            return (
              <div
                key={l.id as string}
                className={`group p-4 transition-colors hover:bg-[var(--bg-surface-alt)] ${idx > 0 ? "border-t border-[var(--allone-line-soft)]" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-sm text-[var(--ink-900)] truncate">
                        {(l.company || l.name) as string}
                      </h3>
                      {l.industry && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-medium">
                          {l.industry as string}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {l.phone && (
                        <a
                          href={`tel:${l.phone}`}
                          className="inline-flex items-center gap-1 text-xs text-[var(--ao-accent)] hover:underline"
                        >
                          <Phone className="w-3 h-3" />
                          {l.phone as string}
                        </a>
                      )}
                      {l.email && (
                        <a
                          href={`mailto:${l.email}`}
                          className="inline-flex items-center gap-1 text-xs text-[var(--ao-accent)] hover:underline"
                        >
                          <Mail className="w-3 h-3" />
                          {l.email as string}
                        </a>
                      )}
                      {l.website &&
                      !INFOSHOP_PATTERN.test(l.website as string) ? (
                        <a
                          href={l.website as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-green-600 hover:underline"
                        >
                          <Globe className="w-3 h-3" />
                          Website
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-red-400">
                          <Globe className="w-3 h-3" />
                          No website
                        </span>
                      )}
                      {l.facebook_url && (
                        <a
                          href={l.facebook_url as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-[var(--ao-accent)] hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Facebook
                        </a>
                      )}
                      {l.source_url &&
                        !INFOSHOP_PATTERN.test(l.source_url as string) && (
                          <a
                            href={l.source_url as string}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-[var(--ink-500)] hover:text-[var(--ao-accent)]"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Source
                          </a>
                        )}
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-[var(--ink-400)]">
                      {l.city && <span>{l.city as string}</span>}
                      {l.matched_service && (
                        <span>· {l.matched_service as string}</span>
                      )}
                      <span>· {formatDate(l.created_at as string)}</span>
                    </div>
                    {visibleTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {visibleTags.map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                          >
                            {PITCH_LABELS[tag] || tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {l.notes && (
                      <div className="mt-2 text-xs text-[var(--ink-700)] bg-[var(--bg-surface-alt)] rounded-[var(--radius-sm)] px-3 py-2 whitespace-pre-wrap">
                        {l.notes as string}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <StatusDropdown
                      currentStatus={l.status as string}
                      onSelect={(status, extra) =>
                        updateLead(l.id as string, { status, ...extra })
                      }
                    />
                    <button
                      onClick={() => setTaskForLeadId(l.id as string)}
                      className="p-1 rounded hover:bg-[var(--bg-surface-alt)] text-[var(--ink-400)] hover:text-[var(--ink-900)] transition-colors"
                      title="Schedule follow-up"
                    >
                      <CalendarClock className="w-3.5 h-3.5" />
                    </button>
                    <LeadNotes
                      leadId={l.id as string}
                      initialNotes={(l.notes as string) || ""}
                      onSave={(id, notes) => updateLead(id, { notes })}
                    />
                    <button
                      onClick={() => deleteLead(l.id as string)}
                      className="p-1 rounded hover:bg-red-50 text-[var(--ink-400)] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-xs text-[var(--ink-500)]">
                {total} leads
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="px-2.5 py-1.5 text-xs rounded-[var(--radius-sm)] border border-[var(--allone-line)] hover:bg-[var(--bg-surface-alt)] disabled:opacity-30 transition-colors"
                >
                  First
                </button>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-2.5 py-1.5 text-xs rounded-[var(--radius-sm)] border border-[var(--allone-line)] hover:bg-[var(--bg-surface-alt)] disabled:opacity-30 transition-colors"
                >
                  Prev
                </button>
                <div className="flex items-center gap-1 text-xs text-[var(--ink-500)]">
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    defaultValue={page}
                    key={page}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const v = parseInt(
                          (e.target as HTMLInputElement).value,
                        );
                        if (v >= 1 && v <= totalPages) setPage(v);
                      }
                    }}
                    onBlur={(e) => {
                      const v = parseInt(e.target.value);
                      if (v >= 1 && v <= totalPages) setPage(v);
                    }}
                    className="w-12 py-1.5 text-center text-xs rounded-[var(--radius-sm)] border border-[var(--allone-line)] focus:border-gray-400 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span>of {totalPages}</span>
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-2.5 py-1.5 text-xs rounded-[var(--radius-sm)] border border-[var(--allone-line)] hover:bg-[var(--bg-surface-alt)] disabled:opacity-30 transition-colors"
                >
                  Next
                </button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  className="px-2.5 py-1.5 text-xs rounded-[var(--radius-sm)] border border-[var(--allone-line)] hover:bg-[var(--bg-surface-alt)] disabled:opacity-30 transition-colors"
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function LeadsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="w-5 h-5 border-2 border-[var(--allone-line)] border-t-gray-900 rounded-full animate-spin" />
        </div>
      }
    >
      <LeadsPageContent />
    </Suspense>
  );
}
