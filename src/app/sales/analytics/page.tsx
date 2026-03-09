'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Mail,
  MousePointer,
  MessageSquare,
  Database,
  TrendingUp,
  Globe,
  Target,
} from 'lucide-react';
import { PageHeader } from '@/components/admin';

interface AnalyticsData {
  overview: {
    totalLeads: number;
    scrapedLeads: number;
    leadsWithEmail: number;
    leadsWithPhone: number;
    emailRate: number;
    phoneRate: number;
  };
  leads: {
    byStatus: Record<string, number>;
    byService: Record<string, number>;
    byCountry: Record<string, number>;
    dailyTrend: Record<string, number>;
  };
  campaigns: {
    totalSent: number;
    totalOpened: number;
    totalReplied: number;
    activeCampaigns: number;
    openRate: number;
    replyRate: number;
  };
  sources: {
    activeCount: number;
    totalCount: number;
    totalLeads: number;
  };
  period: {
    days: number;
  };
}

const SERVICE_NAMES: Record<string, string> = {
  chatbots: 'AI Chatbots',
  custom_ai: 'Custom AI',
  automation: 'Automation',
  website: 'Website',
  consulting: 'Consulting',
  unclassified: 'Unclassified',
};

const COUNTRY_NAMES: Record<string, string> = {
  KZ: 'Kazakhstan',
  UZ: 'Uzbekistan',
  GE: 'Georgia',
  TR: 'Turkey',
  AM: 'Armenia',
  AZ: 'Azerbaijan',
  unknown: 'Unknown',
};

const STATUS_NAMES: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  won: 'Won',
  lost: 'Lost',
};

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  color = 'gray',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subValue?: string;
  color?: 'gray' | 'green' | 'blue' | 'purple';
}) {
  const colorClasses: Record<string, string> = {
    gray: 'bg-[var(--gray-100)] text-[var(--gray-600)]',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="bg-white border border-[var(--gray-200)] rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--gray-500)] mb-1">{label}</p>
          <p className="text-2xl font-semibold text-[var(--black)]">{value}</p>
          {subValue && <p className="text-xs text-[var(--gray-400)] mt-1">{subValue}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function DistributionBar({
  data,
  names,
  colors,
}: {
  data: Record<string, number>;
  names: Record<string, string>;
  colors: string[];
}) {
  const total = Object.values(data).reduce((sum, val) => sum + val, 0);
  if (total === 0) return <p className="text-sm text-[var(--gray-400)]">No data</p>;

  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-2">
      {entries.map(([key, value], index) => {
        const percentage = Math.round((value / total) * 100);
        return (
          <div key={key}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[var(--gray-600)]">{names[key] || key}</span>
              <span className="text-[var(--gray-400)]">
                {value} ({percentage}%)
              </span>
            </div>
            <div className="h-2 bg-[var(--gray-100)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: colors[index % colors.length],
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchAnalytics();
  }, [days]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/sales/analytics?days=${days}`);
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const result = await res.json();
      setData(result.data);
    } catch (err) {
      setError('Failed to load analytics');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-[var(--gray-200)] border-t-[var(--black)] rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytics" description="Lead generation and campaign performance" />
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
          {error || 'Failed to load analytics data'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Analytics" description="Lead generation and campaign performance" />
        <div className="flex rounded-lg bg-[var(--gray-100)] p-0.5">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                days === d
                  ? 'bg-white text-[var(--black)] shadow-sm'
                  : 'text-[var(--gray-500)] hover:text-[var(--black)]'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          icon={Users}
          label="Total Leads"
          value={data.overview.totalLeads.toLocaleString()}
          subValue={`${data.overview.scrapedLeads} scraped`}
        />
        <StatCard
          icon={Mail}
          label="Emails Sent"
          value={data.campaigns.totalSent.toLocaleString()}
          subValue={`${data.campaigns.openRate}% open rate`}
          color="blue"
        />
        <StatCard
          icon={MousePointer}
          label="Email Opens"
          value={data.campaigns.totalOpened.toLocaleString()}
          subValue={`${data.campaigns.activeCampaigns} active campaigns`}
          color="green"
        />
        <StatCard
          icon={MessageSquare}
          label="Replies"
          value={data.campaigns.totalReplied.toLocaleString()}
          subValue={`${data.campaigns.replyRate}% reply rate`}
          color="purple"
        />
      </motion.div>

      {/* Data Quality */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="bg-white border border-[var(--gray-200)] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-4 h-4 text-[var(--gray-400)]" />
            <h3 className="font-medium text-[var(--black)]">Data Quality</h3>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[var(--gray-500)]">Has Email</span>
                <span className="font-medium">{data.overview.emailRate}%</span>
              </div>
              <div className="h-2 bg-[var(--gray-100)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${data.overview.emailRate}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[var(--gray-500)]">Has Phone</span>
                <span className="font-medium">{data.overview.phoneRate}%</span>
              </div>
              <div className="h-2 bg-[var(--gray-100)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${data.overview.phoneRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[var(--gray-200)] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-[var(--gray-400)]" />
            <h3 className="font-medium text-[var(--black)]">Sources</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-[var(--gray-500)]">Active Sources</span>
              <span className="text-sm font-medium">{data.sources.activeCount} / {data.sources.totalCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[var(--gray-500)]">Total from Sources</span>
              <span className="text-sm font-medium">{data.sources.totalLeads.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[var(--gray-200)] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-4 h-4 text-[var(--gray-400)]" />
            <h3 className="font-medium text-[var(--black)]">Email Performance</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-[var(--gray-500)]">Open Rate</span>
              <span className="text-sm font-medium text-green-600">{data.campaigns.openRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[var(--gray-500)]">Reply Rate</span>
              <span className="text-sm font-medium text-blue-600">{data.campaigns.replyRate}%</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Distributions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="bg-white border border-[var(--gray-200)] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-[var(--gray-400)]" />
            <h3 className="font-medium text-[var(--black)]">By Service</h3>
          </div>
          <DistributionBar
            data={data.leads.byService}
            names={SERVICE_NAMES}
            colors={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280']}
          />
        </div>

        <div className="bg-white border border-[var(--gray-200)] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-[var(--gray-400)]" />
            <h3 className="font-medium text-[var(--black)]">By Country</h3>
          </div>
          <DistributionBar
            data={data.leads.byCountry}
            names={COUNTRY_NAMES}
            colors={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444']}
          />
        </div>

        <div className="bg-white border border-[var(--gray-200)] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-[var(--gray-400)]" />
            <h3 className="font-medium text-[var(--black)]">By Status</h3>
          </div>
          <DistributionBar
            data={data.leads.byStatus}
            names={STATUS_NAMES}
            colors={['#6b7280', '#3b82f6', '#f59e0b', '#10b981', '#ef4444']}
          />
        </div>
      </motion.div>
    </div>
  );
}
