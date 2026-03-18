'use client';

import { Plus } from 'lucide-react';

const integrations = [
  { name: 'Slack', icon: '💬', connected: true },
  { name: 'Gmail', icon: '📧', connected: true },
  { name: 'Notion', icon: '📝', connected: true },
  { name: 'Stripe', icon: '💳', connected: true },
  { name: 'Hubspot', icon: '🎯', connected: true },
  { name: 'Zapier', icon: '⚡', connected: true },
  { name: 'Sheets', icon: '📊', connected: false },
  { name: 'Drive', icon: '📁', connected: true },
];

export function IntegrationsGrid() {
  return (
    <div className="bg-white border border-[#e4e4e7] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[#0a0a0a] text-base font-semibold font-display">Integrations</h3>
        <button className="inline-flex items-center gap-1 text-xs text-[#3d5a80] font-medium hover:text-[#5a7a9e] transition-colors">
          <Plus className="w-3.5 h-3.5" />
          Add New
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2.5">
        {integrations.map((integration, index) => (
          <div
            key={index}
            className="group flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[#fafafa] border border-[#f4f4f5] hover:border-[#e4e4e7] hover:bg-white transition-all cursor-pointer"
          >
            <span className="text-xl">{integration.icon}</span>
            <span className="text-[11px] font-medium text-[#0a0a0a]">{integration.name}</span>
            <div className="flex items-center gap-1">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  integration.connected ? 'bg-emerald-500' : 'bg-zinc-300'
                }`}
              />
              <span className={`text-[9px] ${integration.connected ? 'text-emerald-600' : 'text-zinc-400'}`}>
                {integration.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
