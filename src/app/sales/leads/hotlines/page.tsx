'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X, Flame, ChevronDown, MessageSquare, ExternalLink, Phone, Mail, Globe } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/admin';
import { LEAD_STATUSES, LEAD_STATUS_STYLES, HOTLINE_PHONE_PREFIX_PARAM, INFOSHOP_PATTERN } from '@/lib/validations/leads';
import { safeHttpUrl } from '@/lib/utils';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { HotLinesDropdown } from '../HotLinesDropdown';

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
  const [websiteFilter, setWebsiteFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
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
      params.set('phone_prefix', HOTLINE_PHONE_PREFIX_PARAM);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (industryFilter) params.set('industry', industryFilter);
      if (websiteFilter !== 'all') params.set('has_website', websiteFilter);
      if (sourceFilter !== 'all') params.set('has_source', sourceFilter);
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
  }, [statusFilter, industryFilter, websiteFilter, sourceFilter, debouncedSearch, page]);

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

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hot Lines"
        description={`${total.toLocaleString()} ${industryFilter ? industryFilter + ' · ' : ''}hotline leads`}
      />

      {error && (
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-[var(--radius-sm)] text-red-600 text-sm">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <select
          value={websiteFilter}
          onChange={(e) => { setWebsiteFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-xs rounded-[var(--radius-sm)] bg-[var(--bg-surface)] border border-[var(--allone-line)] focus:border-gray-400 focus:outline-none cursor-pointer font-medium"
        >
          <option value="all">All Leads</option>
          <option value="yes">Has Website</option>
          <option value="no">No Website</option>
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-xs rounded-[var(--radius-sm)] bg-[var(--bg-surface)] border border-[var(--allone-line)] focus:border-gray-400 focus:outline-none cursor-pointer font-medium"
        >
          <option value="all">Any source</option>
          <option value="yes">Has source (web / FB / maps)</option>
          <option value="no">No source</option>
        </select>
        <HotLinesDropdown selectedIndustry={industryFilter} onSelect={handleIndustrySelect} phonePrefix={HOTLINE_PHONE_PREFIX_PARAM} />
        <button
          onClick={() => { setStatusFilter('all'); setPage(1); }}
          className={`px-3 py-2 rounded-[var(--radius-sm)] text-xs font-medium transition-all ${statusFilter === 'all' ? 'bg-[var(--ink-900)] text-white shadow-[var(--shadow-xs)]' : 'bg-[var(--bg-surface)] border border-[var(--allone-line)] text-[var(--ink-700)] hover:border-[var(--allone-line-strong)]'}`}
        >All</button>
        {LEAD_STATUSES.map(s => (
          <button
            key={s.value}
            onClick={() => { setStatusFilter(s.value); setPage(1); }}
            className={`px-3 py-2 rounded-[var(--radius-sm)] text-xs font-medium transition-all ${statusFilter === s.value ? 'bg-[var(--ink-900)] text-white shadow-[var(--shadow-xs)]' : 'bg-[var(--bg-surface)] border border-[var(--allone-line)] text-[var(--ink-700)] hover:border-[var(--allone-line-strong)]'}`}
          >{s.label}</button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ink-400)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name, email, phone, company..."
          className="w-full pl-10 pr-10 py-2.5 text-sm rounded-[var(--radius-sm)] bg-[var(--bg-surface)] border border-[var(--allone-line)] focus:border-gray-400 focus:outline-none transition-colors"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-400)] hover:text-[var(--ink-900)]">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-5 h-5 border-2 border-[var(--allone-line)] border-t-gray-900 rounded-full animate-spin" />
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
                className="group bg-[var(--bg-surface)] border border-[var(--allone-line-soft)] rounded-[var(--radius-md)] p-4 shadow-[var(--shadow-xs)] shadow-black/[0.02] hover:shadow-[var(--shadow-sm)] hover:shadow-black/[0.04] transition-shadow duration-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-sm text-[var(--ink-900)] truncate">{(l.company || l.name) as string}</h3>
                      {l.industry && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-medium">{l.industry as string}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {l.phone && (
                        <a href={`tel:${l.phone}`} className="inline-flex items-center gap-1 text-xs text-[var(--ao-accent)] hover:underline">
                          <Phone className="w-3 h-3" />{l.phone as string}
                        </a>
                      )}
                      {l.email && (
                        <a href={`mailto:${l.email}`} className="inline-flex items-center gap-1 text-xs text-[var(--ao-accent)] hover:underline">
                          <Mail className="w-3 h-3" />{l.email as string}
                        </a>
                      )}
                      {l.website && !INFOSHOP_PATTERN.test(l.website as string) ? (
                        <a href={safeHttpUrl(l.website as string) ?? undefined} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-green-600 hover:underline">
                          <Globe className="w-3 h-3" />Website
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-red-400"><Globe className="w-3 h-3" />No website</span>
                      )}
                      {l.facebook_url && (
                        <a href={safeHttpUrl(l.facebook_url as string) ?? undefined} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-[var(--ao-accent)] hover:underline">
                          <ExternalLink className="w-3 h-3" />Facebook
                        </a>
                      )}
                      {l.source_url && !INFOSHOP_PATTERN.test(l.source_url as string) && (
                        <a href={safeHttpUrl(l.source_url as string) ?? undefined} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-[var(--ink-500)] hover:text-[var(--ao-accent)]">
                          <ExternalLink className="w-3 h-3" />Source
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-[var(--ink-400)]">
                      {l.city && <span>{l.city as string}</span>}
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
                      <div className="mt-2 text-xs text-[var(--ink-700)] bg-[var(--bg-surface-alt)] rounded-[var(--radius-sm)] px-3 py-2 whitespace-pre-wrap">
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
                  </div>
                </div>
              </div>
            );
          })}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-xs text-[var(--ink-500)]">{total.toLocaleString()} leads</span>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setPage(1)} disabled={page === 1} className="px-2.5 py-1.5 text-xs rounded-[var(--radius-sm)] border border-[var(--allone-line)] hover:bg-[var(--bg-surface-alt)] disabled:opacity-30 transition-colors">First</button>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-2.5 py-1.5 text-xs rounded-[var(--radius-sm)] border border-[var(--allone-line)] hover:bg-[var(--bg-surface-alt)] disabled:opacity-30 transition-colors">Prev</button>
                <div className="flex items-center gap-1 text-xs text-[var(--ink-500)]">
                  <input
                    type="number" min={1} max={totalPages} defaultValue={page} key={page}
                    onKeyDown={(e) => { if (e.key === 'Enter') { const v = parseInt((e.target as HTMLInputElement).value); if (v >= 1 && v <= totalPages) setPage(v); } }}
                    onBlur={(e) => { const v = parseInt(e.target.value); if (v >= 1 && v <= totalPages) setPage(v); }}
                    className="w-12 py-1.5 text-center text-xs rounded-[var(--radius-sm)] border border-[var(--allone-line)] focus:border-gray-400 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span>of {totalPages}</span>
                </div>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-2.5 py-1.5 text-xs rounded-[var(--radius-sm)] border border-[var(--allone-line)] hover:bg-[var(--bg-surface-alt)] disabled:opacity-30 transition-colors">Next</button>
                <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="px-2.5 py-1.5 text-xs rounded-[var(--radius-sm)] border border-[var(--allone-line)] hover:bg-[var(--bg-surface-alt)] disabled:opacity-30 transition-colors">Last</button>
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
        <div className="w-5 h-5 border-2 border-[var(--allone-line)] border-t-gray-900 rounded-full animate-spin" />
      </div>
    }>
      <HotLinesPageContent />
    </Suspense>
  );
}
