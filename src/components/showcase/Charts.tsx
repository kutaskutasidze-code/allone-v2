'use client';

import { useRef } from 'react';
import { useInView } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const lineChartData = [
  { day: 'Mon', automations: 156, responses: 142 },
  { day: 'Tue', automations: 184, responses: 168 },
  { day: 'Wed', automations: 168, responses: 155 },
  { day: 'Thu', automations: 197, responses: 182 },
  { day: 'Fri', automations: 224, responses: 198 },
  { day: 'Sat', automations: 189, responses: 175 },
  { day: 'Sun', automations: 212, responses: 191 },
];

const pieChartData = [
  { name: 'CRM Sync', value: 32, color: '#0A68F5' },
  { name: 'Email', value: 24, color: '#0EA5E9' },
  { name: 'Invoicing', value: 18, color: '#0B5CD6' },
  { name: 'Leads', value: 14, color: '#38BDF8' },
  { name: 'Reports', value: 8, color: '#93C5FD' },
  { name: 'Other', value: 4, color: '#BFDBFE' },
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; color: string }>;
  label?: string;
}

function CustomLineTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/70 backdrop-blur-xl px-3 py-2 rounded-lg shadow-lg border border-white/80">
        <p className="text-xs font-medium text-gray-900 mb-1">{label}</p>
        <div className="space-y-0.5">
          <p className="text-[10px] text-gray-500 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0A68F5]" />
            Runs: <span className="text-gray-900 font-medium">{payload[0]?.value}</span>
          </p>
          {payload[1] && (
            <p className="text-[10px] text-gray-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9]" />
              Success: <span className="text-gray-900 font-medium">{payload[1]?.value}</span>
            </p>
          )}
        </div>
      </div>
    );
  }
  return null;
}

interface ChartProps {
  compact?: boolean;
}

export function PerformanceChart({ compact = false }: ChartProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  if (compact) {
    return (
      <div ref={ref} className="bg-white/40 backdrop-blur-lg border border-white/50 rounded-lg p-3 h-full shadow-[0_2px_8px_rgba(0,0,0,0.04),0_0_0_1px_rgba(255,255,255,0.5)_inset]">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-[#0a0a0a] text-xs font-semibold font-display">Performance</h3>
            <p className="text-[#71717a] text-[9px]">Last 7 days</p>
          </div>
          <div className="flex items-center bg-white/30 rounded p-0.5">
            <button className="px-1.5 py-0.5 text-[8px] font-medium text-white bg-[#0A68F5]/80 rounded">7D</button>
            <button className="px-1.5 py-0.5 text-[8px] font-medium text-[#71717a]">30D</button>
          </div>
        </div>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-[#0A68F5]" />
            <span className="text-[8px] text-[#71717a]">Runs</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-[#0EA5E9]" />
            <span className="text-[8px] text-[#71717a]">Success</span>
          </div>
        </div>
        <div className="h-[100px]">
          {isInView && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={lineChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradientAutomationsCompact" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0A68F5" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#0A68F5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradientResponsesCompact" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0EA5E9" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 8 }}
                  dy={5}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 8 }}
                  dx={-5}
                />
                <Tooltip content={<CustomLineTooltip />} />
                <Area
                  type="monotone"
                  dataKey="automations"
                  stroke="#0A68F5"
                  strokeWidth={1.5}
                  fill="url(#gradientAutomationsCompact)"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="responses"
                  stroke="#0EA5E9"
                  strokeWidth={1.5}
                  fill="url(#gradientResponsesCompact)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="bg-white border border-[#e4e4e7] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-[#0a0a0a] text-lg font-semibold font-display">Automation Performance</h3>
          <p className="text-[#71717a] text-sm mt-0.5">Last 7 days</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-[#f4f4f5] rounded-lg p-0.5">
            <button className="px-3 py-1.5 text-xs font-medium text-white bg-[#0A68F5] rounded-md">7D</button>
            <button className="px-3 py-1.5 text-xs font-medium text-[#71717a] hover:text-[#0a0a0a]">30D</button>
            <button className="px-3 py-1.5 text-xs font-medium text-[#71717a] hover:text-[#0a0a0a]">90D</button>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-5 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#0A68F5]" />
          <span className="text-xs text-[#71717a]">Total Runs</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#0EA5E9]" />
          <span className="text-xs text-[#71717a]">Successful</span>
        </div>
      </div>
      <div className="h-[220px]">
        {isInView && (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={lineChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="gradientAutomations" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0A68F5" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#0A68F5" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradientResponses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0EA5E9" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              dx={-10}
            />
            <Tooltip content={<CustomLineTooltip />} />
            <Area
              type="monotone"
              dataKey="automations"
              stroke="#0A68F5"
              strokeWidth={2}
              fill="url(#gradientAutomations)"
              dot={false}
              activeDot={{ r: 5, fill: '#0A68F5', strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="responses"
              stroke="#0EA5E9"
              strokeWidth={2}
              fill="url(#gradientResponses)"
              dot={false}
              activeDot={{ r: 5, fill: '#0EA5E9', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export function CategoryChart({ compact = false }: ChartProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  if (compact) {
    return (
      <div ref={ref} className="bg-white/40 backdrop-blur-lg border border-white/50 rounded-lg p-3 h-full shadow-[0_2px_8px_rgba(0,0,0,0.04),0_0_0_1px_rgba(255,255,255,0.5)_inset]">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-[#0a0a0a] text-xs font-semibold font-display">Workflow Types</h3>
            <p className="text-[#71717a] text-[9px]">By category</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-[90px] h-[90px] relative flex-shrink-0">
            {isInView && (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={28}
                  outerRadius={42}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-compact-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm font-semibold text-[#0a0a0a] font-display">12.8k</span>
              <span className="text-[8px] text-[#71717a]">Total</span>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-x-2 gap-y-1">
            {pieChartData.map((item, index) => (
              <div key={index} className="flex items-center gap-1">
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[8px] text-[#52525b] truncate">{item.name}</span>
                <span className="text-[8px] font-medium text-[#0a0a0a] ml-auto">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="bg-white border border-[#e4e4e7] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-[#0a0a0a] text-lg font-semibold font-display">Workflow Types</h3>
          <p className="text-[#71717a] text-sm mt-0.5">Distribution by category</p>
        </div>
        <button className="text-xs text-[#0EA5E9] font-medium hover:text-[#5a7a9e]">
          View details
        </button>
      </div>
      <div className="flex items-center gap-6">
        <div className="w-[160px] h-[160px] relative flex-shrink-0">
          {isInView && (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-semibold text-[#0a0a0a] font-display">12.8k</span>
            <span className="text-xs text-[#71717a]">Total</span>
          </div>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2.5">
          {pieChartData.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-[#52525b] truncate">{item.name}</span>
              </div>
              <span className="text-xs font-medium text-[#0a0a0a] ml-2">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
