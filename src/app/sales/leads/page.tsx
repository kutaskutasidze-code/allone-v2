"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  X,
  Users,
  Sun,
  Moon,
  Inbox,
  PhoneCall,
  Layers,
  Download,
  CalendarClock,
} from "lucide-react";
import { PageHeader, EmptyState } from "@/components/admin";
import {
  StatusDropdown,
  AddTaskSheet,
  LeadNotes,
  LeadCard,
  LeadsPagination,
  type LeadCardData,
} from "@/components/leads";
import {
  LEAD_STATUSES,
  HOTLINE_PHONE_PREFIX_PARAM,
} from "@/lib/validations/leads";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { useSalesTheme } from "@/app/sales/SalesThemeContext";

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
        params.set("scope", "followups");
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
      let totalCount: number = result.pagination?.total || 0;

      if (scopeMode === "done") {
        const startOfDay = new Date();
        startOfDay.setUTCHours(0, 0, 0, 0);
        data = data.filter((l) => {
          const status = l.status as string;
          const changed = l.status_changed_at as string | undefined;
          return status !== "new" && changed && new Date(changed) >= startOfDay;
        });
        // This scope is filtered client-side from the current page, so the
        // server's unfiltered total would make the pager show phantom pages.
        totalCount = data.length;
      }

      setLeads(data);
      setTotal(totalCount);
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
              <option value="all">Any source</option>
              <option value="yes">Has source (web / FB / maps)</option>
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
            const l = lead as unknown as LeadCardData;
            return (
              <LeadCard
                key={l.id}
                lead={l}
                basePath="/sales/leads"
                variant="row"
                className={
                  idx > 0 ? "border-t border-[var(--allone-line-soft)]" : ""
                }
                actions={
                  <>
                    <StatusDropdown
                      currentStatus={l.status}
                      onSelect={(status, extra) =>
                        updateLead(l.id, { status, ...extra })
                      }
                    />
                    <button
                      onClick={() => setTaskForLeadId(l.id)}
                      className="p-1 rounded hover:bg-[var(--bg-surface-alt)] text-[var(--ink-400)] hover:text-[var(--ink-900)] transition-colors"
                      title="Schedule follow-up"
                    >
                      <CalendarClock className="w-3.5 h-3.5" />
                    </button>
                    <LeadNotes
                      leadId={l.id}
                      initialNotes={l.notes || ""}
                      onSave={(id, notes) => updateLead(id, { notes })}
                    />
                  </>
                }
              />
            );
          })}

          <LeadsPagination
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
          />
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
