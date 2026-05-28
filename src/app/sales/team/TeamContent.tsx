'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

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

function StatCard({ label, value, sublabel, highlight = false }: { label: string; value: string; sublabel: string; highlight?: boolean }) {
  return (
    <div className="p-5 bg-[var(--bg-surface)] border border-[var(--allone-line-soft)] rounded-xl shadow-sm shadow-black/[0.02]">
      <p className="text-xs text-[var(--ink-500)] mb-2">{label}</p>
      <p className={`text-2xl font-semibold ${highlight ? 'text-emerald-600' : 'text-[var(--ink-900)]'}`}>{value}</p>
      <p className="text-xs text-[var(--ink-400)] mt-1">{sublabel}</p>
    </div>
  );
}

export function TeamContent({ supervisorName }: { supervisorName: string }) {
  const [period, setPeriod] = useState('month');
  const [data, setData] = useState<TeamData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setData(null);
    setError('');
    fetch(`/api/sales/team?period=${period}`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then(setData)
      .catch(() => setError('Failed to load team data'));
  }, [period]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--ink-900)] font-display">
          Team Performance
        </h1>
        <p className="mt-1.5 text-sm text-[var(--ink-500)]">
          {supervisorName} · Manage your sales team
        </p>
      </div>

      <div className="flex gap-2">
        {PERIODS.map(p => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              period === p.value
                ? 'bg-[var(--ink-900)] text-white shadow-sm'
                : 'bg-[var(--bg-surface)] border border-[var(--allone-line)] text-[var(--ink-700)] hover:border-[var(--allone-line-strong)]'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">{error}</div>
      ) : !data ? (
        <div className="p-8 text-center text-sm text-[var(--ink-500)]">Loading...</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard label="Team Revenue" value={formatCurrency(data.teamTotals.wonRevenue)} sublabel={`${data.teamTotals.wonCount} deals won`} />
            <StatCard label="Total Leads" value={String(data.teamTotals.leadCount)} sublabel="across team" />
            <StatCard label="Your Own (10%)" value={formatCurrency(data.teamTotals.supervisorOwn)} sublabel="from your deals" />
            <StatCard label="Your Override (5%)" value={formatCurrency(data.teamTotals.supervisorOverride)} sublabel="from team deals" highlight />
          </div>

          <div className="p-5 bg-[var(--ink-900)] text-white rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-[var(--ink-400)] mb-1">Your Total Commission</p>
              <p className="text-3xl font-semibold">{formatCurrency(data.teamTotals.supervisorTotal)}</p>
            </div>
            <div className="text-xs text-[var(--ink-400)]">
              {formatCurrency(data.teamTotals.supervisorOwn)} + {formatCurrency(data.teamTotals.supervisorOverride)}
            </div>
          </div>

          <div className="bg-[var(--bg-surface)] border border-[var(--allone-line-soft)] rounded-xl shadow-sm shadow-black/[0.02] overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-[var(--allone-line-soft)]">
                  <th className="text-left text-[11px] font-medium text-[var(--ink-400)] uppercase tracking-wider px-4 py-3">Salesperson</th>
                  <th className="text-right text-[11px] font-medium text-[var(--ink-400)] uppercase tracking-wider px-4 py-3">Leads</th>
                  <th className="text-right text-[11px] font-medium text-[var(--ink-400)] uppercase tracking-wider px-4 py-3">Won</th>
                  <th className="text-right text-[11px] font-medium text-[var(--ink-400)] uppercase tracking-wider px-4 py-3">Conv%</th>
                  <th className="text-right text-[11px] font-medium text-[var(--ink-400)] uppercase tracking-wider px-4 py-3">Pipeline</th>
                  <th className="text-right text-[11px] font-medium text-[var(--ink-400)] uppercase tracking-wider px-4 py-3">Revenue</th>
                  <th className="text-right text-[11px] font-medium text-[var(--ink-400)] uppercase tracking-wider px-4 py-3">Your 5%</th>
                  <th className="w-8 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {data.salespeople.map((m, idx) => (
                  <tr
                    key={m.id}
                    className={`hover:bg-[var(--bg-surface-alt)]/50 transition-colors ${idx !== data.salespeople.length - 1 ? 'border-b border-[var(--allone-line-soft)]' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm text-[var(--ink-900)]">{m.name}</div>
                      <div className="text-xs text-[var(--ink-500)] flex items-center gap-2">
                        {m.email}
                        {m.role === 'supervisor' && <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-50 text-emerald-700">Supervisor</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-[var(--ink-700)]">{m.leadCount}</td>
                    <td className="px-4 py-3 text-sm text-right text-[var(--ink-900)] font-medium">{m.wonCount}</td>
                    <td className="px-4 py-3 text-sm text-right text-[var(--ink-700)]">{(m.conversionRate * 100).toFixed(1)}%</td>
                    <td className="px-4 py-3 text-sm text-right text-[var(--ink-700)]">{formatCurrency(m.pipelineValue)}</td>
                    <td className="px-4 py-3 text-sm text-right text-[var(--ink-900)] font-medium">{formatCurrency(m.wonRevenue)}</td>
                    <td className="px-4 py-3 text-sm text-right text-emerald-600 font-medium">
                      {m.role === 'supervisor' ? '—' : formatCurrency(m.overrideEarned)}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/sales/leads?sales_user_id=${m.id}`} className="text-[var(--ink-400)] hover:text-[var(--ink-900)]">
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
