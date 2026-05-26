'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X, Users, ChevronDown, MessageSquare, ExternalLink, Phone, Mail, Globe, Trash2, Sun, Moon, Inbox, PhoneCall, Layers } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/admin';
import { LEAD_STATUSES, LEAD_STATUS_STYLES, HOTLINE_PHONE_PREFIX_PARAM, INFOSHOP_PATTERN } from '@/lib/validations/leads';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useSalesTheme } from '@/app/sales/SalesThemeContext';
import { CallbackPicker } from '@/components/sales';

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

function StatusDropdown({ leadId, currentStatus, onUpdate, onPickCallback }: { leadId: string; currentStatus: string; onUpdate: (id: string, status: string) => void; onPickCallback: (id: string) => void }) {
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
                onClick={() => {
                  setOpen(false);
                  if (s.value === 'callback') {
                    onPickCallback(leadId);
                  } else {
                    onUpdate(leadId, s.value);
                  }
                }}
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

type ScopeMode = 'today' | 'mine' | 'callbacks' | 'done';

function LeadsPageContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || 'all';
  const { theme, toggleTheme } = useSalesTheme();
  const [callbackForLeadId, setCallbackForLeadId] = useState<string | null>(null);
  const initialScopeParam = searchParams.get('scope');

  const [scopeMode, setScopeMode] = useState<ScopeMode>(
    initialScopeParam === 'today' ? 'today'
      : initialStatus === 'callback' ? 'callbacks'
        : 'mine'
  );

  const [leads, setLeads] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [serviceFilter, setServiceFilter] = useState('all');
  const [websiteFilter, setWebsiteFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const limit = 50;

  const debouncedSearch = useDebounce(search, 350);

  const fetchLeads = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();

      if (scopeMode === 'today') {
        params.set('scope', 'today');
      } else if (scopeMode === 'callbacks') {
        params.set('status', 'callback');
      }

      // Honor an explicit status pill click only when no scope filter overrides it.
      if (scopeMode !== 'today' && scopeMode !== 'callbacks' && statusFilter !== 'all') {
        params.set('status', statusFilter);
      }
      if (serviceFilter !== 'all') params.set('service', serviceFilter);
      if (websiteFilter !== 'all') params.set('has_website', websiteFilter);
      if (sourceFilter !== 'all') params.set('has_source', sourceFilter);
      if (debouncedSearch) params.set('search', debouncedSearch);
      params.set('page', page.toString());
      params.set('limit', limit.toString());
      params.set('exclude_phone_prefix', HOTLINE_PHONE_PREFIX_PARAM);

      const res = await fetch(`/api/sales/leads?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch leads');
      const result = await res.json();
      let data: Record<string, unknown>[] = result.data || [];

      if (scopeMode === 'done') {
        const startOfDay = new Date();
        startOfDay.setUTCHours(0, 0, 0, 0);
        data = data.filter(l => {
          const status = l.status as string;
          const changed = l.status_changed_at as string | undefined;
          return status !== 'new' && changed && new Date(changed) >= startOfDay;
        });
      }

      setLeads(data);
      setTotal(result.pagination?.total || 0);
    } catch {
      setError('Failed to load leads');
    } finally {
      setIsLoading(false);
    }
  }, [scopeMode, statusFilter, serviceFilter, websiteFilter, sourceFilter, debouncedSearch, page]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const updateLead = async (id: string, updates: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/sales/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update');
      const result = await res.json();
      setLeads(prev => prev.map(l => (l as { id: string }).id === id ? { ...l, ...result.data } : l));
    } catch {
      setError('Failed to update lead');
    }
  };

  const deleteLead = async (id: string) => {
    if (!confirm('Delete this lead?')) return;
    try {
      const res = await fetch(`/api/sales/leads/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setLeads(prev => prev.filter(l => (l as { id: string }).id !== id));
      setTotal(t => t - 1);
    } catch {
      setError('Failed to delete lead');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {callbackForLeadId && (
        <CallbackPicker
          onCancel={() => setCallbackForLeadId(null)}
          onPick={(when) => {
            updateLead(callbackForLeadId, { status: 'callback', callback_at: when });
            setCallbackForLeadId(null);
          }}
        />
      )}
      <PageHeader
        title="Leads"
        description={`${total} leads · your pipeline`}
        action={{ label: 'Add Lead', href: '/sales/leads/new' }}
        extras={
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="inline-flex items-center justify-center w-10 h-10 text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-gray-300 active:scale-[0.98] transition-all duration-150"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        }
      />

      {error && (
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Scope chips — high-level view selector for the rep's daily workflow. */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: 'today' as ScopeMode, label: "Today's Queue", icon: Sun },
          { value: 'mine' as ScopeMode, label: 'All Mine', icon: Inbox },
          { value: 'callbacks' as ScopeMode, label: 'Callbacks', icon: PhoneCall },
          { value: 'done' as ScopeMode, label: 'Done Today', icon: Layers },
        ].map(chip => {
          const Icon = chip.icon;
          const active = scopeMode === chip.value;
          return (
            <button
              key={chip.value}
              onClick={() => { setScopeMode(chip.value); setStatusFilter('all'); setPage(1); }}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${active ? 'bg-gray-900 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Status filter (only meaningful within the All-Mine scope) */}
      {scopeMode === 'mine' && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setStatusFilter('all'); setPage(1); }}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${statusFilter === 'all' ? 'bg-gray-900 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}
          >All</button>
          {LEAD_STATUSES.map(s => (
            <button
              key={s.value}
              onClick={() => { setStatusFilter(s.value); setPage(1); }}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${statusFilter === s.value ? 'bg-gray-900 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}
            >{s.label}</button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <select
          value={websiteFilter}
          onChange={(e) => { setWebsiteFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:border-gray-400 focus:outline-none cursor-pointer"
        >
          <option value="all">All Leads</option>
          <option value="yes">Has Website</option>
          <option value="no">No Website</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <select
          value={sourceFilter}
          onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:border-gray-400 focus:outline-none cursor-pointer"
        >
          <option value="all">All Sources</option>
          <option value="yes">Has Source</option>
          <option value="no">No Source</option>
        </select>
      </div>
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
          <button onClick={() => { setServiceFilter('all'); setPage(1); }} className="text-xs text-gray-500 hover:text-gray-900">Clear</button>
        )}
      </div>

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

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
        </div>
      ) : leads.length === 0 ? (
        <EmptyState icon={Users} title="No leads found" description={search || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'No leads yet.'} />
      ) : (
        <div className="space-y-1.5">
          {leads.map((lead) => {
            const l = lead as Record<string, string | number | string[] | null>;
            const tags = (l.tags as string[] | null) || [];
            const visibleTags = tags.filter(t => !HIDDEN_TAGS.has(t));
            return (
              <div
                key={l.id as string}
                className="group bg-white border border-gray-100 rounded-xl p-4 shadow-sm shadow-black/[0.02] hover:shadow-md hover:shadow-black/[0.04] transition-shadow duration-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-sm text-gray-900 truncate">{(l.company || l.name) as string}</h3>
                      {l.industry && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-medium">{l.industry as string}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {l.phone && (
                        <a href={`tel:${l.phone}`} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                          <Phone className="w-3 h-3" />{l.phone as string}
                        </a>
                      )}
                      {l.email && (
                        <a href={`mailto:${l.email}`} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                          <Mail className="w-3 h-3" />{l.email as string}
                        </a>
                      )}
                      {l.website && !INFOSHOP_PATTERN.test(l.website as string) ? (
                        <a href={l.website as string} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-green-600 hover:underline">
                          <Globe className="w-3 h-3" />Website
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-red-400"><Globe className="w-3 h-3" />No website</span>
                      )}
                      {l.facebook_url && (
                        <a href={l.facebook_url as string} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline">
                          <ExternalLink className="w-3 h-3" />Facebook
                        </a>
                      )}
                      {l.source_url && !INFOSHOP_PATTERN.test(l.source_url as string) && (
                        <a href={l.source_url as string} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600">
                          <ExternalLink className="w-3 h-3" />Source
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                      {l.city && <span>{l.city as string}</span>}
                      {l.matched_service && <span>· {l.matched_service as string}</span>}
                      <span>· {formatDate(l.created_at as string)}</span>
                    </div>
                    {visibleTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {visibleTags.map(tag => (
                          <span key={tag} className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                            {PITCH_LABELS[tag] || tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {l.notes && (
                      <div className="mt-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2 whitespace-pre-wrap">
                        {l.notes as string}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <StatusDropdown
                      leadId={l.id as string}
                      currentStatus={l.status as string}
                      onUpdate={(id, status) => updateLead(id, { status })}
                      onPickCallback={(id) => setCallbackForLeadId(id)}
                    />
                    <LeadNotes
                      leadId={l.id as string}
                      initialNotes={(l.notes as string) || ''}
                      onSave={(id, notes) => updateLead(id, { notes })}
                    />
                    <button
                      onClick={() => deleteLead(l.id as string)}
                      className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
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
              <span className="text-xs text-gray-500">{total} leads</span>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setPage(1)} disabled={page === 1} className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-colors">First</button>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-colors">Prev</button>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <input
                    type="number" min={1} max={totalPages} defaultValue={page} key={page}
                    onKeyDown={(e) => { if (e.key === 'Enter') { const v = parseInt((e.target as HTMLInputElement).value); if (v >= 1 && v <= totalPages) setPage(v); } }}
                    onBlur={(e) => { const v = parseInt(e.target.value); if (v >= 1 && v <= totalPages) setPage(v); }}
                    className="w-12 py-1.5 text-center text-xs rounded-lg border border-gray-200 focus:border-gray-400 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span>of {totalPages}</span>
                </div>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-colors">Next</button>
                <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-colors">Last</button>
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
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      </div>
    }>
      <LeadsPageContent />
    </Suspense>
  );
}
