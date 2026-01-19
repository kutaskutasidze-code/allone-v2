'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Server,
  Zap,
  Package,
  CheckCircle2,
  Clock,
  Activity,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  GitBranch,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface Capability {
  id: string;
  name: string;
  category: string;
  status: string;
  source: string | null;
  description: string | null;
  metadata: Record<string, unknown>;
  installed_at: string;
}

interface Upgrade {
  id: string;
  action: string;
  capability_name: string | null;
  capability_category: string | null;
  description: string;
  details: Record<string, unknown>;
  verified: boolean;
  reported_at: string;
}

interface ClaudeDashboardContentProps {
  capabilities: Capability[];
  capsByCategory: Record<string, number>;
  capsByStatus: Record<string, number>;
  upgrades: Upgrade[];
  verifiedCount: number;
  pendingCount: number;
  usage: {
    total7d: number;
    today: number;
    successRate: number;
    avgDurationMs: number | null;
    topCapabilities: Array<{ name: string; count: number }>;
  };
  patterns: {
    total: number;
    topPatterns: Array<{ sequence: string[]; successRate: number; totalUses: number }>;
  };
  sessions: {
    total7d: number;
    avgDurationMins: number | null;
    outcomes: Record<string, number>;
  };
}

const CATEGORY_ICONS: Record<string, typeof Server> = {
  mcp_server: Server,
  skill: Zap,
  module: Package,
  repository: Package,
  tool: Zap,
  framework: Package,
};

const CATEGORY_COLORS: Record<string, string> = {
  mcp_server: '#111111',
  skill: '#444444',
  module: '#666666',
  repository: '#888888',
  tool: '#aaaaaa',
  framework: '#cccccc',
};

