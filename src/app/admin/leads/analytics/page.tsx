'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { LEAD_STATUSES, LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from '@/lib/validations/leads';

type Status = typeof LEAD_STATUSES[number]['value'];
type DailyRow = { date: string } & Record<Status, number>;

interface Overview {
  statusCounts: Record<string, number>;
  dailyNew: Record<string, number>;
  totalLeads: number;
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

const CALL_STATUSES = ['contacted', 'callback', 'qualified', 'not_interested', 'unavailable'] as const;

export default function LeadsAnalyticsPage() {
  const [data, setData] = useState<DailyRow[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/admin/leads/analytics/status-history')
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Failed')))
      .then(json => {
        if (active) {
          setData(json.data || []);
          setOverview(json.overview || null);
        }
      })
      .catch(() => { if (active) setError('Failed to load analytics'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const { totalsByStatus, grandTotal, totalCalls } = useMemo(() => {
    const totals = {} as Record<Status, number>;
    let total = 0;
    let calls = 0;
    for (const { value } of LEAD_STATUSES) {
      const sum = data.reduce((acc, row) => acc + (row[value] ?? 0), 0);
      totals[value] = sum;
      total += sum;
      if (CALL_STATUSES.includes(value as typeof CALL_STATUSES[number])) calls += sum;
    }
    return { totalsByStatus: totals, grandTotal: total, totalCalls: calls };
  }, [data]);

  const pieData = useMemo(() => {
    if (!overview) return [];
    return LEAD_STATUSES
      .map(s => ({
        name: LEAD_STATUS_LABELS[s.value] ?? s.value,
        value: overview.statusCounts[s.value] || 0,
        color: LEAD_STATUS_COLORS[s.value],
      }))
      .filter(d => d.value > 0);
  }, [overview]);

  const dailyNewData = useMemo(() => {
    if (!overview) return [];
    return Object.entries(overview.dailyNew)
      .map(([date, count]) => ({ date, newLeads: count }));
  }, [overview]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-400">
        Loading analytics...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link
            href="/admin/leads"
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Leads
          </Link>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900 font-display">
            Lead Analytics
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Last 30 days · {overview?.totalLeads?.toLocaleString() || 0} total leads
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {LEAD_STATUSES.map((s) => (
          <div
            key={s.value}
            className="p-3 bg-white border border-gray-100 rounded-lg shadow-sm shadow-black/[0.02]"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className="w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: LEAD_STATUS_COLORS[s.value] }}
              />
              <span className="text-[11px] text-gray-500 uppercase tracking-wider">{s.label}</span>
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {overview?.statusCounts[s.value]?.toLocaleString() ?? totalsByStatus[s.value] ?? 0}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Call Activity Chart */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl shadow-sm shadow-black/[0.02] p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Daily Call Activity</h2>
            <span className="text-xs text-gray-500">{totalCalls} total calls</span>
          </div>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 5, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  interval={4}
                />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} allowDecimals={false} />
                <Tooltip
                  labelFormatter={(label: string) => formatDate(label)}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="contacted" stackId="calls" fill={LEAD_STATUS_COLORS.contacted} name="Contacted" />
                <Bar dataKey="callback" stackId="calls" fill={LEAD_STATUS_COLORS.callback} name="Callback" />
                <Bar dataKey="qualified" stackId="calls" fill={LEAD_STATUS_COLORS.qualified} name="Qualified" />
                <Bar dataKey="not_interested" stackId="calls" fill={LEAD_STATUS_COLORS.not_interested} name="Not Interested" />
                <Bar dataKey="unavailable" stackId="calls" fill={LEAD_STATUS_COLORS.unavailable} name="Unavailable" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Pie */}
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm shadow-black/[0.02] p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Status Distribution</h2>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [value.toLocaleString(), name]}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 10 }}
                  formatter={(value: string) => value}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Daily New Leads + All Status Changes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* New Leads Line Chart */}
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm shadow-black/[0.02] p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">New Leads per Day</h2>
            <span className="text-xs text-gray-500">
              {dailyNewData.reduce((s, d) => s + d.newLeads, 0)} in period
            </span>
          </div>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyNewData} margin={{ top: 5, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  interval={4}
                />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} allowDecimals={false} />
                <Tooltip
                  labelFormatter={(label: string) => formatDate(label)}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
                <Line
                  type="monotone"
                  dataKey="newLeads"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  name="New Leads"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* All Status Changes Stacked Bar */}
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm shadow-black/[0.02] p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">All Status Changes</h2>
            <span className="text-xs text-gray-500">{grandTotal} total transitions</span>
          </div>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 5, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  interval={4}
                />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} allowDecimals={false} />
                <Tooltip
                  labelFormatter={(label: string) => formatDate(label)}
                  formatter={(value: number, name: string) => [value, LEAD_STATUS_LABELS[name] ?? name]}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
                {LEAD_STATUSES.map((s) => (
                  <Bar
                    key={s.value}
                    dataKey={s.value}
                    stackId="a"
                    fill={LEAD_STATUS_COLORS[s.value]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
