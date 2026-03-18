'use client';

import { Sparkles, Zap, TrendingUp, Clock } from 'lucide-react';

const insights = [
  { icon: Zap, title: 'Merge workflows', color: 'bg-amber-500' },
  { icon: TrendingUp, title: 'Scale scoring', color: 'bg-emerald-500' },
  { icon: Clock, title: 'Optimize timing', color: 'bg-blue-500' },
];

export function AIInsightsCard() {
  return (
    <div className="bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] rounded-2xl p-4 text-white h-full">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5" />
        <h3 className="text-base font-semibold font-display">AI Insights</h3>
      </div>

      <div className="space-y-2">
        {insights.map((insight, index) => (
          <div
            key={index}
            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5"
          >
            <div className={`w-2 h-2 rounded-full ${insight.color}`} />
            <span className="text-sm text-white/90">{insight.title}</span>
          </div>
        ))}
      </div>

      <button className="w-full mt-4 py-2 rounded-xl bg-white/10 text-sm font-medium text-white/70 hover:bg-white/20 transition-colors">
        View all
      </button>
    </div>
  );
}
