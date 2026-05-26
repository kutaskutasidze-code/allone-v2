'use client';

import { useState, useEffect } from 'react';
import { Users, Phone, Mail, TrendingUp, Target, Globe } from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalLeads: number;
    newInPeriod: number;
    withPhone: number;
    withEmail: number;
    phoneRate: number;
    emailRate: number;
  };
  leads: {
    byStatus: Record<string, number>;
    byService: Record<string, number>;
    dailyTrend: Record<string, number>;
  };
  period: { days: number };
}

const SERVICE_NAMES: Record<string, string> = {
  chatbots: 'Chatbots',
  custom_ai: 'Custom AI',
  automation: 'Automation',
  website: 'Website',
  consulting: 'Consulting',
  unclassified: 'Unclassified',
};

const STATUS_NAMES: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  won: 'Won',
  lost: 'Lost',
};

const STATUS_COLORS: Record<string, string> = {
  new: '#3b82f6',
  contacted: '#f59e0b',
  qualified: '#8b5cf6',
  won: '#10b981',
  lost: '#6b7280',
};

function DistributionBar({ data, names, colors }: { data: Record<string, number>; names: Record<string, string>; colors?: Record<string, string> }) {
  const total = Object.values(data).reduce((sum, val) => sum + val, 0);
  if (total === 0) return <p className="text-sm text-gray-400">No data</p>;
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const palette = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280'];

  return (
    <div className="space-y-2.5">
      {entries.map(([key, value], index) => {
        const pct = Math.round((value / total) * 100);
        const color = colors?.[key] || palette[index % palette.length];
        return (
          <div key={key}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-600">{names[key] || key}</span>
              <span className="text-gray-400">{value} ({pct}%)</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
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
    setIsLoading(true);
    fetch(`/api/sales/analytics?days=${days}`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then(result => { setData(result.data); setError(''); })
      .catch(() => setError('Failed to load analytics'))
      .finally(() => setIsLoading(false));
  }, [days]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900 font-display">Analytics</h1>
          <p className="mt-1.5 text-sm text-gray-500">Lead performance overview</p>
        </div>
        <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">{error || 'Failed to load'}</div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Leads', value: data.overview.totalLeads.toLocaleString(), sub: `${data.overview.newInPeriod} new in last ${data.period.days}d`, icon: Users },
    { label: 'With Phone', value: data.overview.withPhone.toLocaleString(), sub: `${data.overview.phoneRate}% of all leads`, icon: Phone },
    { label: 'With Email', value: data.overview.withEmail.toLocaleString(), sub: `${data.overview.emailRate}% of all leads`, icon: Mail },
    { label: 'New This Period', value: data.overview.newInPeriod.toLocaleString(), sub: `Last ${data.period.days} days`, icon: TrendingUp },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900 font-display">Analytics</h1>
          <p className="mt-1.5 text-sm text-gray-500">Lead performance overview</p>
        </div>
        <div className="flex gap-1">
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                days === d
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="p-5 bg-white border border-gray-100 rounded-xl shadow-sm shadow-black/[0.02]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-500">{card.label}</span>
                <Icon className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="p-5 bg-white border border-gray-100 rounded-xl shadow-sm shadow-black/[0.02]">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">By Status</h3>
          </div>
          <DistributionBar data={data.leads.byStatus} names={STATUS_NAMES} colors={STATUS_COLORS} />
        </div>

        <div className="p-5 bg-white border border-gray-100 rounded-xl shadow-sm shadow-black/[0.02]">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">By Service</h3>
          </div>
          <DistributionBar data={data.leads.byService} names={SERVICE_NAMES} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="p-5 bg-white border border-gray-100 rounded-xl shadow-sm shadow-black/[0.02]">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Data Quality</h3>
          <p className="text-xs text-gray-500 mb-4">Contact information availability</p>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">Has Phone</span>
                <span className="text-gray-900 font-medium">{data.overview.phoneRate}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${data.overview.phoneRate}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">Has Email</span>
                <span className="text-gray-900 font-medium">{data.overview.emailRate}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${data.overview.emailRate}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 bg-white border border-gray-100 rounded-xl shadow-sm shadow-black/[0.02]">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Daily Activity</h3>
          <p className="text-xs text-gray-500 mb-4">New leads per day (last {data.period.days} days)</p>
          <div className="flex items-end gap-0.5 h-24">
            {(() => {
              const entries = Object.entries(data.leads.dailyTrend).sort((a, b) => a[0].localeCompare(b[0]));
              const max = Math.max(...entries.map(([, v]) => v), 1);
              return entries.slice(-Math.min(entries.length, 30)).map(([date, count]) => (
                <div
                  key={date}
                  className="flex-1 bg-gray-900 rounded-t-sm min-w-[3px] hover:bg-gray-700 transition-colors"
                  style={{ height: `${(count / max) * 100}%` }}
                  title={`${date}: ${count} leads`}
                />
              ));
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
