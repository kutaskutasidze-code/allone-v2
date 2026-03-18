'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Search, X, Trash2, Pencil, Users } from 'lucide-react';
import { LeadStatusBadge } from '@/components/sales';
import { ConfirmDialog, PageHeader, EmptyState } from '@/components/admin';
import type { Lead, LeadStatus } from '@/types/database';
import { LEAD_STATUSES } from '@/lib/validations/leads';

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

function LeadsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || 'all';

  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [deleteConfirm, setDeleteConfirm] = useState<Lead | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLeads();
  }, [statusFilter, search]);

  const fetchLeads = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search) params.set('search', search);

      const res = await fetch(`/api/sales/leads?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch leads');
      const result = await res.json();
      const data = Array.isArray(result) ? result : result.data || [];
      setLeads(data);
    } catch (err) {
      setError('Failed to load leads');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (lead: Lead) => {
    try {
      const res = await fetch(`/api/sales/leads/${lead.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete lead');
      }

      setLeads(leads.filter((l) => l.id !== lead.id));
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

      if (!res.ok) {
        throw new Error('Failed to update status');
      }

      const updatedLead = await res.json();
      setLeads(leads.map((l) => (l.id === lead.id ? updatedLead.data : l)));
    } catch (err) {
      setError('Failed to update lead status');
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-[var(--gray-200)] border-t-[var(--black)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description={`${leads.length} lead${leads.length !== 1 ? 's' : ''}`}
        action={{ label: 'Add Lead', href: '/sales/leads/new' }}
      />

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--gray-400)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg bg-white border border-[var(--gray-200)] focus:border-[var(--gray-400)] focus:outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--gray-400)] hover:text-[var(--black)]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="flex flex-wrap rounded-lg bg-[var(--gray-100)] p-0.5">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              statusFilter === 'all'
                ? 'bg-white text-[var(--black)] shadow-sm'
                : 'text-[var(--gray-500)] hover:text-[var(--black)]'
            }`}
          >
            All
          </button>
          {LEAD_STATUSES.map((status) => (
            <button
              key={status.value}
              onClick={() => setStatusFilter(status.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                statusFilter === status.value
                  ? 'bg-white text-[var(--black)] shadow-sm'
                  : 'text-[var(--gray-500)] hover:text-[var(--black)]'
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leads List */}
      {leads.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No leads found"
          description={search || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'Add your first lead to get started.'}
          action={!search && statusFilter === 'all' ? { label: 'Add Lead', href: '/sales/leads/new' } : undefined}
        />
      ) : (
        <div className="space-y-3">
          {leads.map((lead, index) => (
            <motion.div
              key={lead.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="p-4 bg-white border border-[var(--gray-200)] rounded-xl hover:border-[var(--gray-300)] transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <Link
                      href={`/sales/leads/${lead.id}`}
                      className="font-medium text-[var(--black)] hover:underline truncate"
                    >
                      {lead.name}
                    </Link>
                    <LeadStatusBadge status={lead.status} />
                  </div>
                  <div className="flex items-center gap-4 text-sm text-[var(--gray-500)]">
                    {lead.company && <span>{lead.company}</span>}
                    {lead.email && <span>{lead.email}</span>}
                    {lead.phone && <span>{lead.phone}</span>}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-[var(--gray-400)]">
                    {lead.source && <span>Source: {lead.source}</span>}
                    <span>Created: {formatDate(lead.created_at)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-lg font-semibold text-[var(--black)]">
                    {formatCurrency(lead.value)}
                  </span>

                  {/* Status Dropdown */}
                  <select
                    value={lead.status}
                    onChange={(e) => handleStatusChange(lead, e.target.value as LeadStatus)}
                    className="px-2 py-1 text-xs font-medium rounded-lg bg-[var(--gray-100)] border-0 cursor-pointer"
                  >
                    {LEAD_STATUSES.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/sales/leads/${lead.id}`}
                      className="p-2 text-[var(--gray-400)] hover:text-[var(--black)] hover:bg-[var(--gray-100)] rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => setDeleteConfirm(lead)}
                      className="p-2 text-[var(--gray-400)] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
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
        <div className="w-6 h-6 border-2 border-[var(--gray-200)] border-t-[var(--black)] rounded-full animate-spin" />
      </div>
    }>
      <LeadsPageContent />
    </Suspense>
  );
}
