'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X, Users, ChevronDown, MessageSquare, ExternalLink, Phone, Mail, Globe, Trash2, BarChart3 } from 'lucide-react';
import { EmptyState } from '@/components/admin';
import { LEAD_STATUSES, LEAD_STATUS_STYLES, HOTLINE_PHONE_PREFIX } from '@/lib/validations/leads';
import { useDebounce } from '@/lib/hooks/useDebounce';
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
          <div className="absolute top-full left-0 mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg shadow-black/[0.08] py-1 min-w-[120px]">
            {LEAD_STATUSES.map(s => (
              <button
                key={s.value}
                onClick={() => { onUpdate(leadId, s.value); setOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors ${currentStatus === s.value ? 'font-semibold' : ''}`}
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
      <button onClick={() => setOpen(!open)} className="p-1 rounded hover:bg-gray-50 text-gray-400 hover:text-gray-900 transition-colors" title="Notes">
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
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
              <textarea
                value={notes}
                onChange={e => { setNotes(e.target.value); setSaved(false); }}
                onBlur={handleSave}
                placeholder="Add notes about this lead..."
                rows={2}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:border-gray-400 focus:outline-none resize-none"
              />
              <div className="flex justify-end gap-2 mt-2">
                <button onClick={() => setOpen(false)} className="px-3 py-1 text-xs text-gray-500 hover:text-gray-900">Close</button>
                <button
                  onClick={() => { handleSave(); setOpen(false); }}
                  className={`px-3 py-1 text-xs rounded-md ${saved ? 'bg-gray-200 text-gray-500' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
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

  const inputClass = "w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:border-gray-400 focus:outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-white rounded-xl shadow-xl shadow-black/[0.08] p-6 mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold text-gray-900">Add Lead</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">{formError}</div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Name *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className={inputClass} placeholder="Business name" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputClass} placeholder="+995..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} placeholder="email@company.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Company</label>
              <input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className={inputClass} placeholder="Company name" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">City</label>
              <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className={inputClass} placeholder="Tbilisi" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Service</label>
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
            <label className="block text-xs font-medium text-gray-500 mb-1">Website</label>
            <input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} className={inputClass} placeholder="https://..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className={`${inputClass} resize-none`} placeholder="Additional notes..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-50">
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
  const initialStatus = searchParams.get('status') || 'all';

  const [leads, setLeads] = useState<LeadWithSalesUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [serviceFilter, setServiceFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [showAddLead, setShowAddLead] = useState(false);
  const [error, setError] = useState('');
  const limit = 50;

  // Fetch status counts separately (always unfiltered)
  const fetchStatusCounts = useCallback(async () => {
    try {
      const statuses = LEAD_STATUSES.map(s => s.value);
      const excludeParam = `exclude_phone_prefix=${encodeURIComponent(HOTLINE_PHONE_PREFIX)}`;
      const [allRes, ...statusResults] = await Promise.all([
        fetch(`/api/admin/leads?limit=1&${excludeParam}`).then(r => r.ok ? r.json() : null),
        ...statuses.map(s => fetch(`/api/admin/leads?status=${s}&limit=1&${excludeParam}`).then(r => r.ok ? r.json() : null)),
      ]);

      const counts: Record<string, number> = { all: allRes?.meta?.total || 0 };
      statuses.forEach((s, i) => { counts[s] = statusResults[i]?.meta?.total || 0; });
      setStatusCounts(counts);
    } catch { /* ignore */ }
  }, []);

  const debouncedSearch = useDebounce(search, 350);

  const fetchLeads = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (serviceFilter !== 'all') params.set('service', serviceFilter);
      if (debouncedSearch) params.set('search', debouncedSearch);
      params.set('page', page.toString());
      params.set('limit', limit.toString());
      params.set('exclude_phone_prefix', HOTLINE_PHONE_PREFIX);

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
  }, [statusFilter, serviceFilter, debouncedSearch, page]);

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
          <h1 className="text-xl font-semibold tracking-tight text-gray-900 font-display">Sales Leads</h1>
          <p className="mt-1.5 text-sm text-gray-500">{total} total leads</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/leads/analytics"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-gray-300 active:scale-[0.98] transition-all duration-150"
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </Link>
          <button
            onClick={() => setShowAddLead(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm hover:bg-gray-800 active:scale-[0.98] transition-all duration-150"
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
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => { setStatusFilter('all'); setPage(1); }}
          className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            statusFilter === 'all'
              ? 'bg-gray-900 text-white shadow-sm'
              : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
          <span className="text-base font-semibold mr-1.5">{statusCounts.all ?? '-'}</span>
          All
        </button>
        {LEAD_STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => { setStatusFilter(s.value); setPage(1); }}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              statusFilter === s.value
                ? 'bg-gray-900 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            <span className="text-base font-semibold mr-1.5">{statusCounts[s.value] ?? '-'}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* Service Filter */}
      <div className="flex items-center gap-3">
        <select
          value={serviceFilter}
          onChange={(e) => { setServiceFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:border-gray-400 focus:outline-none cursor-pointer"
        >
          <option value="all">All Services</option>
          <option value="website">Website</option>
          <option value="chatbots">Chatbots</option>
          <option value="automation">Automation</option>
          <option value="consulting">Consulting</option>
          <option value="custom_ai">Custom AI</option>
        </select>
        {serviceFilter !== 'all' && (
          <button onClick={() => { setServiceFilter('all'); setPage(1); }} className="text-xs text-gray-500 hover:text-gray-900">
            Clear
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name, email, phone, company, city..."
          className="w-full pl-10 pr-10 py-2.5 text-sm rounded-lg bg-white border border-gray-200 focus:border-gray-400 focus:outline-none transition-colors"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Leads List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
        </div>
      ) : leads.length === 0 ? (
        <EmptyState icon={Users} title="No leads found" description={search || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'No leads yet. They will appear here when scraped or submitted via contact form.'} />
      ) : (
        <div className="space-y-1.5">
          {leads.map((lead) => (
            <div
              key={lead.id}
              className="group bg-white border border-gray-100 rounded-xl p-4 shadow-sm shadow-black/[0.02] hover:shadow-md hover:shadow-black/[0.04] transition-shadow duration-200"
            >
              <div className="flex items-start justify-between gap-3">
                {/* Lead info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-sm text-gray-900 truncate">{lead.company || lead.name}</h3>
                    {lead.industry && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-medium">{lead.industry}</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {lead.phone && (
                      <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                        <Phone className="w-3 h-3" />{lead.phone}
                      </a>
                    )}
                    {lead.email && (
                      <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                        <Mail className="w-3 h-3" />{lead.email}
                      </a>
                    )}
                    {lead.website && !/infoshop\.ge/i.test(lead.website) ? (
                      <a href={lead.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-green-600 hover:underline">
                        <Globe className="w-3 h-3" />Website
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-red-400"><Globe className="w-3 h-3" />No website</span>
                    )}
                    {lead.facebook_url && (
                      <a href={lead.facebook_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline">
                        <ExternalLink className="w-3 h-3" />Facebook
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
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
                    <div className="mt-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2 whitespace-pre-wrap">
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
                    className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
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
              <span className="text-xs text-gray-500">
                {total} leads
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                >
                  First
                </button>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                >
                  Prev
                </button>
                <div className="flex items-center gap-1 text-xs text-gray-500">
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
                    className="w-12 py-1.5 text-center text-xs rounded-lg border border-gray-200 focus:border-gray-400 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span>of {totalPages}</span>
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                >
                  Next
                </button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-colors"
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
        <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      </div>
    }>
      <AdminLeadsPageContent />
    </Suspense>
  );
}
