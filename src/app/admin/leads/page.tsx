"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { Search, X, Users, Trash2, BarChart3, Tag, Sun, Moon } from "lucide-react";
import { EmptyState } from "@/components/admin";
import {
  StatusDropdown,
  LeadNotes,
  LeadCard,
  LeadsPagination,
  LostReasonPicker,
  SavedViews,
} from "@/components/leads";
import {
  LEAD_STATUSES,
  HOTLINE_PHONE_PREFIX_PARAM,
} from "@/lib/validations/leads";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { HotLinesDropdown } from "@/app/sales/leads/HotLinesDropdown";
import { useAdminTheme } from "@/app/admin/AdminThemeContext";
import type { LeadWithSalesUser } from "@/types/database";

function LeadCardSkeleton() {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--allone-line-soft)] rounded-[var(--radius-md)] p-4 shadow-[var(--shadow-xs)] shadow-black/[0.02] animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-4 w-40 rounded bg-[var(--bg-sunken)]" />
            <div className="h-3 w-16 rounded bg-[var(--bg-sunken)]" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-3 w-28 rounded bg-[var(--bg-sunken)]" />
            <div className="h-3 w-32 rounded bg-[var(--bg-sunken)]" />
            <div className="h-3 w-20 rounded bg-[var(--bg-sunken)]" />
          </div>
          <div className="h-3 w-48 rounded bg-[var(--bg-sunken)]" />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="h-6 w-20 rounded-full bg-[var(--bg-sunken)]" />
        </div>
      </div>
    </div>
  );
}

function AddLeadModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    company: "",
    city: "",
    website: "",
    matched_service: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    setSaving(true);
    setFormError("");
    try {
      const res = await fetch("/api/admin/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, country: "GE" }),
      });
      if (!res.ok) throw new Error("Failed");
      onAdded();
      onClose();
    } catch {
      setFormError("Failed to create lead");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 text-sm bg-[var(--bg-surface)] border border-[var(--allone-line)] rounded-[var(--radius-sm)] focus:border-gray-400 focus:outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg bg-[var(--bg-surface)] rounded-[var(--radius-md)] shadow-xl shadow-black/[0.08] p-6 mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold text-[var(--ink-900)]">
            Add Lead
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--ink-400)] hover:text-[var(--ink-900)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-[var(--radius-sm)] text-red-600 text-sm">
              {formError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--ink-500)] mb-1">
                Name *
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className={inputClass}
                placeholder="Business name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ink-500)] mb-1">
                Phone
              </label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={inputClass}
                placeholder="+995..."
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--ink-500)] mb-1">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputClass}
                placeholder="email@company.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ink-500)] mb-1">
                Company
              </label>
              <input
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className={inputClass}
                placeholder="Company name"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--ink-500)] mb-1">
                City
              </label>
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className={inputClass}
                placeholder="Tbilisi"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ink-500)] mb-1">
                Service
              </label>
              <select
                value={form.matched_service}
                onChange={(e) =>
                  setForm({ ...form, matched_service: e.target.value })
                }
                className={inputClass}
              >
                <option value="">Select...</option>
                <option value="website">Website</option>
                <option value="chatbots">Chatbots</option>
                <option value="automation">Automation</option>
                <option value="consulting">Consulting</option>
                <option value="custom_ai">Custom AI</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--ink-500)] mb-1">
              Website
            </label>
            <input
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              className={inputClass}
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--ink-500)] mb-1">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className={`${inputClass} resize-none`}
              placeholder="Additional notes..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-[var(--ink-700)] hover:text-[var(--ink-900)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-[var(--ink-900)] rounded-[var(--radius-sm)] hover:bg-[var(--ink-800)] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {saving ? "Adding..." : "Add Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdminLeadsPageContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { theme, toggleTheme } = useAdminTheme();
  const initialStatus = searchParams.get("status") || "all";
  const initialIndustry = searchParams.get("industry");

  const [leads, setLeads] = useState<LeadWithSalesUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [serviceFilter, setServiceFilter] = useState(
    searchParams.get("service") || "all",
  );
  const [websiteFilter, setWebsiteFilter] = useState(
    searchParams.get("website") || "all",
  );
  const [sourceFilter, setSourceFilter] = useState(
    searchParams.get("source") || "all",
  );
  const [industryFilter, setIndustryFilter] = useState<string | null>(
    initialIndustry,
  );
  const [page, setPage] = useState(() => Number(searchParams.get("page")) || 1);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [showAddLead, setShowAddLead] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkPendingLost, setBulkPendingLost] = useState(false);
  const [reps, setReps] = useState<{ id: string; name: string }[]>([]);
  const limit = 50;

  const handleIndustrySelect = useCallback((industry: string | null) => {
    setIndustryFilter(industry);
    setPage(1);
  }, []);

  // Fetch all status counts in one request (the server fans out internally).
  const fetchStatusCounts = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        exclude_phone_prefix: HOTLINE_PHONE_PREFIX_PARAM,
      });
      if (serviceFilter !== "all") params.set("service", serviceFilter);
      if (websiteFilter !== "all") params.set("has_website", websiteFilter);
      if (sourceFilter !== "all") params.set("has_source", sourceFilter);
      if (industryFilter) params.set("industry", industryFilter);
      const res = await fetch(`/api/admin/leads/counts?${params.toString()}`);
      if (!res.ok) return;
      const result = await res.json();
      setStatusCounts(result.data || {});
    } catch {
      /* ignore */
    }
  }, [serviceFilter, websiteFilter, sourceFilter, industryFilter]);

  // Roster of reps for the bulk "Assign to…" control (admin-only page).
  useEffect(() => {
    fetch("/api/admin/sales-users")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.data) {
          const users = j.data as { id: string; name: string; role?: string }[];
          setReps(users.filter((u) => u.role !== "admin"));
        }
      })
      .catch(() => {});
  }, []);

  const debouncedSearch = useDebounce(search, 350);

  const fetchLeads = useCallback(async () => {
    try {
      setIsLoading(true);
      setSelected(new Set());
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (serviceFilter !== "all") params.set("service", serviceFilter);
      if (websiteFilter !== "all") params.set("has_website", websiteFilter);
      if (sourceFilter !== "all") params.set("has_source", sourceFilter);
      if (industryFilter) params.set("industry", industryFilter);
      if (debouncedSearch) params.set("search", debouncedSearch);
      params.set("page", page.toString());
      params.set("limit", limit.toString());
      params.set("exclude_phone_prefix", HOTLINE_PHONE_PREFIX_PARAM);

      const res = await fetch(`/api/admin/leads?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch leads");
      const result = await res.json();
      setLeads(result.data || []);
      setTotal(result.meta?.total || 0);
    } catch {
      setError("Failed to load leads");
    } finally {
      setIsLoading(false);
    }
  }, [
    statusFilter,
    serviceFilter,
    websiteFilter,
    sourceFilter,
    industryFilter,
    debouncedSearch,
    page,
  ]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Mirror filters + page into the URL via history.replaceState (not
  // router.replace — Next 16 doesn't restore that on Back) so the lead-detail
  // "Back to Leads" (router.back) returns to the same filtered view.
  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (serviceFilter !== "all") params.set("service", serviceFilter);
    if (websiteFilter !== "all") params.set("website", websiteFilter);
    if (sourceFilter !== "all") params.set("source", sourceFilter);
    if (industryFilter) params.set("industry", industryFilter);
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
  }, [
    statusFilter,
    serviceFilter,
    websiteFilter,
    sourceFilter,
    industryFilter,
    debouncedSearch,
    page,
    pathname,
  ]);

  useEffect(() => {
    fetchStatusCounts();
  }, [fetchStatusCounts]);

  const updateLead = async (id: string, updates: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/admin/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update");
      const result = await res.json();
      // Use server response to update local state (preserves all fields including notes)
      setLeads((prev) =>
        prev.map((l) =>
          l.id === id ? ({ ...l, ...result.data } as LeadWithSalesUser) : l,
        ),
      );
      // Refresh counts if status changed
      if ("status" in updates) fetchStatusCounts();
    } catch {
      setError("Failed to update lead");
    }
  };

  const deleteLead = async (id: string) => {
    if (!confirm("Delete this lead?")) return;
    try {
      const res = await fetch(`/api/admin/leads/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setLeads((prev) => prev.filter((l) => l.id !== id));
      setTotal((t) => t - 1);
    } catch {
      setError("Failed to delete lead");
    }
  };

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allOnPageSelected =
    leads.length > 0 && leads.every((l) => selected.has(l.id));
  const toggleSelectAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) leads.forEach((l) => next.delete(l.id));
      else leads.forEach((l) => next.add(l.id));
      return next;
    });

  const runBulkStatus = async (status: string, lost_reason?: string) => {
    const leadIds = Array.from(selected);
    try {
      const res = await fetch("/api/admin/leads/bulk-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadIds,
          status,
          ...(lost_reason ? { lost_reason } : {}),
        }),
      });
      if (!res.ok) throw new Error();
      fetchLeads();
      fetchStatusCounts();
    } catch {
      setError("Bulk status update failed");
    }
  };

  const handleBulkStatus = (status: string) => {
    if (status === "lost") setBulkPendingLost(true);
    else runBulkStatus(status);
  };

  const runBulkDelete = async () => {
    const leadIds = Array.from(selected);
    if (
      !confirm(
        `Delete ${leadIds.length} lead${leadIds.length === 1 ? "" : "s"}? This cannot be undone.`,
      )
    )
      return;
    try {
      const res = await fetch("/api/admin/leads/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds }),
      });
      if (!res.ok) throw new Error();
      fetchLeads();
      fetchStatusCounts();
    } catch {
      setError("Bulk delete failed");
    }
  };

  const runBulkAssign = async (salesUserId: string | null) => {
    const leadIds = Array.from(selected);
    try {
      const res = await fetch("/api/admin/leads/reassign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds, salesUserId }),
      });
      if (!res.ok) throw new Error();
      fetchLeads();
      fetchStatusCounts();
    } catch {
      setError("Bulk assign failed");
    }
  };

  const applyView = (f: {
    status: string;
    service: string;
    website: string;
    source: string;
    industry: string | null;
    search: string;
  }) => {
    setStatusFilter(f.status);
    setServiceFilter(f.service);
    setWebsiteFilter(f.website);
    setSourceFilter(f.source);
    handleIndustrySelect(f.industry);
    setSearch(f.search);
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-[-0.022em] text-[var(--ink-900)] sm:text-2xl">
            Sales Leads
          </h1>
          <p className="mt-1 text-[13px] text-[var(--ink-500)]">
            {total} total leads across the pipeline.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
            className="inline-flex items-center justify-center w-10 h-10 text-[var(--ink-700)] bg-[var(--bg-surface)] border border-[var(--allone-line)] rounded-[var(--radius-sm)] shadow-[var(--shadow-xs)] hover:border-[var(--allone-line-strong)] active:scale-[0.98] transition-all duration-150"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
          <Link
            href="/admin/leads/analytics"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--ink-700)] bg-[var(--bg-surface)] border border-[var(--allone-line)] rounded-[var(--radius-sm)] shadow-[var(--shadow-xs)] hover:border-[var(--allone-line-strong)] active:scale-[0.98] transition-all duration-150"
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </Link>
          <button
            onClick={() => setShowAddLead(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--ink-900)] rounded-[var(--radius-sm)] shadow-[var(--shadow-xs)] hover:bg-[var(--ink-800)] active:scale-[0.98] transition-all duration-150"
          >
            Add Lead
          </button>
        </div>
      </div>

      {showAddLead && (
        <AddLeadModal
          onClose={() => setShowAddLead(false)}
          onAdded={() => {
            fetchLeads();
            fetchStatusCounts();
          }}
        />
      )}

      {error && (
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-[var(--radius-sm)] text-red-600 text-sm">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError("")}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter card — non-sticky now that the BF main island handles its own scroll */}
      <div className="rounded-[var(--radius-md)] border border-[var(--allone-line)] bg-[var(--bg-surface)] p-3 shadow-[var(--shadow-xs)] space-y-3">
        {/* Status Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setStatusFilter("all");
              setPage(1);
            }}
            className={`px-3 py-2 rounded-[var(--radius-sm)] text-xs font-medium transition-all ${
              statusFilter === "all"
                ? "bg-[var(--ink-900)] text-white shadow-[var(--shadow-xs)]"
                : "bg-[var(--bg-surface)] border border-[var(--allone-line)] text-[var(--ink-700)] hover:border-[var(--allone-line-strong)]"
            }`}
          >
            <span className="text-base font-semibold mr-1.5">
              {statusCounts.all ?? "-"}
            </span>
            All
          </button>
          {LEAD_STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => {
                setStatusFilter(s.value);
                setPage(1);
              }}
              className={`px-3 py-2 rounded-[var(--radius-sm)] text-xs font-medium transition-all ${
                statusFilter === s.value
                  ? "bg-[var(--ink-900)] text-white shadow-[var(--shadow-xs)]"
                  : "bg-[var(--bg-surface)] border border-[var(--allone-line)] text-[var(--ink-700)] hover:border-[var(--allone-line-strong)]"
              }`}
            >
              <span className="text-base font-semibold mr-1.5">
                {statusCounts[s.value] ?? "-"}
              </span>
              {s.label}
            </button>
          ))}
        </div>

        {/* Filter row — website + source + service + category, all on one line */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={websiteFilter}
            onChange={(e) => {
              setWebsiteFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-sm rounded-[var(--radius-sm)] bg-[var(--bg-surface)] border border-[var(--allone-line)] focus:border-gray-400 focus:outline-none cursor-pointer"
          >
            <option value="all">All Leads</option>
            <option value="yes">Has Website</option>
            <option value="no">No Website</option>
          </select>
          <select
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-sm rounded-[var(--radius-sm)] bg-[var(--bg-surface)] border border-[var(--allone-line)] focus:border-gray-400 focus:outline-none cursor-pointer"
          >
            <option value="all">All Sources</option>
            <option value="yes">Has Source / Facebook</option>
            <option value="no">No Source / Facebook</option>
          </select>
          <select
            value={serviceFilter}
            onChange={(e) => {
              setServiceFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-sm rounded-[var(--radius-sm)] bg-[var(--bg-surface)] border border-[var(--allone-line)] focus:border-gray-400 focus:outline-none cursor-pointer"
          >
            <option value="all">All Services</option>
            <option value="website">Website</option>
            <option value="chatbots">Chatbots</option>
            <option value="automation">Automation</option>
            <option value="consulting">Consulting</option>
            <option value="custom_ai">Custom AI</option>
          </select>
          <HotLinesDropdown
            selectedIndustry={industryFilter}
            onSelect={handleIndustrySelect}
            excludePhonePrefix={HOTLINE_PHONE_PREFIX_PARAM}
            endpoint="/api/admin/leads/industries"
            label="All Categories"
            icon={Tag}
            iconClassName="text-sky-500"
            activeClassName="bg-sky-500 text-white shadow-[var(--shadow-xs)]"
          />
          {(serviceFilter !== "all" || industryFilter) && (
            <button
              onClick={() => {
                setServiceFilter("all");
                handleIndustrySelect(null);
                setPage(1);
              }}
              className="text-xs text-[var(--ink-500)] hover:text-[var(--ink-900)]"
            >
              Clear
            </button>
          )}
          <div className="ml-auto">
            <SavedViews
              storageKey="allone:admin-lead-views"
              current={{
                status: statusFilter,
                service: serviceFilter,
                website: websiteFilter,
                source: sourceFilter,
                industry: industryFilter,
                search,
              }}
              onApply={applyView}
            />
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ink-400)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, email, phone, company, city..."
            className="w-full pl-10 pr-10 py-2.5 text-sm rounded-[var(--radius-sm)] bg-[var(--bg-surface)] border border-[var(--allone-line)] focus:border-gray-400 focus:outline-none transition-colors"
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
      </div>

      {/* Bulk-select bar */}
      {!isLoading && leads.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 rounded-[var(--radius-md)] border border-[var(--allone-line)] bg-[var(--bg-surface)] px-3 sm:px-4 py-2.5 shadow-[var(--shadow-xs)]">
          <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-[var(--ink-700)]">
            <input
              type="checkbox"
              checked={allOnPageSelected}
              onChange={toggleSelectAll}
              className="h-4 w-4 accent-[var(--ao-accent)]"
            />
            {selected.size > 0
              ? `${selected.size} selected`
              : "Select all on page"}
          </label>
          {selected.size > 0 && (
            <>
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) handleBulkStatus(e.target.value);
                }}
                className="px-3 py-1.5 text-xs rounded-[var(--radius-sm)] bg-[var(--bg-surface)] border border-[var(--allone-line)] cursor-pointer"
              >
                <option value="">Set status…</option>
                {LEAD_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <select
                value=""
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "__unassign__") runBulkAssign(null);
                  else if (v) runBulkAssign(v);
                }}
                className="px-3 py-1.5 text-xs rounded-[var(--radius-sm)] bg-[var(--bg-surface)] border border-[var(--allone-line)] cursor-pointer"
              >
                <option value="">Assign to…</option>
                {reps.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
                <option value="__unassign__">— Unassign —</option>
              </select>
              <button
                onClick={runBulkDelete}
                className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="ml-auto text-xs text-[var(--ink-500)] hover:text-[var(--ink-900)]"
              >
                Clear
              </button>
            </>
          )}
        </div>
      )}
      <LostReasonPicker
        open={bulkPendingLost}
        onClose={() => setBulkPendingLost(false)}
        onPick={(reason) => {
          setBulkPendingLost(false);
          runBulkStatus("lost", reason);
        }}
      />

      {/* Leads List */}
      {isLoading ? (
        <div className="space-y-1.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <LeadCardSkeleton key={i} />
          ))}
        </div>
      ) : leads.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No leads found"
          description={
            search || statusFilter !== "all"
              ? "Try adjusting your filters."
              : "No leads yet. They will appear here when scraped or submitted via contact form."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--allone-line)] bg-[var(--bg-surface)] shadow-[var(--shadow-xs)]">
          {leads.map((lead, idx) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              basePath="/admin/leads"
              variant="row"
              className={
                idx > 0 ? "border-t border-[var(--allone-line-soft)]" : ""
              }
              selectable
              selected={selected.has(lead.id)}
              onSelectToggle={() => toggleSelect(lead.id)}
              actions={
                <>
                  <StatusDropdown
                    currentStatus={lead.status}
                    onSelect={(status, extra) =>
                      updateLead(lead.id, { status, ...extra })
                    }
                  />
                  <LeadNotes
                    leadId={lead.id}
                    initialNotes={lead.notes || ""}
                    onSave={(id, notes) => updateLead(id, { notes })}
                  />
                  <button
                    onClick={() => deleteLead(lead.id)}
                    className="p-1 rounded hover:bg-red-50 text-[var(--ink-400)] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              }
            />
          ))}

          {/* Pagination */}
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

export default function AdminLeadsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="w-5 h-5 border-2 border-[var(--allone-line)] border-t-gray-900 rounded-full animate-spin" />
        </div>
      }
    >
      <AdminLeadsPageContent />
    </Suspense>
  );
}
