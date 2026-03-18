'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Search, X, Trash2, Pencil, Mail, Play, Pause } from 'lucide-react';
import { ConfirmDialog, PageHeader, EmptyState } from '@/components/admin';
import type { EmailCampaign } from '@/types/database';

const SERVICE_NAMES: Record<string, string> = {
  chatbots: 'AI Chatbots',
  custom_ai: 'Custom AI',
  automation: 'Automation',
  website: 'Website Dev',
  consulting: 'Consulting',
};

function CampaignsPageContent() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<EmailCampaign | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCampaigns();
  }, [statusFilter]);

  const fetchCampaigns = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/sales/campaigns?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch campaigns');
      const result = await res.json();
      setCampaigns(result.data || []);
    } catch (err) {
      setError('Failed to load campaigns');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (campaign: EmailCampaign) => {
    try {
      const res = await fetch(`/api/sales/campaigns/${campaign.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete campaign');

      setCampaigns(campaigns.filter((c) => c.id !== campaign.id));
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete campaign');
      setDeleteConfirm(null);
    }
  };

  const toggleActive = async (campaign: EmailCampaign) => {
    try {
      const res = await fetch(`/api/sales/campaigns/${campaign.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...campaign, is_active: !campaign.is_active }),
      });

      if (!res.ok) throw new Error('Failed to update campaign');

      const { data } = await res.json();
      setCampaigns(campaigns.map((c) => (c.id === campaign.id ? data : c)));
    } catch (err) {
      setError('Failed to update campaign');
      console.error(err);
    }
  };

  const filteredCampaigns = campaigns.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.subject.toLowerCase().includes(search.toLowerCase())
  );

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
        title="Email Campaigns"
        description={`${campaigns.length} campaign${campaigns.length !== 1 ? 's' : ''}`}
        action={{ label: 'Create Campaign', href: '/sales/campaigns/new' }}
      />

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--gray-400)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaigns..."
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

        <div className="flex rounded-lg bg-[var(--gray-100)] p-0.5">
          {(['all', 'active', 'inactive'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${
                statusFilter === status
                  ? 'bg-white text-[var(--black)] shadow-sm'
                  : 'text-[var(--gray-500)] hover:text-[var(--black)]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {filteredCampaigns.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="No campaigns found"
          description={search || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'Create your first email campaign.'}
          action={!search && statusFilter === 'all' ? { label: 'Create Campaign', href: '/sales/campaigns/new' } : undefined}
        />
      ) : (
        <div className="space-y-3">
          {filteredCampaigns.map((campaign, index) => (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="p-4 bg-white border border-[var(--gray-200)] rounded-xl hover:border-[var(--gray-300)] transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <Link
                      href={`/sales/campaigns/${campaign.id}`}
                      className="font-medium text-[var(--black)] hover:underline truncate"
                    >
                      {campaign.name}
                    </Link>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-md ${
                        campaign.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-[var(--gray-100)] text-[var(--gray-600)]'
                      }`}
                    >
                      {campaign.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--gray-500)] truncate mb-2">
                    Subject: {campaign.subject}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-[var(--gray-400)]">
                    {campaign.target_service && (
                      <span>Service: {SERVICE_NAMES[campaign.target_service] || campaign.target_service}</span>
                    )}
                    <span>Min Score: {campaign.min_relevance_score}</span>
                    <span>Daily Limit: {campaign.daily_limit}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-[var(--gray-500)]">
                        <span className="font-semibold text-[var(--black)]">{campaign.emails_sent}</span> sent
                      </span>
                      <span className="text-[var(--gray-500)]">
                        <span className="font-semibold text-green-600">{campaign.emails_opened}</span> opened
                      </span>
                      <span className="text-[var(--gray-500)]">
                        <span className="font-semibold text-blue-600">{campaign.emails_replied}</span> replied
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleActive(campaign)}
                      className={`p-2 rounded-lg transition-colors ${
                        campaign.is_active
                          ? 'text-green-600 hover:bg-green-50'
                          : 'text-[var(--gray-400)] hover:bg-[var(--gray-100)]'
                      }`}
                      title={campaign.is_active ? 'Pause campaign' : 'Activate campaign'}
                    >
                      {campaign.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <Link
                      href={`/sales/campaigns/${campaign.id}`}
                      className="p-2 text-[var(--gray-400)] hover:text-[var(--black)] hover:bg-[var(--gray-100)] rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => setDeleteConfirm(campaign)}
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
        title="Delete Campaign"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}

export default function CampaignsPage() {
  return <CampaignsPageContent />;
}
