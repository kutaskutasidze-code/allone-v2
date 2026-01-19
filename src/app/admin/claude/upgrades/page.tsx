'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Zap,
  Check,
  X,
  Clock,
  Filter,
} from 'lucide-react';

interface Upgrade {
  id: string;
  action: string;
  capability_name: string | null;
  capability_category: string | null;
  description: string;
  details: Record<string, unknown>;
  verified: boolean;
  verification_notes: string | null;
  reported_at: string;
}

const ACTION_ICONS: Record<string, typeof CheckCircle2> = {
  install: CheckCircle2,
  update: RefreshCw,
  remove: AlertCircle,
  configure: Zap,
};

const ACTION_COLORS: Record<string, string> = {
  install: 'bg-green-50 text-green-600',
  update: 'bg-blue-50 text-blue-600',
  remove: 'bg-red-50 text-red-600',
  configure: 'bg-purple-50 text-purple-600',
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function UpgradesPage() {
  const [upgrades, setUpgrades] = useState<Upgrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifiedFilter, setVerifiedFilter] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('');

  useEffect(() => {
    async function fetchUpgrades() {
      try {
        const params = new URLSearchParams();
        if (verifiedFilter) params.set('verified', verifiedFilter);
        if (actionFilter) params.set('action', actionFilter);
        params.set('limit', '50');

        const res = await fetch(`/api/admin/claude/upgrades?${params}`);
        const json = await res.json();
        if (json.success) {
          setUpgrades(json.data);
        }
      } catch (error) {
        console.error('Failed to fetch upgrades:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUpgrades();
  }, [verifiedFilter, actionFilter]);

  async function toggleVerification(upgrade: Upgrade) {
    try {
      const res = await fetch('/api/admin/claude/upgrades', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: upgrade.id,
          verified: !upgrade.verified,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setUpgrades((prev) =>
          prev.map((u) => (u.id === upgrade.id ? { ...u, verified: !u.verified } : u))
        );
      }
    } catch (error) {
      console.error('Failed to toggle verification:', error);
    }
  }

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
            Upgrade History
          </h1>
          <p className="mt-1 text-sm text-[var(--gray-500)]">
            {upgrades.length} upgrades recorded
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <select
          value={verifiedFilter}
          onChange={(e) => setVerifiedFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-[var(--gray-200)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--gray-200)]"
        >
          <option value="">All Status</option>
          <option value="true">Verified</option>
          <option value="false">Pending</option>
        </select>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-[var(--gray-200)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--gray-200)]"
        >
          <option value="">All Actions</option>
          <option value="install">Install</option>
          <option value="update">Update</option>
          <option value="remove">Remove</option>
          <option value="configure">Configure</option>
        </select>
      </div>

      {/* Upgrades List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-24 bg-[var(--gray-100)] rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : upgrades.length > 0 ? (
        <div className="bg-white border border-[var(--gray-200)] rounded-xl divide-y divide-[var(--gray-100)]">
          {upgrades.map((upgrade, index) => {
            const ActionIcon = ACTION_ICONS[upgrade.action] || CheckCircle2;
            return (
              <motion.div
                key={upgrade.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                className="p-4 hover:bg-[var(--gray-50)] transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 flex items-center justify-center rounded-lg ${ACTION_COLORS[upgrade.action] || ACTION_COLORS.install}`}
                  >
                    <ActionIcon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-[var(--black)]">
                        {upgrade.action.charAt(0).toUpperCase() + upgrade.action.slice(1)}
                      </span>
                      {upgrade.capability_name && (
                        <>
                          <span className="text-[var(--gray-400)]">·</span>
                          <span className="text-[var(--gray-600)]">{upgrade.capability_name}</span>
                        </>
                      )}
                      {upgrade.capability_category && (
                        <span className="px-2 py-0.5 text-xs bg-[var(--gray-100)] text-[var(--gray-600)] rounded">
                          {upgrade.capability_category}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--gray-600)] mb-2">{upgrade.description}</p>
                    {upgrade.details && Object.keys(upgrade.details).length > 0 && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-[var(--gray-400)] hover:text-[var(--gray-600)]">
                          View details
                        </summary>
                        <pre className="mt-2 p-2 bg-[var(--gray-100)] rounded text-[var(--gray-600)] overflow-x-auto">
                          {JSON.stringify(upgrade.details, null, 2)}
                        </pre>
                      </details>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-[var(--gray-400)]">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(upgrade.reported_at)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleVerification(upgrade)}
                    className={`p-2 rounded-lg transition-colors ${
                      upgrade.verified
                        ? 'bg-green-50 text-green-600 hover:bg-green-100'
                        : 'bg-[var(--gray-100)] text-[var(--gray-400)] hover:bg-[var(--gray-200)]'
                    }`}
                    title={upgrade.verified ? 'Mark as unverified' : 'Mark as verified'}
                  >
                    {upgrade.verified ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Clock className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 bg-white border border-[var(--gray-200)] rounded-xl text-center">
          <Filter className="h-8 w-8 text-[var(--gray-300)] mx-auto mb-3" />
          <p className="text-sm text-[var(--gray-500)]">No upgrades found</p>
        </div>
      )}
    </div>
  );
}
