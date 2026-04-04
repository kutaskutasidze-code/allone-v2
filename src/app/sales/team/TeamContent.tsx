'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  leadCount: number;
  wonCount: number;
  lostCount: number;
  conversionRate: number;
  wonRevenue: number;
  pipelineValue: number;
  overrideEarned: number;
}

interface TeamData {
  period: { start: string; end: string; label: string };
  salespeople: TeamMember[];
  teamTotals: {
    leadCount: number;
    wonCount: number;
    wonRevenue: number;
    supervisorOwn: number;
    supervisorOverride: number;
    supervisorTotal: number;
  };
}

const PERIODS = [
  { value: 'month', label: 'This Month' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'all', label: 'All Time' },
];

const formatCurrency = (v: number) => {
  if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
};

export function TeamContent({ supervisorName }: { supervisorName: string }) {
  const [period, setPeriod] = useState('month');
  const [data, setData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/sales/team?period=${period}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-gray-900 font-display">
          Team Performance
        </h1>
        <p className="mt-1.5 text-sm text-gray-500">
          {supervisorName} · Manage your sales team
        </p>
      </div>

      {/* Period selector */}
      <div className="flex gap-2">
        {PERIODS.map(p => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              period === p.value
                ? 'bg-gray-900 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading || !data ? (
        <div className="p-8 text-center text-sm text-gray-500">Loading...</div>
      ) : (
        <>
          {/* Team Totals */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-5 bg-white border border-gray-100 rounded-xl shadow-sm shadow-black/[0.02]">
              <p className="text-xs text-gray-500 mb-2">Team Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(data.teamTotals.wonRevenue)}</p>
              <p className="text-xs text-gray-400 mt-1">{data.teamTotals.wonCount} deals won</p>
            </div>
            <div className="p-5 bg-white border border-gray-100 rounded-xl shadow-sm shadow-black/[0.02]">
              <p className="text-xs text-gray-500 mb-2">Total Leads</p>
              <p className="text-2xl font-semibold text-gray-900">{data.teamTotals.leadCount}</p>
              <p className="text-xs text-gray-400 mt-1">across team</p>
            </div>
            <div className="p-5 bg-white border border-gray-100 rounded-xl shadow-sm shadow-black/[0.02]">
              <p className="text-xs text-gray-500 mb-2">Your Own (10%)</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(data.teamTotals.supervisorOwn)}</p>
              <p className="text-xs text-gray-400 mt-1">from your deals</p>
            </div>
            <div className="p-5 bg-white border border-gray-100 rounded-xl shadow-sm shadow-black/[0.02]">
              <p className="text-xs text-gray-500 mb-2">Your Override (5%)</p>
              <p className="text-2xl font-semibold text-emerald-600">{formatCurrency(data.teamTotals.supervisorOverride)}</p>
              <p className="text-xs text-gray-400 mt-1">from team deals</p>
            </div>
          </div>

          {/* Supervisor total */}
          <div className="p-5 bg-gray-900 text-white rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Your Total Commission</p>
                <p className="text-3xl font-semibold">{formatCurrency(data.teamTotals.supervisorTotal)}</p>
              </div>
              <div className="text-xs text-gray-400">
                {formatCurrency(data.teamTotals.supervisorOwn)} + {formatCurrency(data.teamTotals.supervisorOverride)}
              </div>
            </div>
          </div>

          {/* Salespeople Table */}
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm shadow-black/[0.02] overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Salesperson</th>
                  <th className="text-right text-[11px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Leads</th>
                  <th className="text-right text-[11px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Won</th>
                  <th className="text-right text-[11px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Conv%</th>
                  <th className="text-right text-[11px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Pipeline</th>
                  <th className="text-right text-[11px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Revenue</th>
                  <th className="text-right text-[11px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Your 5%</th>
                  <th className="w-8 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {data.salespeople.map((m, idx) => (
                  <tr
                    key={m.id}
                    className={`hover:bg-gray-50/50 transition-colors ${idx !== data.salespeople.length - 1 ? 'border-b border-gray-50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm text-gray-900">{m.name}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        {m.email}
                        {m.role === 'supervisor' && <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-50 text-emerald-700">Supervisor</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">{m.leadCount}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">{m.wonCount}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">{(m.conversionRate * 100).toFixed(1)}%</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">{formatCurrency(m.pipelineValue)}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">{formatCurrency(m.wonRevenue)}</td>
                    <td className="px-4 py-3 text-sm text-right text-emerald-600 font-medium">
                      {m.role === 'supervisor' ? '—' : formatCurrency(m.overrideEarned)}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/sales/leads?sales_user_id=${m.id}`} className="text-gray-400 hover:text-gray-900">
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
