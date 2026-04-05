'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, X, Trash2, Pencil, Users } from 'lucide-react';
import { LeadStatusBadge } from '@/components/sales';
import { ConfirmDialog, PageHeader, EmptyState } from '@/components/admin';
import type { Lead, LeadStatus } from '@/types/database';
import { LEAD_STATUSES } from '@/lib/validations/leads';
import { formatCurrency } from '@/lib/utils';

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

function LeadsPageContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || 'all';
  const salesUserIdFilter = searchParams.get('sales_user_id');

  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<Lead | null>(null);
  const [error, setError] = useState('');
  const limit = 50;

  const fetchLeads = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search) params.set('search', search);
      if (salesUserIdFilter) params.set('sales_user_id', salesUserIdFilter);
      params.set('page', page.toString());
      params.set('limit', limit.toString());

      const res = await fetch(`/api/sales/leads?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch leads');
      const result = await res.json();
      setLeads(result.data || []);
      setTotal(result.pagination?.total || 0);
      setTotalPages(result.pagination?.totalPages || 1);
    } catch (err) {
      setError('Failed to load leads');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, search, page, salesUserIdFilter]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const handleDelete = async (lead: Lead) => {
    try {
      const res = await fetch(`/api/sales/leads/${lead.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete lead');
      }
      setLeads(leads.filter((l) => l.id !== lead.id));
      setTotal(t => t - 1);
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete lead');
      setDeleteConfirm(null);
    }
  };

  const handleStatusChange = async (lead: Lead, newStatus: LeadStatus) => {
    try {
      const res = await fetch(`/api/sales/leads/${lead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      const updatedLead = await res.json();
      setLeads(leads.map((l) => (l.id === lead.id ? updatedLead.data : l)));
    } catch (err) {
      setError('Failed to update lead status');
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description={`${total} lead${total !== 1 ? 's' : ''}`}
        action={{ label: 'Add Lead', href: '/sales/leads/new' }}
      />

      {error && (
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => { setStatusFilter('all'); setPage(1); }}
          className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            statusFilter === 'all'
              ? 'bg-gray-900 text-white shadow-sm'
              : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
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
            {s.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name, email, or company..."
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
        <EmptyState
          icon={Users}
          title="No leads found"
          description={search || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'Add your first lead to get started.'}
          action={!search && statusFilter === 'all' ? { label: 'Add Lead', href: '/sales/leads/new' } : undefined}
        />
      ) : (
        <div className="space-y-1.5">
          {leads.map((lead) => (
            <div
              key={lead.id}
              className="group p-4 bg-white border border-gray-100 rounded-xl shadow-sm shadow-black/[0.02] hover:shadow-md hover:shadow-black/[0.04] transition-shadow duration-200"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <Link href={`/sales/leads/${lead.id}`} className="font-medium text-sm text-gray-900 hover:underline truncate">
                      {lead.name}
                    </Link>
                    <LeadStatusBadge status={lead.status} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                    {lead.company && <span>{lead.company}</span>}
                    {lead.email && <span>· {lead.email}</span>}
                    {lead.phone && <span>· {lead.phone}</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                    {lead.source && <span>{lead.source}</span>}
                    <span>· {formatDate(lead.created_at)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(lead.value)}</span>
                  <select
                    value={lead.status}
                    onChange={(e) => handleStatusChange(lead, e.target.value as LeadStatus)}
                    className="px-2 py-1 text-xs font-medium rounded-lg bg-gray-50 border border-gray-200 cursor-pointer"
                  >
                    {LEAD_STATUSES.map((status) => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/sales/leads/${lead.id}`} className="p-2 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-colors">
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <button onClick={() => setDeleteConfirm(lead)} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-xs text-gray-500">{total} leads</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                >First</button>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                >Prev</button>
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
                >Next</button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                >Last</button>
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Delete Lead"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
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
