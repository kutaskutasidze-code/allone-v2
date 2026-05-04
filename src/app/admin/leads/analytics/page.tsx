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
} from 'recharts';
import { LEAD_STATUSES, LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from '@/lib/validations/leads';

type Status = typeof LEAD_STATUSES[number]['value'];
type DailyRow = { date: string } & Record<Status, number>;

function formatDate(d: string) {
  return new Date(d + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export default function LeadsAnalyticsPage() {
  const [data, setData] = useState<DailyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/admin/leads/analytics/status-history')
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Failed')))
      .then(json => { if (active) setData(json.data || []); })
      .catch(() => { if (active) setError('Failed to load analytics'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const { totalsByStatus, grandTotal } = useMemo(() => {
    const totals = {} as Record<Status, number>;
    let total = 0;
    for (const { value } of LEAD_STATUSES) {
      const sum = data.reduce((acc, row) => acc + (row[value] ?? 0), 0);
      totals[value] = sum;
      total += sum;
    }
    return { totalsByStatus: totals, grandTotal: total };
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between mb-10">
        <div>
          <Link
            href="/admin/leads"
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Leads
          </Link>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900 font-display">
            Lead Status Analytics
          </h1>
          <p className="mt-1.5 text-sm text-gray-500">
            Status changes per day over the last 30 days
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

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
              {totalsByStatus[s.value] ?? 0}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm shadow-black/[0.02] p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Daily Status Changes</h2>
          <span className="text-xs text-gray-500">{grandTotal} total transitions</span>
        </div>
        <div style={{ width: '100%', height: 360 }}>
          {loading ? (
            <div className="h-full flex items-center justify-center text-sm text-gray-400">
              Loading...
            </div>
          ) : (
            <ResponsiveContainer>
              <BarChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  interval={2}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  allowDecimals={false}
                />
                <Tooltip
                  labelFormatter={(label: string) => formatDate(label)}
                  formatter={(value: number, name: string) => [value, LEAD_STATUS_LABELS[name] ?? name]}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
                <Legend
                  formatter={(value: string) => LEAD_STATUS_LABELS[value] ?? value}
                  wrapperStyle={{ fontSize: 11 }}
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
          )}
        </div>
      </div>
    </div>
  );
}