const ACTION_ICONS: Record<string, typeof CheckCircle2> = {
  install: CheckCircle2,
  update: RefreshCw,
  remove: AlertCircle,
  configure: Zap,
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function ClaudeDashboardContent({
  capabilities,
  capsByCategory,
  capsByStatus,
  upgrades,
  verifiedCount,
  pendingCount,
  usage,
  patterns,
  sessions,
}: ClaudeDashboardContentProps) {
  const totalCapabilities = capabilities.length;

  // Prepare chart data
  const categoryChartData = Object.entries(capsByCategory)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const stats = [
    {
      title: 'MCP Servers',
      count: capsByCategory.mcp_server || 0,
      icon: Server,
      color: 'bg-[var(--gray-100)]',
    },
    {
      title: 'Skills',
      count: capsByCategory.skill || 0,
      icon: Zap,
      color: 'bg-[var(--gray-100)]',
    },
    {
      title: 'Repositories',
      count: capsByCategory.repository || 0,
      icon: Package,
      color: 'bg-[var(--gray-100)]',
    },
    {
      title: 'Success Rate',
      count: `${usage.successRate}%`,
      icon: TrendingUp,
      color: 'bg-green-50',
      textColor: 'text-green-600',
    },
  ];

  const usageStats = [
    { title: 'Uses (7d)', value: usage.total7d },
    { title: 'Today', value: usage.today },
    { title: 'Avg Time', value: usage.avgDurationMs ? `${usage.avgDurationMs}ms` : '-' },
    { title: 'Pending', value: pendingCount },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--black)]">
            Allone&apos;s Claude
          </h1>
          <p className="mt-1 text-sm text-[var(--gray-500)]">
            {totalCapabilities} capabilities installed
          </p>
        </div>
        <Link
          href="/admin/claude/capabilities"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--black)] bg-white border border-[var(--gray-200)] rounded-lg hover:bg-[var(--gray-50)] transition-colors"
        >
          View All
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Capability Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 bg-white border border-[var(--gray-200)] rounded-xl"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${stat.color}`}>
                  <Icon className={`h-4 w-4 ${stat.textColor || 'text-[var(--gray-500)]'}`} />
                </div>
              </div>
              <div className={`text-2xl font-semibold ${stat.textColor || 'text-[var(--black)]'}`}>
                {stat.count}
              </div>
              <div className="text-xs text-[var(--gray-500)] mt-0.5">{stat.title}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Usage Stats Row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {usageStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.05 }}
            className="p-4 bg-white border border-[var(--gray-200)] rounded-xl"
          >
            <div className="text-2xl font-semibold text-[var(--black)]">{stat.value}</div>
            <div className="text-xs text-[var(--gray-500)] mt-0.5">{stat.title}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts and Upgrades Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Most Used Capabilities */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-5 bg-white border border-[var(--gray-200)] rounded-xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--gray-100)]">
              <Activity className="h-4 w-4 text-[var(--gray-500)]" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-[var(--black)]">Most Used (7 days)</h2>
              <p className="text-xs text-[var(--gray-500)]">Top capabilities by usage</p>
            </div>
          </div>
          {usage.topCapabilities.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={usage.topCapabilities}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 80, bottom: 5 }}
                >
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--gray-400)' }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 10, fill: 'var(--gray-600)' }}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid var(--gray-200)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" fill="#111111" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-[var(--gray-400)]">
              <p className="text-sm">No usage data yet</p>
            </div>
          )}
        </motion.div>

        {/* Capabilities by Category */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="p-5 bg-white border border-[var(--gray-200)] rounded-xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--gray-100)]">
              <Package className="h-4 w-4 text-[var(--gray-500)]" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-[var(--black)]">By Category</h2>
              <p className="text-xs text-[var(--gray-500)]">Capability distribution</p>
            </div>
          </div>
          {categoryChartData.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryChartData}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 80, bottom: 5 }}
                >
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--gray-400)' }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 10, fill: 'var(--gray-600)' }}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid var(--gray-200)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {categoryChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CATEGORY_COLORS[entry.name] || '#888888'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-[var(--gray-400)]">
              <p className="text-sm">No capabilities</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Top Patterns */}
      {patterns.topPatterns.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-5 bg-white border border-[var(--gray-200)] rounded-xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--gray-100)]">
              <GitBranch className="h-4 w-4 text-[var(--gray-500)]" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-[var(--black)]">Top Patterns</h2>
              <p className="text-xs text-[var(--gray-500)]">
                {patterns.total} patterns tracked · {sessions.total7d} sessions (7d)
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {patterns.topPatterns.map((pattern, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-[var(--gray-50)] rounded-lg"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {pattern.sequence.map((tool, i) => (
                    <span key={i} className="flex items-center">
                      <span className="px-2 py-1 text-xs font-medium bg-white border border-[var(--gray-200)] rounded">
                        {tool}
                      </span>
                      {i < pattern.sequence.length - 1 && (
                        <span className="mx-1 text-[var(--gray-400)]">→</span>
                      )}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[var(--gray-500)]">{pattern.totalUses}x</span>
                  <span
                    className={`px-2 py-0.5 text-xs rounded ${
                      pattern.successRate >= 80
                        ? 'bg-green-50 text-green-600'
                        : pattern.successRate >= 50
                        ? 'bg-yellow-50 text-yellow-600'
                        : 'bg-red-50 text-red-600'
                    }`}
                  >
                    {pattern.successRate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Upgrades */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--gray-100)]">
              <Clock className="h-4 w-4 text-[var(--gray-500)]" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-[var(--black)]">Recent Upgrades</h2>
              <p className="text-xs text-[var(--gray-500)]">
                {verifiedCount} verified · {pendingCount} pending
              </p>
            </div>
          </div>
          <Link
            href="/admin/claude/upgrades"
            className="text-xs text-[var(--gray-500)] hover:text-[var(--black)] transition-colors"
          >
            View all
          </Link>
        </div>

        {upgrades.length > 0 ? (
          <div className="bg-white border border-[var(--gray-200)] rounded-xl divide-y divide-[var(--gray-100)]">
            {upgrades.slice(0, 5).map((upgrade) => {
              const ActionIcon = ACTION_ICONS[upgrade.action] || CheckCircle2;
              return (
                <div
                  key={upgrade.id}
                  className="flex items-center gap-4 p-4 hover:bg-[var(--gray-50)] transition-colors"
                >
                  <div
                    className={`w-8 h-8 flex items-center justify-center rounded-lg ${
                      upgrade.verified ? 'bg-green-50' : 'bg-yellow-50'
                    }`}
                  >
                    <ActionIcon
                      className={`h-4 w-4 ${
                        upgrade.verified ? 'text-green-600' : 'text-yellow-600'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--black)] truncate">
                        {upgrade.capability_name || upgrade.action}
                      </span>
                      {upgrade.capability_category && (
                        <span className="px-2 py-0.5 text-xs bg-[var(--gray-100)] text-[var(--gray-600)] rounded">
                          {upgrade.capability_category}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--gray-500)] truncate">{upgrade.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 text-xs rounded ${
                        upgrade.verified
                          ? 'bg-green-50 text-green-600'
                          : 'bg-yellow-50 text-yellow-600'
                      }`}
                    >
                      {upgrade.verified ? 'Verified' : 'Pending'}
                    </span>
                    <span className="text-xs text-[var(--gray-400)]">
                      {formatTimeAgo(upgrade.reported_at)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 bg-white border border-[var(--gray-200)] rounded-xl text-center">
            <p className="text-sm text-[var(--gray-400)]">No upgrades recorded yet</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
