'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, X, Users } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/admin';
import { LEAD_STATUSES, LEAD_STATUS_STYLES } from '@/lib/validations/leads';
import type { LeadWithSalesUser } from '@/types/database';

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

function AdminLeadsPageContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || 'all';

  const [leads, setLeads] = useState<LeadWithSalesUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLeads();
  }, [statusFilter, search]);

  const fetchLeads = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/leads?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch leads');
      const result = await res.json();
      setLeads(result.data || []);
    } catch (err) {
      setError('Failed to load leads');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate stats
  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    qualified: leads.filter(l => l.status === 'qualified').length,
    won: leads.filter(l => l.status === 'won').length,
    lost: leads.filter(l => l.status === 'lost').length,
    totalValue: leads.reduce((sum, l) => sum + (l.value || 0), 0),
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
        title="Sales Leads"
        description={`${stats.total} leads · ${formatCurrency(stats.totalValue)} total value`}
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

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {LEAD_STATUSES.map((status) => (
          <div
            key={status.value}
            className="p-3 bg-white border border-[var(--gray-200)] rounded-lg text-center"
          >
            <div className="text-lg font-semibold text-[var(--black)]">
              {stats[status.value as keyof typeof stats]}
            </div>
            <div className="text-xs text-[var(--gray-500)]">{status.label}</div>
          </div>
        ))}
        <div className="p-3 bg-white border border-[var(--gray-200)] rounded-lg text-center">
          <div className="text-lg font-semibold text-[var(--black)]">
            {formatCurrency(stats.totalValue)}
          </div>
          <div className="text-xs text-[var(--gray-500)]">Total Value</div>
        </div>
      </div>

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

      {/* Leads Table */}
      {leads.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No leads found"
          description={search || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'No leads in the system yet.'}
        />
      ) : (
        <div className="bg-white border border-[var(--gray-200)] rounded-xl overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-[var(--gray-100)]">
                <th className="text-left text-xs font-medium text-[var(--gray-500)] uppercase tracking-wider px-4 py-3">
                  Lead
                </th>
                <th className="text-left text-xs font-medium text-[var(--gray-500)] uppercase tracking-wider px-4 py-3">
                  Sales Rep
                </th>
                <th className="text-left text-xs font-medium text-[var(--gray-500)] uppercase tracking-wider px-4 py-3">
                  Status
                </th>
                <th className="text-left text-xs font-medium text-[var(--gray-500)] uppercase tracking-wider px-4 py-3">
                  Source
                </th>
                <th className="text-right text-xs font-medium text-[var(--gray-500)] uppercase tracking-wider px-4 py-3">
                  Value
                </th>
                <th className="text-right text-xs font-medium text-[var(--gray-500)] uppercase tracking-wider px-4 py-3">
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead, index) => (
                <motion.tr
                  key={lead.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className={`hover:bg-white transition-colors ${
                    index !== leads.length - 1 ? 'border-b border-[var(--gray-100)]' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-sm text-[var(--black)]">{lead.name}</div>
                    <div className="text-xs text-[var(--gray-500)]">
                      {lead.company && <span>{lead.company}</span>}
                      {lead.company && lead.email && <span> · </span>}
                      {lead.email && <span>{lead.email}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--gray-600)]">
                    {lead.sales_user?.name || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${LEAD_STATUS_STYLES[lead.status]}`}
                    >
                      {LEAD_STATUSES.find(s => s.value === lead.status)?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--gray-600)]">
                    {lead.source || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--black)] font-medium text-right">
                    {formatCurrency(lead.value)}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--gray-500)] text-right">
                    {formatDate(lead.created_at)}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AdminLeadsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-[var(--gray-200)] border-t-[var(--black)] rounded-full animate-spin" />
      </div>
    }>
      <AdminLeadsPageContent />
    </Suspense>
  );
}
