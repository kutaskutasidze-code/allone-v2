'use client';

import { Suspense, useState, useEffect, useCallback, useMemo } from 'react';
import { Search, X, Users, Phone, Globe, MapPin, Building2, AlertCircle, CheckCircle2, Lock, Undo2 } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/admin';
import { LEAD_STATUSES, LEAD_STATUS_STYLES, HOTLINE_PHONE_PREFIX_PARAM, INFOSHOP_PATTERN } from '@/lib/validations/leads';
import { useDebounce } from '@/lib/hooks/useDebounce';

interface SalesRep {
  id: string;
  name: string;
  email: string;
  role?: string;
}

interface LeadRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  city: string | null;
  industry: string | null;
  website: string | null;
  status: string;
  sales_user_id: string | null;
  sales_user?: { id: string; name: string; email: string } | null;
  created_at: string;
  assigned_at?: string | null;
}

const PAGE_LIMIT = 50;

function AssignLeadsContent() {
  const [tab, setTab] = useState<'unassigned' | 'assigned'>('unassigned');
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [reps, setReps] = useState<SalesRep[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [targetRepId, setTargetRepId] = useState<string>('');
  const [assignedToFilter, setAssignedToFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState<{ type: 'ok' | 'warn'; msg: string } | null>(null);

  const debouncedSearch = useDebounce(search, 350);

  useEffect(() => {
    fetch('/api/sales/team')
      .then(r => r.ok ? r.json() : null)
      .then((json) => {
        // /api/sales/team returns aggregate; we want raw users. Use direct table query via
        // a lightweight endpoint that returns id, name, email, role. Falling back to the
        // team endpoint's `data.users` shape if it exposes them.
        if (json?.data?.users) {
          const users = json.data.users as Array<{ id: string; name: string; email: string; role?: string }>;
          setReps(users.filter(u => u.role !== 'admin'));
        }
      })
      .catch(() => {});
    // Also fetch raw sales_users via a dedicated endpoint we'll create — but for now
    // /api/sales/team returns the list. Fallback: hit /api/sales/leads with limit=0 wouldn't help.
  }, []);

  useEffect(() => {
    // If the team endpoint didn't yield reps, try a direct fetch.
    if (reps.length > 0) return;
    fetch('/api/admin/sales-users')
      .then(r => r.ok ? r.json() : null)
      .then(json => { if (json?.data) setReps(json.data); })
      .catch(() => {});
  }, [reps.length]);

  const fetchLeads = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const params = new URLSearchParams();
      params.set('assignment', tab);
      if (tab === 'assigned' && assignedToFilter !== 'all') params.set('assigned_to', assignedToFilter);
      if (industry !== 'all') params.set('industry', industry);
      if (debouncedSearch) params.set('search', debouncedSearch);
      params.set('exclude_phone_prefix', HOTLINE_PHONE_PREFIX_PARAM);
      params.set('page', String(page));
      params.set('limit', String(PAGE_LIMIT));

      const res = await fetch(`/api/admin/leads?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch leads');
      const json = await res.json();
      setLeads(json.data || []);
      setTotal(json.meta?.total || 0);
      setSelected(new Set());
    } catch {
      setError('Failed to load leads');
    } finally {
      setIsLoading(false);
    }
  }, [tab, assignedToFilter, industry, debouncedSearch, page]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const toggleAll = () => {
    if (selected.size === leads.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(leads.map(l => l.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const doAssign = async () => {
    if (selected.size === 0 || !targetRepId) return;
    setIsAssigning(true);
    setError('');
    try {
      const res = await fetch('/api/admin/leads/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadIds: [...selected], salesUserId: targetRepId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to assign');
      const skipped = (json.data.skippedTouched || 0) + (json.data.skippedSameOwner || 0);
      const targetName = reps.find(r => r.id === targetRepId)?.name || 'rep';
      setFlash({
        type: skipped > 0 ? 'warn' : 'ok',
        msg: `Assigned ${json.data.assigned} lead(s) to ${targetName}` + (skipped > 0 ? ` · ${skipped} skipped (already touched or same owner)` : ''),
      });
      await fetchLeads();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign');
    } finally {
      setIsAssigning(false);
    }
  };

  const doUnassign = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Send ${selected.size} lead(s) back to the unassigned pool?`)) return;
    setIsAssigning(true);
    setError('');
    try {
      const res = await fetch('/api/admin/leads/unassign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadIds: [...selected] }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to unassign');
      const skipped = (json.data.skippedTouched || 0);
      setFlash({
        type: skipped > 0 ? 'warn' : 'ok',
        msg: `${json.data.unassigned} returned to pool` + (skipped > 0 ? ` · ${skipped} kept (already touched, owned permanently)` : ''),
      });
      await fetchLeads();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unassign');
    } finally {
      setIsAssigning(false);
    }
  };

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 4000);
    return () => clearTimeout(t);
  }, [flash]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));
  const industries = useMemo(() => Array.from(new Set(leads.map(l => l.industry).filter(Boolean))) as string[], [leads]);

  return (
    <div className="space-y-6">
      <PageHeader title="Assign Leads" description={`${total} lead${total === 1 ? '' : 's'} in ${tab === 'unassigned' ? 'the unassigned pool' : 'the assigned view'}`} />

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {flash && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm border ${flash.type === 'ok' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
          <CheckCircle2 className="w-4 h-4" />
          <span className="flex-1">{flash.msg}</span>
          <button onClick={() => setFlash(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => { setTab('unassigned'); setPage(1); }}
          className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${tab === 'unassigned' ? 'bg-gray-900 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}
        >
          Pool · unassigned
        </button>
        <button
          onClick={() => { setTab('assigned'); setPage(1); }}
          className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${tab === 'assigned' ? 'bg-gray-900 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}
        >
          Currently assigned
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Lead list */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search name, company, phone, city..."
                className="w-full pl-10 pr-9 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:border-gray-400 focus:outline-none"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <select
              value={industry}
              onChange={(e) => { setIndustry(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:border-gray-400 focus:outline-none cursor-pointer"
            >
              <option value="all">All categories</option>
              {industries.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
            {tab === 'assigned' && (
              <select
                value={assignedToFilter}
                onChange={(e) => { setAssignedToFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:border-gray-400 focus:outline-none cursor-pointer"
              >
                <option value="all">All reps</option>
                {reps.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            )}
          </div>

          <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs">
            <input
              type="checkbox"
              checked={selected.size === leads.length && leads.length > 0}
              onChange={toggleAll}
              className="rounded border-gray-300"
            />
            <span className="text-gray-600 flex-1">
              {selected.size > 0 ? `${selected.size} selected on this page` : 'Select all on page'}
            </span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
            </div>
          ) : leads.length === 0 ? (
            <EmptyState icon={Users} title={tab === 'unassigned' ? 'Pool is empty' : 'No matching assigned leads'} description={tab === 'unassigned' ? 'All leads have been assigned.' : 'Try changing the filters.'} />
          ) : (
            <div className="space-y-1.5">
              {leads.map((l) => {
                const isTouched = l.status !== 'new';
                const isSelected = selected.has(l.id);
                const blocked = tab === 'assigned' && isTouched;
                return (
                  <div
                    key={l.id}
                    className={`group bg-white border rounded-xl p-3 shadow-sm shadow-black/[0.02] transition-all ${isSelected ? 'border-gray-900' : 'border-gray-100'}`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(l.id)}
                        disabled={blocked}
                        className="mt-1 rounded border-gray-300 disabled:opacity-30"
                        title={blocked ? 'Touched lead — cannot be reassigned' : undefined}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-sm text-gray-900 truncate">{l.company || l.name}</h3>
                          {l.industry && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-medium">{l.industry}</span>}
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full ${LEAD_STATUS_STYLES[l.status]}`}>
                            {LEAD_STATUSES.find(s => s.value === l.status)?.label}
                          </span>
                          {blocked && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-gray-500" title={`Owned by ${l.sales_user?.name || 'unknown'} — already touched`}>
                              <Lock className="w-3 h-3" /> owned
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap text-xs">
                          {l.phone && (<span className="inline-flex items-center gap-1 text-blue-600"><Phone className="w-3 h-3" />{l.phone}</span>)}
                          {l.website && !INFOSHOP_PATTERN.test(l.website) ? (
                            <span className="inline-flex items-center gap-1 text-green-600"><Globe className="w-3 h-3" />Has website</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-400"><Globe className="w-3 h-3" />No website</span>
                          )}
                          {l.city && (<span className="inline-flex items-center gap-1 text-gray-500"><MapPin className="w-3 h-3" />{l.city}</span>)}
                          {tab === 'assigned' && l.sales_user && (
                            <span className="inline-flex items-center gap-1 text-gray-500"><Building2 className="w-3 h-3" />{l.sales_user.name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-3">
                  <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30">Prev</button>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30">Next</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action panel */}
        <aside className="lg:sticky lg:top-4 h-fit space-y-4">
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm shadow-black/[0.02]">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">
              {tab === 'unassigned' ? 'Assign to rep' : 'Reassign / return to pool'}
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              {tab === 'unassigned'
                ? 'Pick a rep and assign the selected leads.'
                : 'Untouched (status = new) leads can be reassigned or sent back to the pool. Touched leads stay with their owner.'}
            </p>

            <div className="space-y-1.5 mb-4 max-h-64 overflow-y-auto">
              {reps.length === 0 && (
                <p className="text-xs text-gray-400">No sales reps available.</p>
              )}
              {reps.map(rep => (
                <label key={rep.id} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-sm border ${targetRepId === rep.id ? 'border-gray-900 bg-gray-50' : 'border-transparent hover:bg-gray-50'}`}>
                  <input
                    type="radio"
                    name="targetRep"
                    value={rep.id}
                    checked={targetRepId === rep.id}
                    onChange={() => setTargetRepId(rep.id)}
                    className="border-gray-300"
                  />
                  <span className="flex-1 truncate">{rep.name}</span>
                  {rep.role === 'supervisor' && <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">supervisor</span>}
                </label>
              ))}
            </div>

            <button
              onClick={doAssign}
              disabled={selected.size === 0 || !targetRepId || isAssigning}
              className="w-full py-2 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {isAssigning ? 'Assigning…' : `Assign ${selected.size || ''} lead${selected.size === 1 ? '' : 's'}`}
            </button>

            {tab === 'assigned' && (
              <button
                onClick={doUnassign}
                disabled={selected.size === 0 || isAssigning}
                className="w-full mt-2 py-2 px-4 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all inline-flex items-center justify-center gap-2"
              >
                <Undo2 className="w-4 h-4" />
                Return to pool
              </button>
            )}
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm shadow-black/[0.02] text-xs text-gray-500 space-y-2">
            <p className="font-medium text-gray-700">How this works</p>
            <p>Only leads with status <strong>new</strong> can be reassigned. Once a rep updates a lead's status (e.g. contacted, callback), the lead is permanently theirs.</p>
            <p>Reps only see leads assigned to them. Use the Pool tab to distribute fresh leads each morning.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function AssignLeadsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      </div>
    }>
      <AssignLeadsContent />
    </Suspense>
  );
}
