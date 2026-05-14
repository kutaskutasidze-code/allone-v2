'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X, Flame, ChevronDown, MessageSquare, ExternalLink, Phone, Mail, Globe, Trash2 } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/admin';
import { LEAD_STATUSES, LEAD_STATUS_STYLES } from '@/lib/validations/leads';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { HotLinesDropdown } from '../HotLinesDropdown';

const HOTLINE_SOURCE = 'infoshop.ge';

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

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

function HotLinesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const initialStatus = searchParams.get('status') || 'all';
  const initialIndustry = searchParams.get('industry');

  const [leads, setLeads] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [industryFilter, setIndustryFilter] = useState<string | null>(initialIndustry);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const limit = 50;

  const debouncedSearch = useDebounce(search, 350);

  const handleIndustrySelect = useCallback((industry: string | null) => {
    setIndustryFilter(industry);
    setPage(1);
    const params = new URLSearchParams(searchParams.toString());
    if (industry) params.set('industry', industry);
    else params.delete('industry');
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [router, pathname, searchParams]);

  const fetchLeads = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.set('source', HOTLINE_SOURCE);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (industryFilter) params.set('industry', industryFilter);
      if (debouncedSearch) params.set('search', debouncedSearch);
      params.set('page', page.toString());
      params.set('limit', limit.toString());

      const res = await fetch(`/api/sales/leads?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch leads');
      const result = await res.json();
      setLeads(result.data || []);
      setTotal(result.pagination?.total || 0);
    } catch {
      setError('Failed to load leads');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, industryFilter, debouncedSearch, page]);

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
      <PageHeader
        title="Hot Lines"
        description={`${total.toLocaleString()} ${industryFilter ? industryFilter + ' · ' : ''}hotline leads`}
      />

      {error && (
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <HotLinesDropdown selectedIndustry={industryFilter} onSelect={handleIndustrySelect} sourceFilter={HOTLINE_SOURCE} />
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

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name, email, phone, company..."
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
        <EmptyState icon={Flame} title="No hotline leads" description={search || industryFilter || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'Import the CSV files to populate this list.'} />
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
                      <h3 className="font-medium text-sm text-gray-900 truncate">{l.name as string}</h3>
                      {l.company && l.company !== l.name && (
                        <span className="text-xs text-gray-500">· {l.company as string}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {l.email && (
                        <a href={`mailto:${l.email}`} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                          <Mail className="w-3 h-3" />{l.email as string}
                        </a>
                      )}
                      {l.phone && (
                        <a href={`tel:${l.phone}`} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                          <Phone className="w-3 h-3" />{l.phone as string}
                        </a>
                      )}
                      {l.website && (
                        <a href={l.website as string} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600">
                          <Globe className="w-3 h-3" />Website
                        </a>
                      )}
                      {l.source_url && (
                        <a href={l.source_url as string} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600">
                          <ExternalLink className="w-3 h-3" />Source
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                      {l.industry && <span>{l.industry as string}</span>}
                      {l.city && <span>· {l.city as string}</span>}
                      <span>· {formatDate(l.created_at as string)}</span>
                    </div>
                    {visibleTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {visibleTags.map(tag => (
                          <span key={tag} className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                            {tag}
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
              <span className="text-xs text-gray-500">{total.toLocaleString()} leads</span>
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

export default function HotLinesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      </div>
    }>
      <HotLinesPageContent />
    </Suspense>
  );
}
