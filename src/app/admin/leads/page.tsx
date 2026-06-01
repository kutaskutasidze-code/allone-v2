'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X, Users, ChevronDown, MessageSquare, ExternalLink, Phone, Mail, Globe, Trash2, BarChart3, Tag, Sun, Moon } from 'lucide-react';
import { EmptyState } from '@/components/admin';
import { LEAD_STATUSES, LEAD_STATUS_STYLES, HOTLINE_PHONE_PREFIX_PARAM, INFOSHOP_PATTERN } from '@/lib/validations/leads';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { HotLinesDropdown } from '@/app/sales/leads/HotLinesDropdown';
import { useAdminTheme } from '@/app/admin/AdminThemeContext';
import type { LeadWithSalesUser } from '@/types/database';

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const PITCH_LABELS: Record<string, string> = {
  no_website: 'No website',
  website_broken: 'Website broken',
  no_https: 'Not secure (HTTP)',
  not_mobile_friendly: 'Not mobile-friendly',
  no_chat_widget: 'No chat widget',
  no_online_booking: 'No online booking',
  no_social_links: 'No social media',
  slow_website: 'Slow website',
  basic_website_builder: 'Wix/Tilda site',
  new_business: 'New business',
  newly_registered: 'Newly registered',
};

const HIDDEN_TAGS = new Set(['enrich_attempted', 'website_audited']);

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

