'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Server,
  Zap,
  Package,
  ArrowLeft,
  ExternalLink,
  Search,
  Filter,
} from 'lucide-react';

interface Capability {
  id: string;
  name: string;
  category: string;
  status: string;
  source: string | null;
  description: string | null;
  version: string | null;
  metadata: Record<string, unknown>;
  installed_at: string;
}

const CATEGORY_ICONS: Record<string, typeof Server> = {
  mcp_server: Server,
  skill: Zap,
  module: Package,
  repository: Package,
  tool: Zap,
  framework: Package,
};

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-50 text-green-600',
  pending: 'bg-yellow-50 text-yellow-600',
  deprecated: 'bg-red-50 text-red-600',
};

export default function CapabilitiesPage() {
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    async function fetchCapabilities() {
      try {
        const params = new URLSearchParams();
        if (categoryFilter) params.set('category', categoryFilter);
        if (statusFilter) params.set('status', statusFilter);
        params.set('limit', '100');

        const res = await fetch(`/api/admin/claude/capabilities?${params}`);
        const json = await res.json();
        if (json.success) {
          setCapabilities(json.data);
        }
      } catch (error) {
        console.error('Failed to fetch capabilities:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCapabilities();
  }, [categoryFilter, statusFilter]);

  const filteredCapabilities = capabilities.filter((cap) =>
    cap.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cap.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = [...new Set(capabilities.map((c) => c.category))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/claude"
          className="p-2 hover:bg-[var(--gray-100)] rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-[var(--gray-500)]" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--black)]">
            Capabilities
          </h1>
          <p className="mt-1 text-sm text-[var(--gray-500)]">
            {filteredCapabilities.length} capabilities
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--gray-400)]" />
          <input
            type="text"
            placeholder="Search capabilities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-[var(--gray-200)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--gray-200)]"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-[var(--gray-200)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--gray-200)]"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.replace('_', ' ')}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-[var(--gray-200)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--gray-200)]"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="deprecated">Deprecated</option>
          </select>
        </div>
      </div>

      {/* Capabilities Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-32 bg-[var(--gray-100)] rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : filteredCapabilities.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCapabilities.map((cap, index) => {
            const Icon = CATEGORY_ICONS[cap.category] || Package;
            return (
              <motion.div
                key={cap.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className="p-4 bg-white border border-[var(--gray-200)] rounded-xl hover:border-[var(--gray-300)] transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--gray-100)]">
                    <Icon className="h-4 w-4 text-[var(--gray-500)]" />
                  </div>
                  <span
                    className={`px-2 py-0.5 text-xs rounded ${STATUS_STYLES[cap.status] || STATUS_STYLES.active}`}
                  >
                    {cap.status}
                  </span>
                </div>
                <h3 className="font-medium text-[var(--black)] mb-1">{cap.name}</h3>
                <p className="text-xs text-[var(--gray-500)] line-clamp-2 mb-3">
                  {cap.description || 'No description'}
                </p>
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 bg-[var(--gray-100)] text-[var(--gray-600)] rounded">
                    {cap.category.replace('_', ' ')}
                  </span>
                  {cap.source && (
                    <a
                      href={cap.source.startsWith('http') ? cap.source : `https://${cap.source}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[var(--gray-400)] hover:text-[var(--black)] transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 bg-white border border-[var(--gray-200)] rounded-xl text-center">
          <Filter className="h-8 w-8 text-[var(--gray-300)] mx-auto mb-3" />
          <p className="text-sm text-[var(--gray-500)]">No capabilities found</p>
        </div>
      )}
    </div>
  );
}
