'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, ArrowRight } from 'lucide-react';
import { LEAD_STATUSES, LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from '@/lib/validations/leads';

interface RepActivity {
  id: string;
  name: string;
  email: string;
  role?: string;
  assignedToday: number;
  calledToday: number;
  byStatus: Record<string, number>;
}

interface ApiResponse {
  data: {
    reps: RepActivity[];
    totals: { assignedToday: number; calledToday: number };
  };
}

export function DailyActivityCard() {
  const [data, setData] = useState<ApiResponse['data'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/leads/daily-activity')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((json: ApiResponse) => { if (active) setData(json.data); })
      .catch(() => {})
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  const callStatuses = LEAD_STATUSES.filter(s => s.value !== 'new');

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm shadow-black/[0.02] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900">Today's call activity</h2>
        </div>
        <Link
          href="/admin/leads/assign"
          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors"
        >
          Assign more
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-[11px] text-gray-500 uppercase tracking-wider">
              <th className="text-left px-5 py-2.5 font-medium">Rep</th>
              <th className="text-right px-3 py-2.5 font-medium">Assigned today</th>
              <th className="text-right px-3 py-2.5 font-medium">Called today</th>
              {callStatuses.map(s => (
                <th key={s.value} className="text-right px-3 py-2.5 font-medium" title={LEAD_STATUS_LABELS[s.value]}>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: LEAD_STATUS_COLORS[s.value] }} />
                    <span className="hidden md:inline">{s.label}</span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={2 + callStatuses.length + 1} className="px-5 py-8 text-center text-xs text-gray-400">Loading…</td></tr>
            ) : !data || data.reps.length === 0 ? (
              <tr><td colSpan={2 + callStatuses.length + 1} className="px-5 py-8 text-center text-xs text-gray-400">No sales reps configured yet.</td></tr>
            ) : (
              data.reps.map(rep => (
                <tr key={rep.id} className="border-t border-gray-50">
                  <td className="px-5 py-3">
                    <span className="font-medium text-gray-900">{rep.name}</span>
                    {rep.role === 'supervisor' && (
                      <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">supervisor</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-gray-700">{rep.assignedToday}</td>
                  <td className="px-3 py-3 text-right tabular-nums font-semibold text-gray-900">{rep.calledToday}</td>
                  {callStatuses.map(s => (
                    <td key={s.value} className="px-3 py-3 text-right tabular-nums text-gray-500">
                      {rep.byStatus[s.value] || 0}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
