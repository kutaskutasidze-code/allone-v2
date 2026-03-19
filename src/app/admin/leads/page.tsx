'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Users, ChevronDown, MessageSquare, ExternalLink, Phone, Mail, Globe, Trash2 } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/admin';
import { LEAD_STATUSES, LEAD_STATUS_STYLES } from '@/lib/validations/leads';
import type { LeadWithSalesUser } from '@/types/database';

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

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
          <div className="absolute top-full left-0 mt-1 z-20 bg-white border border-[var(--gray-200)] rounded-lg shadow-lg py-1 min-w-[120px]">
            {LEAD_STATUSES.map(s => (
              <button
                key={s.value}
                onClick={() => { onUpdate(leadId, s.value); setOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--gray-50)] ${currentStatus === s.value ? 'font-semibold' : ''}`}
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

  return (
    <>
      <button onClick={() => setOpen(!open)} className="p-1 rounded hover:bg-[var(--gray-100)] text-[var(--gray-400)] hover:text-[var(--black)] transition-colors" title="Notes">
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
            <div className="px-4 py-3 bg-[var(--gray-50)] border-t border-[var(--gray-100)]">
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add notes about this lead..."
                rows={2}
                className="w-full px-3 py-2 text-sm bg-white border border-[var(--gray-200)] rounded-lg focus:border-[var(--gray-400)] focus:outline-none resize-none"
              />
              <div className="flex justify-end gap-2 mt-2">
                <button onClick={() => setOpen(false)} className="px-3 py-1 text-xs text-[var(--gray-500)] hover:text-[var(--black)]">Cancel</button>
                <button
                  onClick={() => { onSave(leadId, notes); setOpen(false); }}
                  className="px-3 py-1 text-xs bg-[var(--black)] text-white rounded-md hover:bg-[var(--gray-800)]"
                >
                  Save
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function AdminLeadsPageContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || 'all';

  const [leads, setLeads] = useState<LeadWithSalesUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const limit = 50;

  const fetchLeads = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search) params.set('search', search);
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
  }, [statusFilter, search, page]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const updateLead = async (id: string, updates: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/admin/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update');
      setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } as LeadWithSalesUser : l));
    } catch {
      setError('Failed to update lead');
    }
  };

  const deleteLead = async (id: string) => {
    if (!confirm('Delete this lead?')) return;
    try {
      const res = await fetch(`/api/admin/leads/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setLeads(prev => prev.filter(l => l.id !== id));
      setTotal(t => t - 1);
    } catch {
      setError('Failed to delete lead');
    }
  };

  const totalPages = Math.ceil(total / limit);

  const stats = {
    total,
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    qualified: leads.filter(l => l.status === 'qualified').length,
    won: leads.filter(l => l.status === 'won').length,
    lost: leads.filter(l => l.status === 'lost').length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Leads"
        description={`${total} total leads`}
      />

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {LEAD_STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => { setStatusFilter(s.value); setPage(1); }}
            className={`p-3 rounded-lg text-center transition-all ${statusFilter === s.value ? 'bg-[var(--black)] text-white' : 'bg-white border border-[var(--gray-200)] hover:border-[var(--gray-400)]'}`}
          >
            <div className="text-lg font-semibold">{stats[s.value as keyof typeof stats] ?? '-'}</div>
            <div className={`text-xs ${statusFilter === s.value ? 'text-white/70' : 'text-[var(--gray-500)]'}`}>{s.label}</div>
          </button>
        ))}
        <button
          onClick={() => { setStatusFilter('all'); setPage(1); }}
          className={`p-3 rounded-lg text-center transition-all ${statusFilter === 'all' ? 'bg-[var(--black)] text-white' : 'bg-white border border-[var(--gray-200)] hover:border-[var(--gray-400)]'}`}
        >
          <div className="text-lg font-semibold">{total}</div>
          <div className={`text-xs ${statusFilter === 'all' ? 'text-white/70' : 'text-[var(--gray-500)]'}`}>All</div>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--gray-400)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name, email, phone, company, city..."
          className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl bg-white border border-[var(--gray-200)] focus:border-[var(--gray-400)] focus:outline-none"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--gray-400)] hover:text-[var(--black)]">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Leads List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-[var(--gray-200)] border-t-[var(--black)] rounded-full animate-spin" />
        </div>
      ) : leads.length === 0 ? (
        <EmptyState icon={Users} title="No leads found" description={search || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'No leads yet. They will appear here when scraped or submitted via contact form.'} />
      ) : (
        <div className="space-y-2">
          {leads.map((lead, index) => (
            <motion.div
              key={lead.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.015 }}
              className="bg-white border border-[var(--gray-200)] rounded-xl p-4 hover:border-[var(--gray-300)] transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                {/* Lead info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-sm text-[var(--black)] truncate">{lead.name}</h3>
                    {lead.company && lead.company !== lead.name && (
                      <span className="text-xs text-[var(--gray-500)]">· {lead.company}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {lead.email && (
                      <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline">
                        <Mail className="w-3 h-3" />{lead.email}
                      </a>
                    )}
                    {lead.phone && (
                      <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline">
                        <Phone className="w-3 h-3" />{lead.phone}
                      </a>
                    )}
                    {lead.website && (
                      <a href={lead.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-[var(--gray-500)] hover:text-[var(--accent)]">
                        <Globe className="w-3 h-3" />Website
                      </a>
                    )}
                    {lead.source_url && (
                      <a href={lead.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-[var(--gray-400)] hover:text-[var(--accent)]">
                        <ExternalLink className="w-3 h-3" />Source
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-[var(--gray-400)]">
                    {lead.city && <span>{lead.city}</span>}
                    {lead.matched_service && <span>· {lead.matched_service}</span>}
                    {lead.source && <span>· {lead.source}</span>}
                    <span>· {formatDate(lead.created_at)}</span>
                  </div>
                  {lead.notes && (
                    <div className="mt-2 text-xs text-[var(--gray-600)] bg-[var(--gray-50)] rounded-lg px-3 py-2 whitespace-pre-wrap">
                      {lead.notes}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <StatusDropdown
                    leadId={lead.id}
                    currentStatus={lead.status}
                    onUpdate={(id, status) => updateLead(id, { status })}
                  />
                  <LeadNotes
                    leadId={lead.id}
                    initialNotes={lead.notes || ''}
                    onSave={(id, notes) => updateLead(id, { notes })}
                  />
                  <button
                    onClick={() => deleteLead(lead.id)}
                    className="p-1 rounded hover:bg-red-50 text-[var(--gray-400)] hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-xs text-[var(--gray-500)]">
                Page {page} of {totalPages} · {total} leads
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-xs rounded-lg border border-[var(--gray-200)] hover:bg-[var(--gray-50)] disabled:opacity-30"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-xs rounded-lg border border-[var(--gray-200)] hover:bg-[var(--gray-50)] disabled:opacity-30"
                >
                  Next
                </button>
              </div>
            </div>
          )}
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
