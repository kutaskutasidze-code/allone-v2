'use client';

import { useEffect, useState } from 'react';
import { DollarSign, Users } from 'lucide-react';

interface CommissionData {
  role: 'salesperson' | 'supervisor';
  period: { start: string; end: string; label: string };
  wonCount: number;
  wonValue: number;
  ownCommission: number;
  overrideCommission: number;
  totalCommission: number;
}

const formatCurrency = (v: number) => {
  if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
};

export function CommissionWidget() {
  const [data, setData] = useState<CommissionData | null>(null);
  const [allTime, setAllTime] = useState<CommissionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/sales/commissions?period=month').then(r => r.json()),
      fetch('/api/sales/commissions?period=all').then(r => r.json()),
    ])
      .then(([month, all]) => {
        setData(month);
        setAllTime(all);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-5 bg-white border border-gray-100 rounded-xl shadow-sm shadow-black/[0.02]">
        <div className="h-4 w-24 bg-gray-100 rounded animate-pulse mb-3" />
        <div className="h-8 w-32 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  if (!data) return null;

  const isSupervisor = data.role === 'supervisor';

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* This Month */}
      <div className="p-5 bg-white border border-gray-100 rounded-xl shadow-sm shadow-black/[0.02]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-50">
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Commission — This Month</h2>
            <p className="text-xs text-gray-500">{data.wonCount} deals won · {formatCurrency(data.wonValue)} revenue</p>
          </div>
        </div>
        <p className="text-3xl font-semibold text-gray-900">{formatCurrency(data.totalCommission)}</p>
        {isSupervisor && (
          <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 space-y-1">
            <div className="flex justify-between">
              <span>Own deals (10%)</span>
              <span className="text-gray-900 font-medium">{formatCurrency(data.ownCommission)}</span>
            </div>
            <div className="flex justify-between">
              <span>Team override (5%)</span>
              <span className="text-gray-900 font-medium">{formatCurrency(data.overrideCommission)}</span>
            </div>
          </div>
        )}
      </div>

      {/* All Time */}
      <div className="p-5 bg-white border border-gray-100 rounded-xl shadow-sm shadow-black/[0.02]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50">
            <Users className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Commission — All Time</h2>
            <p className="text-xs text-gray-500">{allTime?.wonCount || 0} deals · {formatCurrency(allTime?.wonValue || 0)} revenue</p>
          </div>
        </div>
        <p className="text-3xl font-semibold text-gray-900">{formatCurrency(allTime?.totalCommission || 0)}</p>
      </div>
    </div>
  );
}
