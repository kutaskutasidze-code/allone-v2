'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ClipboardList, Search, X, ArrowRight, AlertCircle } from 'lucide-react';
import { LEAD_STATUSES, LEAD_STATUS_LABELS, LEAD_STATUS_STYLES } from '@/lib/validations/leads';
import { useDebounce } from '@/lib/hooks/useDebounce';

interface AuditRow {
  id: string;
  changedAt: string;
  fromStatus: string | null;
  toStatus: string;
  lead: { id: string; name: string; company: string | null } | null;
  salesUser: { id: string; name: string } | null;
}

interface RepLite {
  id: string;
  name: string;
}

const formatRelative = (iso: string) => {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
};

const formatAbsolute = (iso: string) =>
  new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

function StatusPill({ status }: { status: string | null }) {
  if (!status) return <span className="text-xs text-gray-400 italic">created</span>;
  const cls = LEAD_STATUS_STYLES[status] || 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-full ${cls}`}>
      {LEAD_STATUS_LABELS[status] || status}
    </span>
  );
}

export default function AdminAuditPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [reps, setReps] = useState<RepLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;

  const [search, setSearch] = useState('');
  const [repId, setRepId] = useState('all');
  const [fromStatus, setFromStatus] = useState('all');
  const [toStatus, setToStatus] = useState('all');
  const [since, setSince] = useState('');
  const [until, setUntil] = useState('');

  const debouncedSearch = useDebounce(search, 350);

  useEffect(() => {
    fetch('/api/admin/sales-users')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(j => setReps(j.data || []))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (repId !== 'all') params.set('sales_user_id', repId);
      if (fromStatus !== 'all') params.set('from_status', fromStatus);
      if (toStatus !== 'all') params.set('to_status', toStatus);
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (since) params.set('since', new Date(since).toISOString());
      if (until) {
        // Inclusive day-end: bump to start of next day.
        const u = new Date(until);
        u.setDate(u.getDate() + 1);
        params.set('until', u.toISOString());
      }

      const res = await fetch(`/api/admin/leads/audit?${params.toString()}`);
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      setRows(json.data || []);
      setTotal(json.meta?.total || 0);
    } catch {
      setError('Failed to load audit log');
    } finally {
      setLoading(false);
    }
  }, [page, repId, fromStatus, toStatus, debouncedSearch, since, until]);

  useEffect(() => { load(); }, [load]);

  const resetPageAnd = <T,>(setter: React.Dispatch<React.SetStateAction<T>>) =>
    (v: T) => { setter(v); setPage(1); };

  const clearFilters = () => {
    setSearch('');
    setRepId('all');
    setFromStatus('all');
    setToStatus('all');
    setSince('');
    setUntil('');
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasFilters = !!(search || repId !== 'all' || fromStatus !== 'all' || toStatus !== 'all' || since || until);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-gray-900 font-display">Audit Log</h1>
        <p className="mt-1.5 text-sm text-gray-500">Every lead status change. {total} entries match current filters.</p>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={repId}
            onChange={(e) => resetPageAnd(setRepId)(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:border-gray-400 focus:outline-none cursor-pointer"
          >
            <option value="all">All reps</option>
            {reps.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>

          <select
            value={fromStatus}
            onChange={(e) => resetPageAnd(setFromStatus)(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:border-gray-400 focus:outline-none cursor-pointer"
          >
            <option value="all">From: any</option>
            {LEAD_STATUSES.map(s => <option key={s.value} value={s.value}>From: {s.label}</option>)}
          </select>

          <select
            value={toStatus}
            onChange={(e) => resetPageAnd(setToStatus)(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:border-gray-400 focus:outline-none cursor-pointer"
          >
            <option value="all">To: any</option>
            {LEAD_STATUSES.map(s => <option key={s.value} value={s.value}>To: {s.label}</option>)}
          </select>

          <input
            type="date"
            value={since}
            onChange={(e) => resetPageAnd(setSince)(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:border-gray-400 focus:outline-none"
            placeholder="From date"
          />
          <span className="text-xs text-gray-400">→</span>
          <input
            type="date"
            value={until}
            onChange={(e) => resetPageAnd(setUntil)(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:border-gray-400 focus:outline-none"
            placeholder="To date"
          />

          {hasFilters && (
            <button onClick={clearFilters} className="text-xs text-gray-500 hover:text-gray-900 underline">
              Clear filters
            </button>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => resetPageAnd(setSearch)(e.target.value)}
            placeholder="Search by lead name or company..."
            className="w-full pl-10 pr-10 py-2.5 text-sm rounded-lg bg-white border border-gray-200 focus:border-gray-400 focus:outline-none"
          />
          {search && (
            <button onClick={() => resetPageAnd(setSearch)('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span className="flex-1">{error}</span>
          <button onClick={load} className="text-xs text-red-700 underline">Retry</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm shadow-black/[0.02] overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="bg-gray-50 text-[11px] text-gray-500 uppercase tracking-wider">
              <th className="text-left px-4 py-3 font-medium">When</th>
              <th className="text-left px-4 py-3 font-medium">Lead</th>
              <th className="text-left px-4 py-3 font-medium">Rep</th>
              <th className="text-left px-4 py-3 font-medium">Change</th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-xs text-gray-400">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center">
                  <ClipboardList className="w-6 h-6 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">No audit entries match your filters.</p>
                </td>
              </tr>
            ) : (
              rows.map(row => (
                <tr key={row.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap" title={formatAbsolute(row.changedAt)}>
                    <div className="text-xs">{formatRelative(row.changedAt)}</div>
                    <div className="text-[11px] text-gray-400">{formatAbsolute(row.changedAt)}</div>
                  </td>
                  <td className="px-4 py-3">
                    {row.lead ? (
                      <Link href={`/admin/leads?search=${encodeURIComponent(row.lead.name)}`} className="block group">
                        <div className="font-medium text-gray-900 group-hover:underline truncate max-w-[260px]">{row.lead.company || row.lead.name}</div>
                        {row.lead.company && <div className="text-xs text-gray-500 truncate max-w-[260px]">{row.lead.name}</div>}
                      </Link>
                    ) : (
                      <span className="text-xs text-gray-400 italic">deleted lead</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {row.salesUser?.name || <span className="text-xs text-gray-400">unassigned</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="inline-flex items-center gap-2">
                      <StatusPill status={row.fromStatus} />
                      <ArrowRight className="w-3 h-3 text-gray-300" />
                      <StatusPill status={row.toStatus} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{total} entries</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-colors"
            >
              Prev
            </button>
            <span className="px-2">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
