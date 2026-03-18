'use client';

import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface MetricCardProps {
  title: string;
  value: string;
  change: number;
  comparison?: string;
  icon: LucideIcon;
  sparklineData?: number[];
  sparklineColor?: string;
  compact?: boolean;
}

export function MetricCard({
  title,
  value,
  change,
  comparison = 'vs last week',
  icon: Icon,
  sparklineData = [30, 40, 35, 50, 49, 60, 70, 65, 80],
  sparklineColor = '#0a0a0a',
  compact = false,
}: MetricCardProps) {
  const isPositive = change >= 0;

  // Transform sparkline data for recharts
  const chartData = sparklineData.map((val, i) => ({ value: val, index: i }));

  if (compact) {
    return (
      <div className="bg-white border border-[#e4e4e7] rounded-lg p-2.5 hover:border-[#d4d4d8] transition-all duration-300 relative overflow-hidden">
        <div className="flex items-center justify-between mb-1.5">
          <div className="w-6 h-6 bg-[#f4f4f5] rounded flex items-center justify-center">
            <Icon className="w-3.5 h-3.5 text-[#0a0a0a]" />
          </div>
          <div className={`flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
            isPositive
              ? 'text-emerald-700 bg-emerald-50'
              : 'text-red-600 bg-red-50'
          }`}>
            {isPositive ? (
              <TrendingUp className="w-2.5 h-2.5" />
            ) : (
              <TrendingDown className="w-2.5 h-2.5" />
            )}
            <span>{isPositive ? '+' : ''}{change}%</span>
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-[#71717a] text-[9px] font-medium">{title}</p>
            <p className="text-[#0a0a0a] text-base font-semibold tracking-tight font-display">{value}</p>
          </div>

          {/* Sparkline - compact */}
          <div className="w-14 h-8">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`sparkline-compact-${title.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={sparklineColor} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={sparklineColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={sparklineColor}
                  strokeWidth={1}
                  fill={`url(#sparkline-compact-${title.replace(/\s/g, '')})`}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#e4e4e7] rounded-2xl p-5 hover:border-[#d4d4d8] transition-all duration-300 hover:shadow-md relative overflow-hidden group">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-[#f4f4f5] rounded-xl flex items-center justify-center group-hover:bg-[#e4e4e7] transition-colors">
          <Icon className="w-5 h-5 text-[#0a0a0a]" />
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
          isPositive
            ? 'text-emerald-700 bg-emerald-50'
            : 'text-red-600 bg-red-50'
        }`}>
          {isPositive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          <span>{isPositive ? '+' : ''}{change}%</span>
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div className="space-y-0.5">
          <p className="text-[#71717a] text-xs font-medium">{title}</p>
          <p className="text-[#0a0a0a] text-2xl font-semibold tracking-tight font-display">{value}</p>
          <p className="text-[10px] text-[#a1a1aa]">{comparison}</p>
        </div>

        {/* Sparkline */}
        <div className="w-20 h-12">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`sparkline-${title.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={sparklineColor} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={sparklineColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={sparklineColor}
                strokeWidth={1.5}
                fill={`url(#sparkline-${title.replace(/\s/g, '')})`}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
