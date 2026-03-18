'use client';

import { Target } from 'lucide-react';

interface ProgressCardProps {
  title: string;
  current: number;
  target: number;
  unit?: string;
}

export function ProgressCard({ title, current, target, unit = '' }: ProgressCardProps) {
  const percentage = Math.min((current / target) * 100, 100);
  const remaining = target - current;

  return (
    <div className="bg-white border border-[#e4e4e7] rounded-2xl p-5 hover:border-[#d4d4d8] transition-all duration-300 hover:shadow-md">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-[#f4f4f5] rounded-xl flex items-center justify-center">
          <Target className="w-5 h-5 text-[#0a0a0a]" />
        </div>
        <div>
          <p className="text-xs text-[#71717a] font-medium">{title}</p>
          <p className="text-lg font-semibold text-[#0a0a0a] font-display">
            {current.toLocaleString()}{unit} <span className="text-sm font-normal text-[#a1a1aa]">/ {target.toLocaleString()}{unit}</span>
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative">
        <div className="h-2 bg-[#f4f4f5] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#0a0a0a] rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs font-medium text-[#0a0a0a]">{percentage.toFixed(0)}% complete</span>
          <span className="text-xs text-[#71717a]">{remaining.toLocaleString()}{unit} remaining</span>
        </div>
      </div>
    </div>
  );
}