function StatusDropdown({ leadId, currentStatus, onUpdate }: { leadId: string; currentStatus: string; onUpdate: (id: string, status: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full cursor-pointer ${LEAD_STATUS_STYLES[currentStatus]}`}
      >
        {LEAD_STATUSES.find(s => s.value === currentStatus)?.label}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-20 bg-[var(--bg-surface)] border border-[var(--allone-line)] rounded-[var(--radius-sm)] shadow-[var(--shadow-md)] shadow-black/[0.08] py-1 min-w-[120px]">
            {LEAD_STATUSES.map(s => (
              <button
                key={s.value}
                onClick={() => { onUpdate(leadId, s.value); setOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--bg-surface-alt)] transition-colors ${currentStatus === s.value ? 'font-semibold' : ''}`}
              >
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${LEAD_STATUS_STYLES[s.value]?.split(' ')[0]}`} />
                {s.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function LeadNotes({ leadId, initialNotes, onSave }: { leadId: string; initialNotes: string; onSave: (id: string, notes: string) => void }) {
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
      <button onClick={() => setOpen(!open)} className="p-1 rounded hover:bg-[var(--bg-surface-alt)] text-[var(--ink-400)] hover:text-[var(--ink-900)] transition-colors" title="Notes">
        <MessageSquare className="w-3.5 h-3.5" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="col-span-full overflow-hidden"
          >
            <div className="px-4 py-3 bg-[var(--bg-surface-alt)] border-t border-[var(--allone-line-soft)]">
              <textarea
                value={notes}
                onChange={e => { setNotes(e.target.value); setSaved(false); }}
                onBlur={handleSave}
                placeholder="Add notes about this lead..."
                rows={2}
                className="w-full px-3 py-2 text-sm bg-[var(--bg-surface)] border border-[var(--allone-line)] rounded-[var(--radius-sm)] focus:border-gray-400 focus:outline-none resize-none"
              />
              <div className="flex justify-end gap-2 mt-2">
                <button onClick={() => setOpen(false)} className="px-3 py-1 text-xs text-[var(--ink-500)] hover:text-[var(--ink-900)]">Close</button>
                <button
                  onClick={() => { handleSave(); setOpen(false); }}
                  className={`px-3 py-1 text-xs rounded-[var(--radius-xs)] ${saved ? 'bg-[var(--bg-sunken)] text-[var(--ink-500)]' : 'bg-[var(--ink-900)] text-white hover:bg-[var(--ink-800)]'}`}
                >
                  {saved ? 'Saved' : 'Save'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function AddLeadModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', company: '', city: '', website: '', matched_service: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', handleEsc); };
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    setSaving(true);
    setFormError('');
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, country: 'GE' }),
      });
      if (!res.ok) throw new Error('Failed');
      onAdded();
      onClose();
    } catch {
      setFormError('Failed to create lead');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full px-3 py-2 text-sm bg-[var(--bg-surface)] border border-[var(--allone-line)] rounded-[var(--radius-sm)] focus:border-gray-400 focus:outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-[var(--bg-surface)] rounded-[var(--radius-md)] shadow-xl shadow-black/[0.08] p-6 mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold text-[var(--ink-900)]">Add Lead</h2>
          <button onClick={onClose} className="text-[var(--ink-400)] hover:text-[var(--ink-900)]"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-[var(--radius-sm)] text-red-600 text-sm">{formError}</div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--ink-500)] mb-1">Name *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className={inputClass} placeholder="Business name" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ink-500)] mb-1">Phone</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputClass} placeholder="+995..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--ink-500)] mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} placeholder="email@company.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ink-500)] mb-1">Company</label>
              <input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className={inputClass} placeholder="Company name" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--ink-500)] mb-1">City</label>
              <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className={inputClass} placeholder="Tbilisi" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ink-500)] mb-1">Service</label>
              <select value={form.matched_service} onChange={e => setForm({ ...form, matched_service: e.target.value })} className={inputClass}>
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
            <label className="block text-xs font-medium text-[var(--ink-500)] mb-1">Website</label>
            <input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} className={inputClass} placeholder="https://..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--ink-500)] mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className={`${inputClass} resize-none`} placeholder="Additional notes..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-[var(--ink-700)] hover:text-[var(--ink-900)]">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-[var(--ink-900)] rounded-[var(--radius-sm)] hover:bg-[var(--ink-800)] active:scale-[0.98] transition-all disabled:opacity-50">
              {saving ? 'Adding...' : 'Add Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdminLeadsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useAdminTheme();
  const initialStatus = searchParams.get('status') || 'all';
  const initialIndustry = searchParams.get('industry');

  const [leads, setLeads] = useState<LeadWithSalesUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [serviceFilter, setServiceFilter] = useState('all');
  const [websiteFilter, setWebsiteFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [industryFilter, setIndustryFilter] = useState<string | null>(initialIndustry);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [showAddLead, setShowAddLead] = useState(false);
  const [error, setError] = useState('');
  const limit = 50;

  const handleIndustrySelect = useCallback((industry: string | null) => {
    setIndustryFilter(industry);
    setPage(1);
    const params = new URLSearchParams(searchParams.toString());
    if (industry) params.set('industry', industry);
    else params.delete('industry');
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [router, pathname, searchParams]);

  // Fetch all status counts in one request (the server fans out internally).
  const fetchStatusCounts = useCallback(async () => {
    try {
      const params = new URLSearchParams({ exclude_phone_prefix: HOTLINE_PHONE_PREFIX_PARAM });
      const res = await fetch(`/api/admin/leads/counts?${params.toString()}`);
      if (!res.ok) return;
      const result = await res.json();
      setStatusCounts(result.data || {});
    } catch { /* ignore */ }
  }, []);

  const debouncedSearch = useDebounce(search, 350);

  const fetchLeads = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (serviceFilter !== 'all') params.set('service', serviceFilter);
      if (websiteFilter !== 'all') params.set('has_website', websiteFilter);
      if (sourceFilter !== 'all') params.set('has_source', sourceFilter);
      if (industryFilter) params.set('industry', industryFilter);
      if (debouncedSearch) params.set('search', debouncedSearch);
      params.set('page', page.toString());
      params.set('limit', limit.toString());
      params.set('exclude_phone_prefix', HOTLINE_PHONE_PREFIX_PARAM);

      const res = await fetch(`/api/admin/leads?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch leads');
      const result = await res.json();
      setLeads(result.data || []);
      setTotal(result.meta?.total || 0);
    } catch {
      setError('Failed to load leads');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, serviceFilter, websiteFilter, sourceFilter, industryFilter, debouncedSearch, page]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);
  useEffect(() => { fetchStatusCounts(); }, [fetchStatusCounts]);

  const updateLead = async (id: string, updates: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/admin/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update');
      const result = await res.json();
      // Use server response to update local state (preserves all fields including notes)
      setLeads(prev => prev.map(l => l.id === id ? { ...l, ...result.data } as LeadWithSalesUser : l));
      // Refresh counts if status changed
      if ('status' in updates) fetchStatusCounts();
    } catch {
      setError('Failed to update lead');
    }
  };

  const deleteLead = async (id: string) => {
    if (!confirm('Delete this lead?')) return;
    try {
      const res = await fetch(`/api/admin/leads/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setLeads(prev => prev.filter(l => l.id !== id));
      setTotal(t => t - 1);
    } catch {
      setError('Failed to delete lead');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--ink-900)] font-display">Sales Leads</h1>
          <p className="mt-1.5 text-sm text-[var(--ink-500)]">{total} total leads</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="inline-flex items-center justify-center w-10 h-10 text-[var(--ink-700)] bg-[var(--bg-surface)] border border-[var(--allone-line)] rounded-[var(--radius-sm)] shadow-[var(--shadow-xs)] hover:border-[var(--allone-line-strong)] active:scale-[0.98] transition-all duration-150"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
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
          onAdded={() => { fetchLeads(); fetchStatusCounts(); }}
        />
      )}

      {error && (
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-[var(--radius-sm)] text-red-600 text-sm">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Sticky filter bar — pins to the top of the scroll area on scroll */}
      <div className=" -mx-5 lg:-mx-10 px-5 lg:px-10 py-3 bg-[var(--bg-app)]/90 dark:bg-[var(--ink-900)]/90 backdrop-blur-md border-b border-[var(--allone-line-soft)] dark:border-slate-800 space-y-3">
        {/* Status Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setStatusFilter('all'); setPage(1); }}
            className={`px-3 py-2 rounded-[var(--radius-sm)] text-xs font-medium transition-all ${
              statusFilter === 'all'
                ? 'bg-[var(--ink-900)] text-white shadow-[var(--shadow-xs)]'
                : 'bg-[var(--bg-surface)] border border-[var(--allone-line)] text-[var(--ink-700)] hover:border-[var(--allone-line-strong)]'
            }`}
          >
            <span className="text-base font-semibold mr-1.5">{statusCounts.all ?? '-'}</span>
            All
          </button>
          {LEAD_STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => { setStatusFilter(s.value); setPage(1); }}
              className={`px-3 py-2 rounded-[var(--radius-sm)] text-xs font-medium transition-all ${
                statusFilter === s.value
                  ? 'bg-[var(--ink-900)] text-white shadow-[var(--shadow-xs)]'
                  : 'bg-[var(--bg-surface)] border border-[var(--allone-line)] text-[var(--ink-700)] hover:border-[var(--allone-line-strong)]'
              }`}
            >
              <span className="text-base font-semibold mr-1.5">{statusCounts[s.value] ?? '-'}</span>
              {s.label}
            </button>
          ))}
        </div>

        {/* Filter row — website + source + service + category, all on one line */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={websiteFilter}
            onChange={(e) => { setWebsiteFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm rounded-[var(--radius-sm)] bg-[var(--bg-surface)] border border-[var(--allone-line)] focus:border-gray-400 focus:outline-none cursor-pointer"
          >
            <option value="all">All Leads</option>
            <option value="yes">Has Website</option>
            <option value="no">No Website</option>
          </select>
          <select
            value={sourceFilter}
            onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm rounded-[var(--radius-sm)] bg-[var(--bg-surface)] border border-[var(--allone-line)] focus:border-gray-400 focus:outline-none cursor-pointer"
          >
            <option value="all">All Sources</option>
            <option value="yes">Has Source / Facebook</option>
            <option value="no">No Source / Facebook</option>
          </select>
          <select
            value={serviceFilter}
            onChange={(e) => { setServiceFilter(e.target.value); setPage(1); }}
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
          {(serviceFilter !== 'all' || industryFilter) && (
            <button
              onClick={() => {
                setServiceFilter('all');
                handleIndustrySelect(null);
                setPage(1);
              }}
              className="text-xs text-[var(--ink-500)] hover:text-[var(--ink-900)]"
            >
              Clear
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ink-400)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, email, phone, company, city..."
            className="w-full pl-10 pr-10 py-2.5 text-sm rounded-[var(--radius-sm)] bg-[var(--bg-surface)] border border-[var(--allone-line)] focus:border-gray-400 focus:outline-none transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-400)] hover:text-[var(--ink-900)]">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Leads List */}
      {isLoading ? (
        <div className="space-y-1.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <LeadCardSkeleton key={i} />
          ))}
        </div>
      ) : leads.length === 0 ? (
        <EmptyState icon={Users} title="No leads found" description={search || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'No leads yet. They will appear here when scraped or submitted via contact form.'} />
      ) : (
        <div className="space-y-1.5">
          {leads.map((lead) => (
            <div
              key={lead.id}
              className="group bg-[var(--bg-surface)] border border-[var(--allone-line-soft)] rounded-[var(--radius-md)] p-4 shadow-[var(--shadow-xs)] shadow-black/[0.02] hover:shadow-[var(--shadow-sm)] hover:shadow-black/[0.04] transition-shadow duration-200"
            >
              <div className="flex items-start justify-between gap-3">
                {/* Lead info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-sm text-[var(--ink-900)] truncate">{lead.company || lead.name}</h3>
                    {lead.industry && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-medium">{lead.industry}</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {lead.phone && (
                      <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-1 text-xs text-[var(--ao-accent)] hover:underline">
                        <Phone className="w-3 h-3" />{lead.phone}
                      </a>
                    )}
                    {lead.email && (
                      <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1 text-xs text-[var(--ao-accent)] hover:underline">
                        <Mail className="w-3 h-3" />{lead.email}
                      </a>
                    )}
                    {lead.website && !INFOSHOP_PATTERN.test(lead.website) ? (
                      <a href={lead.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-green-600 hover:underline">
                        <Globe className="w-3 h-3" />Website
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-red-400"><Globe className="w-3 h-3" />No website</span>
                    )}
                    {lead.facebook_url && (
                      <a href={lead.facebook_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-[var(--ao-accent)] hover:underline">
                        <ExternalLink className="w-3 h-3" />Facebook
                      </a>
                    )}
                    {lead.source_url && !INFOSHOP_PATTERN.test(lead.source_url) && (
                      <a href={lead.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-[var(--ink-500)] hover:text-[var(--ao-accent)]">
                        <ExternalLink className="w-3 h-3" />Source
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-[var(--ink-400)]">
                    {lead.city && <span>{lead.city}</span>}
                    {lead.matched_service && <span>· {lead.matched_service}</span>}
                    <span>· {formatDate(lead.created_at)}</span>
                  </div>
                  {/* Pitch reasons */}
                  {lead.tags && lead.tags.filter((t: string) => !HIDDEN_TAGS.has(t)).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {lead.tags.filter((t: string) => !HIDDEN_TAGS.has(t)).map((tag: string) => (
                        <span key={tag} className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                          {PITCH_LABELS[tag] || tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {lead.notes && (
                    <div className="mt-2 text-xs text-[var(--ink-700)] bg-[var(--bg-surface-alt)] rounded-[var(--radius-sm)] px-3 py-2 whitespace-pre-wrap">
                      {lead.notes}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <StatusDropdown
                    leadId={lead.id}
                    currentStatus={lead.status}
                    onUpdate={(id, status) => updateLead(id, { status })}
                  />
                  <LeadNotes
                    leadId={lead.id}
                    initialNotes={lead.notes || ''}
                    onSave={(id, notes) => updateLead(id, { notes })}
                  />
                  <button
                    onClick={() => deleteLead(lead.id)}
                    className="p-1 rounded hover:bg-red-50 text-[var(--ink-400)] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
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
                  onClick={() => setPage(p => Math.max(1, p - 1))}
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
                      if (e.key === 'Enter') {
                        const v = parseInt((e.target as HTMLInputElement).value);
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
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
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

export default function AdminLeadsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-[var(--allone-line)] border-t-gray-900 rounded-full animate-spin" />
      </div>
    }>
      <AdminLeadsPageContent />
    </Suspense>
  );
}
