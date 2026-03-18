'use client';

import { MoreHorizontal, Play } from 'lucide-react';

interface Activity {
  id: string;
  name: string;
  trigger: string;
  status: 'success' | 'processing' | 'scheduled';
  lastRun: string;
  duration: string;
}

const activities: Activity[] = [
  {
    id: '1',
    name: 'Customer Onboarding Flow',
    trigger: 'New signup',
    status: 'success',
    lastRun: '2 min ago',
    duration: '1.2s',
  },
  {
    id: '2',
    name: 'Invoice Generator',
    trigger: 'Order complete',
    status: 'processing',
    lastRun: 'Running',
    duration: '—',
  },
  {
    id: '3',
    name: 'Lead Scoring Model',
    trigger: 'Form submit',
    status: 'success',
    lastRun: '8 min ago',
    duration: '0.8s',
  },
  {
    id: '4',
    name: 'Weekly Report Digest',
    trigger: 'Schedule',
    status: 'scheduled',
    lastRun: 'Tomorrow, 9:00 AM',
    duration: '—',
  },
  {
    id: '5',
    name: 'Slack Notifications',
    trigger: 'API webhook',
    status: 'success',
    lastRun: '15 min ago',
    duration: '0.3s',
  },
];

function LiveIndicator() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
    </span>
  );
}

function StatusBadge({ status }: { status: Activity['status'] }) {
  if (status === 'success') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Success
      </span>
    );
  }

  if (status === 'processing') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
        <LiveIndicator />
        Processing
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#f4f4f5] text-[#52525b]">
      <span className="w-1.5 h-1.5 rounded-full bg-[#a1a1aa]" />
      Scheduled
    </span>
  );
}

export function ActivityTable() {
  return (
    <div className="bg-white border border-[#e4e4e7] rounded-2xl overflow-hidden hover:shadow-sm transition-shadow">
      <div className="px-6 py-4 border-b border-[#e4e4e7]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#f4f4f5] flex items-center justify-center">
              <Play className="w-4 h-4 text-[#52525b]" />
            </div>
            <div>
              <h3 className="text-[#0a0a0a] text-base font-semibold font-display">Recent Activity</h3>
              <p className="text-[#71717a] text-xs">Latest automation runs</p>
            </div>
          </div>
          <button className="text-xs text-[#3d5a80] font-medium hover:text-[#5a7a9e] transition-colors">
            View all
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#e4e4e7] bg-[#fafafa]">
              <th className="text-left text-[10px] font-semibold text-[#71717a] uppercase tracking-wider px-6 py-2.5">
                Automation
              </th>
              <th className="text-left text-[10px] font-semibold text-[#71717a] uppercase tracking-wider px-6 py-2.5">
                Trigger
              </th>
              <th className="text-left text-[10px] font-semibold text-[#71717a] uppercase tracking-wider px-6 py-2.5">
                Status
              </th>
              <th className="text-left text-[10px] font-semibold text-[#71717a] uppercase tracking-wider px-6 py-2.5">
                Last Run
              </th>
              <th className="text-left text-[10px] font-semibold text-[#71717a] uppercase tracking-wider px-6 py-2.5">
                Duration
              </th>
              <th className="w-10 px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {activities.map((activity) => (
              <tr
                key={activity.id}
                className="border-b border-[#e4e4e7] last:border-b-0 hover:bg-[#fafafa] transition-colors"
              >
                <td className="px-6 py-3">
                  <span className="text-sm font-medium text-[#0a0a0a]">{activity.name}</span>
                </td>
                <td className="px-6 py-3">
                  <span className="text-sm text-[#52525b]">{activity.trigger}</span>
                </td>
                <td className="px-6 py-3">
                  <StatusBadge status={activity.status} />
                </td>
                <td className="px-6 py-3">
                  <span className="text-sm text-[#52525b]">{activity.lastRun}</span>
                </td>
                <td className="px-6 py-3">
                  <span className="text-sm text-[#52525b] font-mono">{activity.duration}</span>
                </td>
                <td className="px-4 py-3">
                  <button className="p-1 rounded-lg hover:bg-[#f4f4f5] text-[#a1a1aa] hover:text-[#52525b] transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
