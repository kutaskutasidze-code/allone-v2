'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Database, Globe, RefreshCw, Power } from 'lucide-react';
import { PageHeader } from '@/components/admin';
import type { LeadSource } from '@/types/database';

const SOURCE_TYPE_LABELS: Record<string, string> = {
  maps: 'Maps',
  directory: 'Directory',
  jobs: 'Job Boards',
  registry: 'Business Registry',
  search: 'Search Engine',
  manual: 'Manual Import',
};

const SOURCE_TYPE_COLORS: Record<string, string> = {
  maps: 'bg-blue-100 text-blue-600',
  directory: 'bg-green-100 text-green-600',
  jobs: 'bg-purple-100 text-purple-600',
  registry: 'bg-orange-100 text-orange-600',
  search: 'bg-yellow-100 text-yellow-600',
  manual: 'bg-gray-100 text-gray-600',
};

export default function SourcesPage() {
  const [sources, setSources] = useState<LeadSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      const res = await fetch('/api/sales/sources');
      if (!res.ok) throw new Error('Failed to fetch sources');
      const { data } = await res.json();
      setSources(data || []);
    } catch (err) {
      setError('Failed to load sources');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSource = async (source: LeadSource) => {
    try {
      const res = await fetch('/api/sales/sources', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: source.id, is_active: !source.is_active }),
      });

      if (!res.ok) throw new Error('Failed to update source');

      const { data } = await res.json();
      setSources(sources.map((s) => (s.id === source.id ? data : s)));
    } catch (err) {
      setError('Failed to update source');
      console.error(err);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-[var(--gray-200)] border-t-[var(--black)] rounded-full animate-spin" />
      </div>
    );
  }

  const activeSources = sources.filter((s) => s.is_active).length;
  const totalLeads = sources.reduce((sum, s) => sum + (s.leads_count || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lead Sources"
        description={`${activeSources} active of ${sources.length} sources`}
      />

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[var(--gray-200)] rounded-xl p-4">
          <p className="text-sm text-[var(--gray-500)]">Total Sources</p>
          <p className="text-2xl font-semibold">{sources.length}</p>
        </div>
        <div className="bg-white border border-[var(--gray-200)] rounded-xl p-4">
          <p className="text-sm text-[var(--gray-500)]">Active</p>
          <p className="text-2xl font-semibold text-green-600">{activeSources}</p>
        </div>
        <div className="bg-white border border-[var(--gray-200)] rounded-xl p-4">
          <p className="text-sm text-[var(--gray-500)]">Inactive</p>
          <p className="text-2xl font-semibold text-[var(--gray-400)]">{sources.length - activeSources}</p>
        </div>
        <div className="bg-white border border-[var(--gray-200)] rounded-xl p-4">
          <p className="text-sm text-[var(--gray-500)]">Total Leads</p>
          <p className="text-2xl font-semibold">{totalLeads.toLocaleString()}</p>
        </div>
      </div>

      {/* Sources List */}
      <div className="space-y-3">
        {sources.map((source, index) => (
          <motion.div
            key={source.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className={`p-4 bg-white border rounded-xl transition-colors ${
              source.is_active
                ? 'border-[var(--gray-200)] hover:border-[var(--gray-300)]'
                : 'border-[var(--gray-100)] opacity-60'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`p-2.5 rounded-lg ${SOURCE_TYPE_COLORS[source.source_type] || 'bg-gray-100 text-gray-600'}`}>
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-medium text-[var(--black)]">{source.name}</h3>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${SOURCE_TYPE_COLORS[source.source_type] || 'bg-gray-100 text-gray-600'}`}>
                      {SOURCE_TYPE_LABELS[source.source_type] || source.source_type}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-md ${
                        source.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-[var(--gray-100)] text-[var(--gray-600)]'
                      }`}
                    >
                      {source.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-[var(--gray-500)]">
                    {source.base_url && (
                      <span className="flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5" />
                        {source.base_url.replace(/^https?:\/\//, '').split('/')[0]}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <RefreshCw className="w-3.5 h-3.5" />
                      Last scraped: {formatDate(source.last_scraped_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-[var(--gray-400)]">
                    <span>Countries: {source.countries.join(', ') || 'All'}</span>
                    <span>Leads: {(source.leads_count || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => toggleSource(source)}
                className={`p-2 rounded-lg transition-colors ${
                  source.is_active
                    ? 'text-green-600 hover:bg-green-50'
                    : 'text-[var(--gray-400)] hover:bg-[var(--gray-100)]'
                }`}
                title={source.is_active ? 'Disable source' : 'Enable source'}
              >
                <Power className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {sources.length === 0 && (
        <div className="text-center py-12 text-[var(--gray-500)]">
          <Database className="w-12 h-12 mx-auto mb-4 text-[var(--gray-300)]" />
          <p>No lead sources configured</p>
          <p className="text-sm">Run the database migration to add default sources</p>
        </div>
      )}
    </div>
  );
}
