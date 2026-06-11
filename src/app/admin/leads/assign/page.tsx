'use client';

import Link from 'next/link';
import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, Users, Phone, Globe, MapPin, Building2, AlertCircle, CheckCircle2, Lock, Undo2, Shuffle, Scale, MinusCircle, ArrowDownToLine, Tag, ArrowRight, Flame } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/admin';
import { LEAD_STATUSES, LEAD_STATUS_STYLES, HOTLINE_PHONE_PREFIX_PARAM, INFOSHOP_PATTERN, LEAD_INDUSTRIES } from '@/lib/validations/leads';
import { useDebounce } from '@/lib/hooks/useDebounce';

interface RepLoad {
  id: string;
  name: string;
  role: string;
  isActive: boolean;
  totalAssigned: number;
  untouchedCount: number;
}

interface RepLoadsData {
  reps: RepLoad[];
  totals: { totalAssigned: number; untouchedCount: number; activeReps: number };
}

interface RebalancePreviewPerRep { name: string; movedToPool: number }

interface RebalancePreview {
  perRep: Record<string, RebalancePreviewPerRep>;
  totalMovedToPool: number;
}

interface SpecialtyPreviewPerRep { name: string; count: number; industries: string[] }
interface SpecialtyPreview {
  totalAssigned: number;
  perRep: Record<string, SpecialtyPreviewPerRep>;
  uncovered: { total: number; byIndustry: Record<string, number> };
  reason?: string;
}

