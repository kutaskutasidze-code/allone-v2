'use client';

import { useState } from 'react';
import { X, Clock, CalendarDays } from 'lucide-react';

interface Props {
  onCancel: () => void;
  onPick: (whenISO: string) => void;
}

function isoFromHoursFromNow(hours: number) {
  return new Date(Date.now() + hours * 3600_000).toISOString();
}

function isoAtLocal(date: Date, hour: number, minute: number) {
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function fmtLocalInputValue(d: Date) {
  // For <input type="datetime-local"> — yyyy-MM-ddTHH:mm in local time.
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const PRESETS = [
  { label: 'In 1 hour', icon: Clock, get: () => isoFromHoursFromNow(1) },
  { label: 'In 3 hours', icon: Clock, get: () => isoFromHoursFromNow(3) },
  {
    label: 'Tomorrow 10am',
    icon: CalendarDays,
    get: () => {
      const t = new Date();
      t.setDate(t.getDate() + 1);
      return isoAtLocal(t, 10, 0);
    },
  },
  {
    label: 'In 3 days',
    icon: CalendarDays,
    get: () => {
      const t = new Date();
      t.setDate(t.getDate() + 3);
      return isoAtLocal(t, 10, 0);
    },
  },
  {
    label: 'Next week',
    icon: CalendarDays,
    get: () => {
      const t = new Date();
      t.setDate(t.getDate() + 7);
      return isoAtLocal(t, 10, 0);
    },
  },
];

export function CallbackPicker({ onCancel, onPick }: Props) {
  const initial = new Date(Date.now() + 3600_000);
  const [customValue, setCustomValue] = useState(fmtLocalInputValue(initial));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white border border-gray-200 rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-semibold text-gray-900">Schedule callback</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-900">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-4">When should you call this lead back?</p>

        <div className="space-y-2 mb-5">
          {PRESETS.map(p => {
            const Icon = p.icon;
            return (
              <button
                key={p.label}
                onClick={() => onPick(p.get())}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 hover:border-gray-400 hover:bg-gray-50 transition-all"
              >
                <Icon className="w-4 h-4 text-gray-400" />
                <span className="flex-1 text-left">{p.label}</span>
              </button>
            );
          })}
        </div>

        <div className="border-t border-gray-100 pt-4">
          <label className="block text-xs font-medium text-gray-700 mb-2">Or pick a custom time</label>
          <input
            type="datetime-local"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:border-gray-400 focus:outline-none"
          />
          <button
            onClick={() => {
              if (!customValue) return;
              onPick(new Date(customValue).toISOString());
            }}
            className="w-full mt-3 py-3 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-all"
          >
            Save callback
          </button>
        </div>
      </div>
    </div>
  );
}
