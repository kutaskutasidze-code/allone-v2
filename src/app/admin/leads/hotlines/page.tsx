'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Search, X, Flame, Trash2 } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/admin';
import { StatusDropdown, LeadNotes, LeadCard, LeadsPagination, type LeadCardData } from '@/components/leads';
import { LEAD_STATUSES, HOTLINE_PHONE_PREFIX_PARAM } from '@/lib/validations/leads';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { HotLinesDropdown } from '@/app/sales/leads/HotLinesDropdown';

function AdminHotLinesPageContent() {
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
      if (debouncedSearch) params.set('search', debouncedSearch);
      params.set('page', page.toString());
      params.set('limit', limit.toString());

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
  }, [statusFilter, industryFilter, websiteFilter, debouncedSearch, page]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const updateLead = async (id: string, updates: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/admin/leads/${id}`, {
        method: 'PATCH',
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
      const res = await fetch(`/api/admin/leads/${id}`, { method: 'DELETE' });
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
        <HotLinesDropdown
          selectedIndustry={industryFilter}
          onSelect={handleIndustrySelect}
          phonePrefix={HOTLINE_PHONE_PREFIX_PARAM}
          endpoint="/api/admin/leads/industries"
        />
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
            const l = lead as unknown as LeadCardData;
            return (
              <LeadCard
                key={l.id}
                lead={l}
                basePath="/admin/leads"
                variant="card"
                actions={
                  <>
                    <StatusDropdown
                      currentStatus={l.status}
                      onSelect={(status, extra) =>
                        updateLead(l.id, { status, ...extra })
                      }
                    />
                    <LeadNotes
                      leadId={l.id}
                      initialNotes={l.notes || ''}
                      onSave={(id, notes) => updateLead(id, { notes })}
                    />
                    <button
                      onClick={() => deleteLead(l.id)}
                      className="p-1 rounded hover:bg-red-50 text-[var(--ink-400)] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
            formatTotal={(t) => `${t.toLocaleString()} leads`}
          />
        </div>
      )}
    </div>
  );
}

export default function AdminHotLinesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-[var(--allone-line)] border-t-gray-900 rounded-full animate-spin" />
      </div>
    }>
      <AdminHotLinesPageContent />
    </Suspense>
  );
}