interface SalesRep {
  id: string;
  name: string;
  email: string;
  role?: string;
  is_active?: boolean;
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
  const [sourceFilter, setSourceFilter] = useState('all');
  const [websiteFilter, setWebsiteFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState<{ type: 'ok' | 'warn'; msg: string } | null>(null);
  const [distributeOpen, setDistributeOpen] = useState(false);
  const [distributePerRep, setDistributePerRep] = useState(80);
  const [distributing, setDistributing] = useState(false);
  const [distributeRepIds, setDistributeRepIds] = useState<Set<string>>(new Set());
  // Hotline leads (Georgian landlines +9953/+9954) are normally excluded so
  // they live in the dedicated /admin/leads/hotlines view. Law-firm leads
  // mostly fall into this bucket, so admins need a way to include them
  // when distributing. Default off preserves the previous behavior.
  const [includeHotlines, setIncludeHotlines] = useState(false);

  // Rebalance state
  const [repLoads, setRepLoads] = useState<RepLoadsData | null>(null);
  const [rebalanceOpen, setRebalanceOpen] = useState(false);
  const [rebalanceTarget, setRebalanceTarget] = useState<number>(0);
  const [rebalancePreview, setRebalancePreview] = useState<RebalancePreview | null>(null);
  const [rebalancing, setRebalancing] = useState(false);
  const [takeOpenForRep, setTakeOpenForRep] = useState<string | null>(null);
  const [takeCount, setTakeCount] = useState<number>(10);
  const [taking, setTaking] = useState(false);
  const takePopoverRef = useRef<HTMLDivElement>(null);

  // Distribute-by-specialty state
  const [specialtyOpen, setSpecialtyOpen] = useState(false);
  const [specialtyPerRep, setSpecialtyPerRep] = useState<string>(''); // '' = uncapped
  const [specialtyPreview, setSpecialtyPreview] = useState<SpecialtyPreview | null>(null);
  const [distributingSpecialty, setDistributingSpecialty] = useState(false);

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
      if (sourceFilter !== 'all') params.set('has_any_source', sourceFilter);
      if (websiteFilter !== 'all') params.set('has_website', websiteFilter);
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (!includeHotlines) params.set('exclude_phone_prefix', HOTLINE_PHONE_PREFIX_PARAM);
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
  }, [tab, assignedToFilter, industry, sourceFilter, websiteFilter, debouncedSearch, page, includeHotlines]);

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

  const doDistribute = async () => {
    setDistributing(true);
    setError('');
    try {
      const body: { perRep: number; repIds?: string[]; filters?: Record<string, string> } = { perRep: distributePerRep };
      if (distributeRepIds.size > 0) body.repIds = [...distributeRepIds];
      if (industry !== 'all') body.filters = { ...(body.filters || {}), industry };
      if (sourceFilter !== 'all') body.filters = { ...(body.filters || {}), hasAnySource: sourceFilter };
      if (websiteFilter !== 'all') body.filters = { ...(body.filters || {}), hasWebsite: websiteFilter };
      if (!includeHotlines) {
        body.filters = { ...(body.filters || {}), excludePhonePrefix: HOTLINE_PHONE_PREFIX_PARAM };
      }

      const res = await fetch('/api/admin/leads/distribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to distribute');

      const lines = Object.values(json.data.perRep as Record<string, { name: string; count: number }>)
        .filter(v => v.count > 0)
        .map(v => `${v.name}: ${v.count}`)
        .join(' · ');
      setFlash({
        type: json.data.totalAssigned > 0 ? 'ok' : 'warn',
        msg: json.data.totalAssigned === 0
          ? (json.data.reason || 'Nothing to distribute — pool is empty')
          : `Distributed ${json.data.totalAssigned} leads (${lines}). ${json.data.totalRemaining} remain in pool.`,
      });
      setDistributeOpen(false);
      await fetchLeads();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to distribute');
    } finally {
      setDistributing(false);
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

  // Per-rep load counts — only needed on the "assigned" tab + after any
  // mutation that changes assignment (distribute, assign, unassign, rebalance).
  const fetchRepLoads = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/leads/rep-loads');
      if (!res.ok) return;
      const json = await res.json();
      setRepLoads(json.data);
    } catch { /* ignore — non-blocking */ }
  }, []);

  useEffect(() => {
    if (tab === 'assigned') fetchRepLoads();
  }, [tab, fetchRepLoads]);

  // Default the rebalance target to the floor of the current mean every time
  // the modal opens or load data refreshes (so the suggestion stays useful).
  useEffect(() => {
    if (!rebalanceOpen || !repLoads) return;
    const active = repLoads.reps.filter(r => r.isActive);
    if (active.length === 0) return;
    const totalUntouched = active.reduce((s, r) => s + r.untouchedCount, 0);
    setRebalanceTarget(Math.floor(totalUntouched / active.length));
  }, [rebalanceOpen, repLoads]);

  // Refresh the preview whenever the target input changes (debounced lightly
  // by letting React batch — single API hit per blur is sufficient).
  const refreshRebalancePreview = useCallback(async (target: number) => {
    try {
      const res = await fetch('/api/admin/leads/rebalance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'equalize', targetPerRep: target, dryRun: true }),
      });
      const json = await res.json();
      if (res.ok) setRebalancePreview({ perRep: json.data.perRep, totalMovedToPool: json.data.totalMovedToPool });
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!rebalanceOpen) { setRebalancePreview(null); return; }
    refreshRebalancePreview(rebalanceTarget);
  }, [rebalanceOpen, rebalanceTarget, refreshRebalancePreview]);

  const doRebalance = async () => {
    setRebalancing(true);
    setError('');
    try {
      const res = await fetch('/api/admin/leads/rebalance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'equalize', targetPerRep: rebalanceTarget, dryRun: false }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to rebalance');
      const lines = Object.values(json.data.perRep as Record<string, RebalancePreviewPerRep>)
        .filter(v => v.movedToPool > 0)
        .map(v => `${v.name}: −${v.movedToPool}`)
        .join(' · ');
      setFlash({
        type: json.data.totalMovedToPool > 0 ? 'ok' : 'warn',
        msg: json.data.totalMovedToPool === 0
          ? 'Nothing to move — everyone is already at or below target.'
          : `Moved ${json.data.totalMovedToPool} leads to pool (${lines}). Now click Distribute pool to spread them back out.`,
      });
      setRebalanceOpen(false);
      await Promise.all([fetchLeads(), fetchRepLoads()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rebalance');
    } finally {
      setRebalancing(false);
    }
  };

  const doTakeFromRep = async (repId: string, count: number) => {
    setTaking(true);
    setError('');
    try {
      const res = await fetch('/api/admin/leads/rebalance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'from_rep', repId, count, dryRun: false }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to take leads');
      const moved = json.data.totalMovedToPool;
      const repName = repLoads?.reps.find(r => r.id === repId)?.name || 'rep';
      setFlash({
        type: moved > 0 ? 'ok' : 'warn',
        msg: moved === 0
          ? `${repName} has no untouched leads to move.`
          : `Took ${moved} from ${repName} → pool.`,
      });
      setTakeOpenForRep(null);
      await Promise.all([fetchLeads(), fetchRepLoads()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to take leads');
    } finally {
      setTaking(false);
    }
  };

  // Distribute by specialty — dry-run preview + execute.
  const fetchSpecialtyPreview = useCallback(async () => {
    try {
      const body: { perRep?: number; dryRun: true } = { dryRun: true };
      const n = parseInt(specialtyPerRep, 10);
      if (!isNaN(n) && n > 0) body.perRep = n;
      const res = await fetch('/api/admin/leads/distribute-by-specialty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (res.ok) setSpecialtyPreview(json.data);
    } catch { /* ignore */ }
  }, [specialtyPerRep]);

  useEffect(() => {
    if (!specialtyOpen) { setSpecialtyPreview(null); return; }
    fetchSpecialtyPreview();
  }, [specialtyOpen, fetchSpecialtyPreview]);

  const doDistributeBySpecialty = async () => {
    setDistributingSpecialty(true);
    setError('');
    try {
      const body: { perRep?: number; dryRun: false } = { dryRun: false };
      const n = parseInt(specialtyPerRep, 10);
      if (!isNaN(n) && n > 0) body.perRep = n;
      const res = await fetch('/api/admin/leads/distribute-by-specialty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to distribute by specialty');

      const lines = Object.values(json.data.perRep as Record<string, SpecialtyPreviewPerRep>)
        .filter(v => v.count > 0)
        .map(v => `${v.name}: ${v.count}`)
        .join(' · ');
      const uncovered = json.data.uncovered?.total || 0;
      setFlash({
        type: json.data.totalAssigned > 0 ? 'ok' : 'warn',
        msg: json.data.totalAssigned === 0
          ? (json.data.reason || 'Nothing matched — set rep industries on /admin/team first.')
          : `Routed ${json.data.totalAssigned} leads by specialty${lines ? ` (${lines})` : ''}${uncovered > 0 ? ` · ${uncovered} stayed in pool (no rep covers their industry)` : ''}.`,
      });
      setSpecialtyOpen(false);
      await Promise.all([fetchLeads(), fetchRepLoads()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to distribute by specialty');
    } finally {
      setDistributingSpecialty(false);
    }
  };

  // Close the per-rep "Take..." popover when clicking outside it.
  useEffect(() => {
    if (!takeOpenForRep) return;
    const onClick = (e: MouseEvent) => {
      if (takePopoverRef.current && !takePopoverRef.current.contains(e.target as Node)) {
        setTakeOpenForRep(null);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [takeOpenForRep]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  return (
    <div className="space-y-6">
      <PageHeader title="Assign Leads" description={`${total} lead${total === 1 ? '' : 's'} in ${tab === 'unassigned' ? 'the unassigned pool' : 'the assigned view'}`} />

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-[var(--radius-sm)] text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {flash && (
        <div className={`flex items-center gap-2 p-3 rounded-[var(--radius-sm)] text-sm border ${flash.type === 'ok' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
          <CheckCircle2 className="w-4 h-4" />
          <span className="flex-1">{flash.msg}</span>
          <button onClick={() => setFlash(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => { setTab('unassigned'); setPage(1); }}
          className={`px-3 py-2 rounded-[var(--radius-sm)] text-xs font-medium transition-all ${tab === 'unassigned' ? 'bg-[var(--ink-900)] text-white shadow-[var(--shadow-xs)]' : 'bg-[var(--bg-surface)] border border-[var(--allone-line)] text-[var(--ink-700)] hover:border-[var(--allone-line-strong)]'}`}
        >
          Pool · unassigned
        </button>
        <button
          onClick={() => { setTab('assigned'); setPage(1); }}
          className={`px-3 py-2 rounded-[var(--radius-sm)] text-xs font-medium transition-all ${tab === 'assigned' ? 'bg-[var(--ink-900)] text-white shadow-[var(--shadow-xs)]' : 'bg-[var(--bg-surface)] border border-[var(--allone-line)] text-[var(--ink-700)] hover:border-[var(--allone-line-strong)]'}`}
        >
          Currently assigned
        </button>

        <div className="flex-1" />

        {tab === 'unassigned' && (
          <>
            <button
              onClick={() => setSpecialtyOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] text-xs font-medium bg-sky-600 text-white shadow-[var(--shadow-xs)] hover:bg-sky-700 active:scale-[0.98] transition-all"
            >
              <Tag className="w-3.5 h-3.5" />
              Distribute by specialty
            </button>
            <button
              onClick={() => { setDistributeOpen(true); setDistributeRepIds(new Set()); }}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] text-xs font-medium bg-emerald-600 text-white shadow-[var(--shadow-xs)] hover:bg-emerald-700 active:scale-[0.98] transition-all"
            >
              <Shuffle className="w-3.5 h-3.5" />
              Distribute pool
            </button>
          </>
        )}

        {tab === 'assigned' && (
          <button
            onClick={() => setRebalanceOpen(true)}
            disabled={!repLoads || repLoads.totals.activeReps === 0}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] text-xs font-medium bg-amber-600 text-white shadow-[var(--shadow-xs)] hover:bg-amber-700 disabled:opacity-50 active:scale-[0.98] transition-all"
          >
            <Scale className="w-3.5 h-3.5" />
            Rebalance everyone
          </button>
        )}
      </div>

      {/* Distribute modal */}
      {distributeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--allone-line)] rounded-[var(--radius-lg)] shadow-xl max-w-md w-full p-4 sm:p-6">
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-emerald-50 flex items-center justify-center">
                  <Shuffle className="w-4 h-4 text-emerald-600" />
                </div>
                <h2 className="text-base font-semibold text-[var(--ink-900)]">Distribute the pool</h2>
              </div>
              <button onClick={() => setDistributeOpen(false)} className="text-[var(--ink-400)] hover:text-[var(--ink-900)]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[var(--ink-500)] mb-4">
              Auto-assigns leads round-robin from the unassigned pool. Higher relevance score first.
              {industry !== 'all' && <> Filtered to <strong className="text-[var(--ink-700)]">{industry}</strong> only.</>}
            </p>

            <label className="block text-xs font-medium text-[var(--ink-700)] mb-2">Leads per rep</label>
            <div className="flex items-center gap-2 mb-5">
              {[50, 80, 100, 150].map(n => (
                <button
                  key={n}
                  onClick={() => setDistributePerRep(n)}
                  className={`px-3 py-1.5 text-xs rounded-[var(--radius-sm)] border ${distributePerRep === n ? 'bg-[var(--ink-900)] text-white border-gray-900' : 'bg-[var(--bg-surface)] text-[var(--ink-700)] border-[var(--allone-line)] hover:border-gray-400'}`}
                >
                  {n}
                </button>
              ))}
              <input
                type="number"
                min={1}
                max={1000}
                value={distributePerRep}
                onChange={(e) => setDistributePerRep(Math.max(1, Math.min(1000, parseInt(e.target.value) || 0)))}
                className="w-20 px-2 py-1.5 text-xs text-right rounded-[var(--radius-sm)] border border-[var(--allone-line)] focus:border-gray-400 focus:outline-none"
              />
            </div>

            <label className="block text-xs font-medium text-[var(--ink-700)] mb-2">Distribute to</label>
            <p className="text-[11px] text-[var(--ink-500)] mb-2">
              Leave all unchecked to distribute to every active rep automatically.
            </p>
            <div className="space-y-1 mb-5 max-h-40 overflow-y-auto">
              {reps.filter(r => r.is_active !== false).map(rep => {
                const checked = distributeRepIds.has(rep.id);
                return (
                  <label key={rep.id} className="flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--bg-surface-alt)] cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setDistributeRepIds(prev => {
                          const next = new Set(prev);
                          if (next.has(rep.id)) next.delete(rep.id); else next.add(rep.id);
                          return next;
                        });
                      }}
                    />
                    <span className="flex-1">{rep.name}</span>
                    {(rep.role === 'admin' || rep.role === 'supervisor') && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--ao-accent-soft)] text-[var(--ao-accent-hover)]">{rep.role}</span>
                    )}
                  </label>
                );
              })}
            </div>

            <div className="bg-[var(--bg-surface-alt)] rounded-[var(--radius-sm)] px-3 py-2 text-[11px] text-[var(--ink-500)] mb-5">
              About to assign up to <strong className="text-[var(--ink-900)]">{distributePerRep * (distributeRepIds.size || reps.filter(r => r.is_active !== false).length)}</strong> leads total.
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setDistributeOpen(false)} className="px-4 py-2 text-sm text-[var(--ink-700)] hover:bg-[var(--bg-surface-alt)] rounded-[var(--radius-sm)]">Cancel</button>
              <button
                onClick={doDistribute}
                disabled={distributing}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-[var(--radius-sm)] inline-flex items-center gap-2"
              >
                {distributing && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {distributing ? 'Distributing…' : 'Distribute'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rebalance modal */}
      {rebalanceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--allone-line)] rounded-[var(--radius-lg)] shadow-xl max-w-md w-full p-4 sm:p-6">
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-amber-50 flex items-center justify-center">
                  <Scale className="w-4 h-4 text-amber-600" />
                </div>
                <h2 className="text-base font-semibold text-[var(--ink-900)]">Rebalance to pool</h2>
              </div>
              <button onClick={() => setRebalanceOpen(false)} className="text-[var(--ink-400)] hover:text-[var(--ink-900)]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[var(--ink-500)] mb-4">
              Takes excess <strong className="text-[var(--ink-700)]">untouched</strong> leads from over-loaded reps back to the pool. Touched leads stay with their owner. After this, click <strong className="text-[var(--ink-700)]">Distribute pool</strong> to spread them back out.
            </p>

            <label className="block text-xs font-medium text-[var(--ink-700)] mb-2">Target untouched per rep</label>
            <div className="flex items-center gap-2 mb-4">
              <input
                type="number"
                min={0}
                max={10000}
                value={rebalanceTarget}
                onChange={(e) => setRebalanceTarget(Math.max(0, Math.min(10000, parseInt(e.target.value) || 0)))}
                className="w-24 px-3 py-2 text-sm rounded-[var(--radius-sm)] border border-[var(--allone-line)] focus:border-gray-400 focus:outline-none"
              />
              <span className="text-xs text-[var(--ink-500)]">
                Suggested: floor of the mean across active reps.
              </span>
            </div>

            <div className="bg-[var(--bg-surface-alt)] rounded-[var(--radius-sm)] p-3 mb-5 max-h-48 overflow-y-auto">
              {!rebalancePreview ? (
                <p className="text-[11px] text-[var(--ink-400)]">Calculating preview…</p>
              ) : rebalancePreview.totalMovedToPool === 0 ? (
                <p className="text-[11px] text-[var(--ink-500)]">No rep is above {rebalanceTarget}. Nothing will move.</p>
              ) : (
                <>
                  <p className="text-[11px] font-medium text-[var(--ink-700)] mb-2">
                    Will move <strong>{rebalancePreview.totalMovedToPool}</strong> lead(s) to pool:
                  </p>
                  <ul className="space-y-1">
                    {Object.entries(rebalancePreview.perRep)
                      .filter(([, v]) => v.movedToPool > 0)
                      .sort((a, b) => b[1].movedToPool - a[1].movedToPool)
                      .map(([repId, v]) => (
                        <li key={repId} className="flex items-center justify-between text-[11px]">
                          <span className="text-[var(--ink-700)]">{v.name}</span>
                          <span className="font-medium text-amber-700">−{v.movedToPool}</span>
                        </li>
                      ))}
                  </ul>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setRebalanceOpen(false)} className="px-4 py-2 text-sm text-[var(--ink-700)] hover:bg-[var(--bg-surface-alt)] rounded-[var(--radius-sm)]">Cancel</button>
              <button
                onClick={doRebalance}
                disabled={rebalancing || !rebalancePreview || rebalancePreview.totalMovedToPool === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-[var(--radius-sm)] inline-flex items-center gap-2"
              >
                {rebalancing && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {rebalancing ? 'Moving…' : 'Send to pool'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Distribute-by-specialty modal */}
      {specialtyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--allone-line)] rounded-[var(--radius-lg)] shadow-xl max-w-2xl w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-sky-50 flex items-center justify-center">
                  <Tag className="w-4 h-4 text-sky-600" />
                </div>
                <h2 className="text-base font-semibold text-[var(--ink-900)]">Distribute by specialty</h2>
              </div>
              <button onClick={() => setSpecialtyOpen(false)} className="text-[var(--ink-400)] hover:text-[var(--ink-900)]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[var(--ink-500)] mb-4">
              Routes each unassigned lead to a rep who covers its industry. Leads in industries no rep covers stay in the pool.
              Set rep coverage on <Link href="/admin/team" className="text-sky-700 underline">/admin/team</Link>.
            </p>

            <label className="block text-xs font-medium text-[var(--ink-700)] mb-2">Max per rep (optional)</label>
            <div className="flex items-center gap-2 mb-5">
              <input
                type="number"
                min={1}
                max={10000}
                value={specialtyPerRep}
                onChange={(e) => setSpecialtyPerRep(e.target.value)}
                placeholder="Uncapped"
                className="w-32 px-3 py-2 text-sm rounded-[var(--radius-sm)] border border-[var(--allone-line)] focus:border-gray-400 focus:outline-none"
              />
              <span className="text-xs text-[var(--ink-500)]">Leave empty to assign every covered lead.</span>
            </div>

            {/* Preview */}
            {!specialtyPreview ? (
              <div className="text-xs text-[var(--ink-400)] py-6 text-center">Calculating preview…</div>
            ) : (
              <>
                {/* Per-rep what they'd receive */}
                <div className="bg-[var(--bg-surface-alt)] rounded-[var(--radius-sm)] p-3 mb-4">
                  {Object.keys(specialtyPreview.perRep).length === 0 ? (
                    <p className="text-[11px] text-[var(--ink-500)]">
                      {specialtyPreview.reason || 'No covered leads to assign.'}
                    </p>
                  ) : (
                    <>
                      <p className="text-[11px] font-medium text-[var(--ink-700)] mb-2">
                        Will assign <strong>{specialtyPreview.totalAssigned}</strong> lead(s):
                      </p>
                      <ul className="space-y-1.5">
                        {Object.entries(specialtyPreview.perRep)
                          .sort((a, b) => b[1].count - a[1].count)
                          .map(([repId, v]) => (
                            <li key={repId} className="flex items-center justify-between gap-3 text-[11px]">
                              <span className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="font-medium text-[var(--ink-900)] truncate">{v.name}</span>
                                <span className="flex flex-wrap gap-1">
                                  {v.industries.map(i => (
                                    <span key={i} className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 text-[10px]">{i}</span>
                                  ))}
                                </span>
                              </span>
                              <span className="font-medium text-sky-700 tabular-nums shrink-0">+{v.count}</span>
                            </li>
                          ))}
                      </ul>
                    </>
                  )}
                </div>

                {/* Coverage-gap warning */}
                {specialtyPreview.uncovered.total > 0 && (
                  <div className="bg-amber-50 border border-amber-100 rounded-[var(--radius-sm)] p-3 mb-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-amber-900 mb-1">
                          {specialtyPreview.uncovered.total} lead(s) will stay in the pool — no rep covers their industry:
                        </p>
                        <ul className="space-y-0.5">
                          {Object.entries(specialtyPreview.uncovered.byIndustry)
                            .sort((a, b) => b[1] - a[1])
                            .map(([ind, n]) => (
                              <li key={ind} className="text-[11px] text-amber-800 flex items-center justify-between">
                                <span>{ind}</span>
                                <span className="tabular-nums font-medium">{n}</span>
                              </li>
                            ))}
                        </ul>
                        <Link
                          href="/admin/team"
                          className="inline-flex items-center gap-1 mt-2 text-[11px] font-medium text-amber-900 hover:text-amber-700"
                        >
                          Manage coverage <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-end gap-2">
              <button onClick={() => setSpecialtyOpen(false)} className="px-4 py-2 text-sm text-[var(--ink-700)] hover:bg-[var(--bg-surface-alt)] rounded-[var(--radius-sm)]">Cancel</button>
              <button
                onClick={doDistributeBySpecialty}
                disabled={distributingSpecialty || !specialtyPreview || specialtyPreview.totalAssigned === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 rounded-[var(--radius-sm)] inline-flex items-center gap-2"
              >
                {distributingSpecialty && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {distributingSpecialty ? 'Distributing…' : 'Distribute'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Lead list */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ink-400)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search name, company, phone, city..."
                className="w-full pl-10 pr-9 py-2 text-sm rounded-[var(--radius-sm)] bg-[var(--bg-surface)] border border-[var(--allone-line)] focus:border-gray-400 focus:outline-none"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-400)] hover:text-[var(--ink-900)]">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <select
              value={industry}
              onChange={(e) => {
                const next = e.target.value;
                setIndustry(next);
                setPage(1);
                // Auto-enable hotlines when picking an industry whose leads
                // are mostly Georgian landlines — otherwise the user picks
                // "Law Firms" and sees an empty list. They can still toggle
                // it back off manually.
                if (next !== 'all' && !includeHotlines) setIncludeHotlines(true);
              }}
              className="px-3 py-2 text-sm rounded-[var(--radius-sm)] bg-[var(--bg-surface)] border border-[var(--allone-line)] focus:border-gray-400 focus:outline-none cursor-pointer"
            >
              <option value="all">All categories</option>
              {LEAD_INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
            <select
              value={sourceFilter}
              onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm rounded-[var(--radius-sm)] bg-[var(--bg-surface)] border border-[var(--allone-line)] focus:border-gray-400 focus:outline-none cursor-pointer"
              title="Filter by whether the lead has a website, Facebook page, or Google Maps / source link to research"
            >
              <option value="all">Any source</option>
              <option value="yes">Has source (web / FB / maps)</option>
              <option value="no">No source</option>
            </select>
            <select
              value={websiteFilter}
              onChange={(e) => { setWebsiteFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm rounded-[var(--radius-sm)] bg-[var(--bg-surface)] border border-[var(--allone-line)] focus:border-gray-400 focus:outline-none cursor-pointer"
              title="Filter by whether the lead has its own website"
            >
              <option value="all">Any website</option>
              <option value="yes">Has website</option>
              <option value="no">No website</option>
            </select>
            {tab === 'assigned' && (
              <select
                value={assignedToFilter}
                onChange={(e) => { setAssignedToFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 text-sm rounded-[var(--radius-sm)] bg-[var(--bg-surface)] border border-[var(--allone-line)] focus:border-gray-400 focus:outline-none cursor-pointer"
              >
                <option value="all">All reps</option>
                {reps.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            )}
            <button
              type="button"
              onClick={() => { setIncludeHotlines(v => !v); setPage(1); }}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-sm)] text-xs font-medium border transition-all ${includeHotlines ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-[var(--bg-surface)] border-[var(--allone-line)] text-[var(--ink-700)] hover:border-[var(--allone-line-strong)]'}`}
              title="Hotlines = Georgian landlines (+9953/+9954). Most law-firm leads live here. Off by default to avoid double-distribution with /admin/leads/hotlines."
            >
              <Flame className="w-3.5 h-3.5" />
              {includeHotlines ? 'Including hotlines' : 'Include hotlines'}
            </button>
          </div>

          {tab === 'assigned' && repLoads && repLoads.reps.filter(r => r.isActive).length > 0 && (
            <div className="bg-[var(--bg-surface)] border border-[var(--allone-line-soft)] rounded-[var(--radius-md)] shadow-[var(--shadow-xs)] shadow-black/[0.02] overflow-x-auto">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--allone-line-soft)] bg-[var(--bg-surface-alt)]">
                <div className="text-xs font-medium text-[var(--ink-700)]">
                  Rep loads
                  <span className="ml-2 text-[11px] font-normal text-[var(--ink-500)]">
                    {repLoads.totals.untouchedCount} untouched · {repLoads.totals.totalAssigned} total · {repLoads.totals.activeReps} active reps
                  </span>
                </div>
              </div>
              {(() => {
                // Visual cue: amber accent on rows where untouched is significantly above median.
                const activeReps = repLoads.reps.filter(r => r.isActive);
                const sorted = [...activeReps].map(r => r.untouchedCount).sort((a, b) => a - b);
                const median = sorted.length === 0 ? 0 :
                  sorted.length % 2 === 1
                    ? sorted[(sorted.length - 1) / 2]
                    : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
                const overloadThreshold = Math.max(median * 1.25, median + 10);
                return (
                  <ul className="divide-y divide-gray-50">
                    {activeReps.map(rep => {
                      const isOverloaded = rep.untouchedCount > overloadThreshold && rep.untouchedCount > 0;
                      const popoverOpen = takeOpenForRep === rep.id;
                      return (
                        <li key={rep.id} className={`flex items-center gap-3 px-4 py-2 text-xs ${isOverloaded ? 'bg-amber-50/50' : ''}`}>
                          <span className="flex-1 truncate text-[var(--ink-900)] font-medium">
                            {rep.name}
                            {(rep.role === 'supervisor' || rep.role === 'admin') && (
                              <span className="ml-1.5 text-[10px] px-1.5 py-0.5 bg-[var(--ao-accent-soft)] text-[var(--ao-accent-hover)] rounded">{rep.role}</span>
                            )}
                          </span>
                          <span className="tabular-nums text-[var(--ink-500)]">
                            <span className="text-[var(--ink-400)]">total</span> <strong className="text-[var(--ink-700)]">{rep.totalAssigned}</strong>
                          </span>
                          <span className="tabular-nums text-[var(--ink-500)]">
                            <span className="text-[var(--ink-400)]">untouched</span>{' '}
                            <strong className={isOverloaded ? 'text-amber-700' : 'text-[var(--ink-700)]'}>{rep.untouchedCount}</strong>
                          </span>
                          <div className="relative">
                            <button
                              onClick={() => {
                                if (popoverOpen) { setTakeOpenForRep(null); return; }
                                setTakeOpenForRep(rep.id);
                                setTakeCount(Math.min(rep.untouchedCount, 10));
                              }}
                              disabled={rep.untouchedCount === 0}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-[var(--radius-xs)] text-[11px] font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                              title={rep.untouchedCount === 0 ? 'No untouched leads to move' : 'Take N from this rep'}
                            >
                              <MinusCircle className="w-3 h-3" />
                              Take…
                            </button>
                            {popoverOpen && (
                              <div
                                ref={takePopoverRef}
                                className="absolute right-0 top-full mt-1 z-40 w-60 bg-[var(--bg-surface)] border border-[var(--allone-line)] rounded-[var(--radius-sm)] shadow-[var(--shadow-md)] p-3"
                              >
                                <p className="text-[11px] text-[var(--ink-700)] mb-2">
                                  Send the oldest <strong>N untouched</strong> leads from {rep.name} back to the pool.
                                  <br />
                                  <span className="text-[var(--ink-400)]">Max available: {rep.untouchedCount}</span>
                                </p>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min={1}
                                    max={rep.untouchedCount}
                                    value={takeCount}
                                    onChange={(e) => setTakeCount(Math.max(1, Math.min(rep.untouchedCount, parseInt(e.target.value) || 1)))}
                                    className="w-20 px-2 py-1.5 text-sm rounded border border-[var(--allone-line)] focus:border-gray-400 focus:outline-none"
                                  />
                                  <button
                                    onClick={() => doTakeFromRep(rep.id, takeCount)}
                                    disabled={taking || takeCount < 1 || takeCount > rep.untouchedCount}
                                    className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-[var(--radius-xs)] text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
                                  >
                                    <ArrowDownToLine className="w-3 h-3" />
                                    {taking ? 'Moving…' : 'Send to pool'}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                );
              })()}
            </div>
          )}

          <div className="flex items-center gap-3 px-3 py-2 bg-[var(--bg-surface-alt)] border border-[var(--allone-line-soft)] rounded-[var(--radius-sm)] text-xs">
            <input
              type="checkbox"
              checked={selected.size === leads.length && leads.length > 0}
              onChange={toggleAll}
              className="rounded border-[var(--allone-line-strong)]"
            />
            <span className="text-[var(--ink-700)] flex-1">
              {selected.size > 0 ? `${selected.size} selected on this page` : 'Select all on page'}
            </span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-5 h-5 border-2 border-[var(--allone-line)] border-t-gray-900 rounded-full animate-spin" />
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
                    className={`group bg-[var(--bg-surface)] border rounded-[var(--radius-md)] p-3 shadow-[var(--shadow-xs)] shadow-black/[0.02] transition-all ${isSelected ? 'border-gray-900' : 'border-[var(--allone-line-soft)]'}`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(l.id)}
                        disabled={blocked}
                        className="mt-1 rounded border-[var(--allone-line-strong)] disabled:opacity-30"
                        title={blocked ? 'Touched lead — cannot be reassigned' : undefined}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-sm text-[var(--ink-900)] truncate">{l.company || l.name}</h3>
                          {l.industry && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-medium">{l.industry}</span>}
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full ${LEAD_STATUS_STYLES[l.status]}`}>
                            {LEAD_STATUSES.find(s => s.value === l.status)?.label}
                          </span>
                          {blocked && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-[var(--ink-500)]" title={`Owned by ${l.sales_user?.name || 'unknown'} — already touched`}>
                              <Lock className="w-3 h-3" /> owned
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap text-xs">
                          {l.phone && (<span className="inline-flex items-center gap-1 text-[var(--ao-accent)]"><Phone className="w-3 h-3" />{l.phone}</span>)}
                          {l.website && !INFOSHOP_PATTERN.test(l.website) ? (
                            <span className="inline-flex items-center gap-1 text-green-600"><Globe className="w-3 h-3" />Has website</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-400"><Globe className="w-3 h-3" />No website</span>
                          )}
                          {l.city && (<span className="inline-flex items-center gap-1 text-[var(--ink-500)]"><MapPin className="w-3 h-3" />{l.city}</span>)}
                          {tab === 'assigned' && l.sales_user && (
                            <span className="inline-flex items-center gap-1 text-[var(--ink-500)]"><Building2 className="w-3 h-3" />{l.sales_user.name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-3">
                  <span className="text-xs text-[var(--ink-500)]">Page {page} of {totalPages}</span>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-2.5 py-1.5 text-xs rounded-[var(--radius-sm)] border border-[var(--allone-line)] hover:bg-[var(--bg-surface-alt)] disabled:opacity-30">Prev</button>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-2.5 py-1.5 text-xs rounded-[var(--radius-sm)] border border-[var(--allone-line)] hover:bg-[var(--bg-surface-alt)] disabled:opacity-30">Next</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action panel */}
        <aside className="lg:sticky lg:top-4 h-fit space-y-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--allone-line-soft)] rounded-[var(--radius-md)] p-4 shadow-[var(--shadow-xs)] shadow-black/[0.02]">
            <h2 className="text-sm font-semibold text-[var(--ink-900)] mb-1">
              {tab === 'unassigned' ? 'Assign to rep' : 'Reassign / return to pool'}
            </h2>
            <p className="text-xs text-[var(--ink-500)] mb-4">
              {tab === 'unassigned'
                ? 'Pick a rep and assign the selected leads.'
                : 'Untouched (status = new) leads can be reassigned or sent back to the pool. Touched leads stay with their owner.'}
            </p>

            <div className="space-y-1.5 mb-4 max-h-64 overflow-y-auto">
              {reps.length === 0 && (
                <p className="text-xs text-[var(--ink-400)]">No sales reps available.</p>
              )}
              {reps.map(rep => (
                <label key={rep.id} className={`flex items-center gap-2 p-2 rounded-[var(--radius-sm)] cursor-pointer text-sm border ${targetRepId === rep.id ? 'border-gray-900 bg-[var(--bg-surface-alt)]' : 'border-transparent hover:bg-[var(--bg-surface-alt)]'}`}>
                  <input
                    type="radio"
                    name="targetRep"
                    value={rep.id}
                    checked={targetRepId === rep.id}
                    onChange={() => setTargetRepId(rep.id)}
                    className="border-[var(--allone-line-strong)]"
                  />
                  <span className="flex-1 truncate">{rep.name}</span>
                  {rep.role === 'supervisor' && <span className="text-[10px] px-1.5 py-0.5 bg-[var(--ao-accent-soft)] text-[var(--ao-accent-hover)] rounded">supervisor</span>}
                </label>
              ))}
            </div>

            <button
              onClick={doAssign}
              disabled={selected.size === 0 || !targetRepId || isAssigning}
              className="w-full py-2 px-4 bg-[var(--ink-900)] text-white text-sm font-medium rounded-[var(--radius-sm)] hover:bg-[var(--ink-800)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {isAssigning ? 'Assigning…' : `Assign ${selected.size || ''} lead${selected.size === 1 ? '' : 's'}`}
            </button>

            {tab === 'assigned' && (
              <button
                onClick={doUnassign}
                disabled={selected.size === 0 || isAssigning}
                className="w-full mt-2 py-2 px-4 bg-[var(--bg-surface)] border border-[var(--allone-line)] text-[var(--ink-700)] text-sm font-medium rounded-[var(--radius-sm)] hover:bg-[var(--bg-surface-alt)] disabled:opacity-40 disabled:cursor-not-allowed transition-all inline-flex items-center justify-center gap-2"
              >
                <Undo2 className="w-4 h-4" />
                Return to pool
              </button>
            )}
          </div>

          <div className="bg-[var(--bg-surface)] border border-[var(--allone-line-soft)] rounded-[var(--radius-md)] p-4 shadow-[var(--shadow-xs)] shadow-black/[0.02] text-xs text-[var(--ink-500)] space-y-2">
            <p className="font-medium text-[var(--ink-700)]">How this works</p>
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
        <div className="w-5 h-5 border-2 border-[var(--allone-line)] border-t-gray-900 rounded-full animate-spin" />
      </div>
    }>
      <AssignLeadsContent />
    </Suspense>
  );
}
