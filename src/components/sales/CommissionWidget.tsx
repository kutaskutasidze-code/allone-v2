'use client';

import { useEffect, useState } from 'react';
import { DollarSign, Users } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface CommissionData {
  role: 'salesperson' | 'supervisor' | 'admin';
  period: { start: string; end: string; label: string };
  wonCount: number;
  wonValue: number;
  ownCommission: number;
  overrideCommission: number;
  totalCommission: number;
}

export function CommissionWidget() {
  const [periods, setPeriods] = useState<{ month: CommissionData; all: CommissionData } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/sales/commissions?period=month').then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))),
      fetch('/api/sales/commissions?period=all').then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))),
    ])
      .then(([month, all]) => {
        if (month?.wonCount === undefined || all?.wonCount === undefined) {
          setError('Invalid commission data received');
          return;
        }
        setPeriods({ month, all });
      })
      .catch(() => setError('Failed to load commission data'));
  }, []);

  if (error) {
    return (
      <div className="p-5 bg-red-50 border border-red-100 rounded-[var(--radius-md)] text-red-600 text-sm">
        {error}
      </div>
    );
  }

  if (!periods) {
    return (
      <div className="p-5 bg-[var(--bg-surface)] border border-[var(--allone-line-soft)] rounded-[var(--radius-md)] shadow-[var(--shadow-xs)] shadow-black/[0.02]">
        <div className="h-4 w-24 bg-[var(--bg-sunken)] rounded animate-pulse mb-3" />
        <div className="h-8 w-32 bg-[var(--bg-sunken)] rounded animate-pulse" />
      </div>
    );
  }

  const { month, all } = periods;
  const isSupervisor = month.role === 'supervisor' || month.role === 'admin';

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="p-5 bg-[var(--bg-surface)] border border-[var(--allone-line-soft)] rounded-[var(--radius-md)] shadow-[var(--shadow-xs)] shadow-black/[0.02]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-sm)] bg-emerald-50">
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--ink-900)]">Commission — This Month</h2>
            <p className="text-xs text-[var(--ink-500)]">{month.wonCount} deals won · {formatCurrency(month.wonValue)} revenue</p>
          </div>
        </div>
        <p className="text-3xl font-semibold text-[var(--ink-900)]">{formatCurrency(month.totalCommission)}</p>
        {isSupervisor && (
          <div className="mt-3 pt-3 border-t border-[var(--allone-line-soft)] text-xs text-[var(--ink-500)] space-y-1">
            <div className="flex justify-between">
              <span>Own deals (10%)</span>
              <span className="text-[var(--ink-900)] font-medium">{formatCurrency(month.ownCommission)}</span>
            </div>
            <div className="flex justify-between">
              <span>Team override (5%)</span>
              <span className="text-[var(--ink-900)] font-medium">{formatCurrency(month.overrideCommission)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-5 bg-[var(--bg-surface)] border border-[var(--allone-line-soft)] rounded-[var(--radius-md)] shadow-[var(--shadow-xs)] shadow-black/[0.02]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--bg-surface-alt)]">
            <Users className="h-4 w-4 text-[var(--ink-700)]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--ink-900)]">Commission — All Time</h2>
            <p className="text-xs text-[var(--ink-500)]">{all.wonCount} deals · {formatCurrency(all.wonValue)} revenue</p>
          </div>
        </div>
        <p className="text-3xl font-semibold text-[var(--ink-900)]">{formatCurrency(all.totalCommission)}</p>
      </div>
    </div>
  );
}
