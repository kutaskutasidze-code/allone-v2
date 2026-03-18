'use client';

import { CheckCircle2, Loader2, Clock } from 'lucide-react';

const automations = [
  { name: 'Email Campaign Sync', trigger: 'Schedule', status: 'success', lastRun: '2 min ago', duration: '1.2s' },
  { name: 'Lead Scoring Update', trigger: 'Webhook', status: 'success', lastRun: '15 min ago', duration: '3.4s' },
  { name: 'Slack Notifications', trigger: 'Event', status: 'running', lastRun: 'Now', duration: '—' },
  { name: 'Invoice Processing', trigger: 'Manual', status: 'success', lastRun: '1 hour ago', duration: '8.2s' },
  { name: 'Data Backup', trigger: 'Schedule', status: 'scheduled', lastRun: '11:00 PM', duration: '—' },
  { name: 'Customer Onboarding', trigger: 'Webhook', status: 'success', lastRun: '2 hours ago', duration: '2.1s' },
];

function StatusBadge({ status, compact = false }: { status: string; compact?: boolean }) {
  const sizeClass = compact ? 'text-[8px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5';
  const iconSize = compact ? 'w-2 h-2' : 'w-3 h-3';

  if (status === 'success') {
    return (
      <span className={`inline-flex items-center gap-0.5 rounded-full bg-emerald-50 text-emerald-600 font-medium ${sizeClass}`}>
        <CheckCircle2 className={iconSize} />
        {!compact && 'Success'}
      </span>
    );
  }
  if (status === 'running') {
    return (
      <span className={`inline-flex items-center gap-0.5 rounded-full bg-blue-50 text-blue-600 font-medium ${sizeClass}`}>
        <Loader2 className={`${iconSize} animate-spin`} />
        {!compact && 'Running'}
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full bg-zinc-100 text-zinc-500 font-medium ${sizeClass}`}>
      <Clock className={iconSize} />
      {!compact && 'Scheduled'}
    </span>
  );
}

interface RecentAutomationsProps {
  compact?: boolean;
}

export function RecentAutomations({ compact = false }: RecentAutomationsProps) {
  // Show fewer items in compact mode
  const displayAutomations = compact ? automations.slice(0, 4) : automations;

  if (compact) {
    return (
      <div className="bg-white border border-[#e4e4e7] rounded-lg p-2.5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[#0a0a0a] text-xs font-semibold font-display">Recent Automations</h3>
          <button className="text-[8px] text-[#3d5a80] font-medium hover:text-[#5a7a9e] transition-colors">
            View all
          </button>
        </div>

        <div className="overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#f4f4f5]">
                <th className="text-left text-[8px] font-medium text-[#a1a1aa] uppercase tracking-wider pb-1.5">Name</th>
                <th className="text-left text-[8px] font-medium text-[#a1a1aa] uppercase tracking-wider pb-1.5">Status</th>
                <th className="text-left text-[8px] font-medium text-[#a1a1aa] uppercase tracking-wider pb-1.5">Last Run</th>
                <th className="text-right text-[8px] font-medium text-[#a1a1aa] uppercase tracking-wider pb-1.5">Time</th>
              </tr>
            </thead>
            <tbody>
              {displayAutomations.map((automation, index) => (
                <tr
                  key={index}
                  className="border-b border-[#f4f4f5] last:border-0"
                >
                  <td className="py-1.5">
                    <span className="text-[9px] font-medium text-[#0a0a0a] truncate block max-w-[120px]">{automation.name}</span>
                  </td>
                  <td className="py-1.5">
                    <StatusBadge status={automation.status} compact />
                  </td>
                  <td className="py-1.5">
                    <span className="text-[9px] text-[#71717a]">{automation.lastRun}</span>
                  </td>
                  <td className="py-1.5 text-right">
                    <span className="text-[9px] text-[#71717a] font-mono">{automation.duration}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#e4e4e7] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[#0a0a0a] text-base font-semibold font-display">Recent Automations</h3>
        <button className="text-xs text-[#3d5a80] font-medium hover:text-[#5a7a9e] transition-colors">
          View all
        </button>
      </div>

      <div className="overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#f4f4f5]">
              <th className="text-left text-[10px] font-medium text-[#a1a1aa] uppercase tracking-wider pb-2.5">Name</th>
              <th className="text-left text-[10px] font-medium text-[#a1a1aa] uppercase tracking-wider pb-2.5">Trigger</th>
              <th className="text-left text-[10px] font-medium text-[#a1a1aa] uppercase tracking-wider pb-2.5">Status</th>
              <th className="text-left text-[10px] font-medium text-[#a1a1aa] uppercase tracking-wider pb-2.5">Last Run</th>
              <th className="text-right text-[10px] font-medium text-[#a1a1aa] uppercase tracking-wider pb-2.5">Duration</th>
            </tr>
          </thead>
          <tbody>
            {automations.map((automation, index) => (
              <tr
                key={index}
                className="border-b border-[#f4f4f5] last:border-0 hover:bg-[#fafafa] transition-colors"
              >
                <td className="py-2.5">
                  <span className="text-xs font-medium text-[#0a0a0a]">{automation.name}</span>
                </td>
                <td className="py-2.5">
                  <span className="text-xs text-[#71717a]">{automation.trigger}</span>
                </td>
                <td className="py-2.5">
                  <StatusBadge status={automation.status} />
                </td>
                <td className="py-2.5">
                  <span className="text-xs text-[#71717a]">{automation.lastRun}</span>
                </td>
                <td className="py-2.5 text-right">
                  <span className="text-xs text-[#71717a] font-mono">{automation.duration}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
