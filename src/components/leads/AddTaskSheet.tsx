'use client';

import { useState } from 'react';
import { X, Clock, CalendarDays, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  leadId: string;
  open: boolean;
  onClose: () => void;
  onAdded?: () => void;
}

function isoFromHoursFromNow(hours: number) {
  return new Date(Date.now() + hours * 3600_000).toISOString();
}

function isoAtLocal(date: Date, hour: number, minute: number) {
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

// For <input type="datetime-local"> — yyyy-MM-ddTHH:mm in local time.
export function fmtLocalInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const TASK_DUE_PRESETS = [
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

export function AddTaskSheet({ leadId, open, onClose, onAdded }: Props) {
  const initial = new Date(Date.now() + 3600_000);
  const [title, setTitle] = useState('Follow up');
  const [dueValue, setDueValue] = useState(fmtLocalInputValue(initial));
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const reset = () => {
    setTitle('Follow up');
    setDueValue(fmtLocalInputValue(new Date(Date.now() + 3600_000)));
    setNotes('');
    setError('');
    setSaving(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = async (dueISO: string) => {
    setSaving(true);
    setError('');
    try {
      const body: Record<string, unknown> = {
        lead_id: leadId,
        title: title.trim() || 'Follow up',
        due_at: dueISO,
      };
      if (notes.trim()) body.notes = notes.trim();
      const res = await fetch('/api/sales/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to add task');
      onAdded?.();
      close();
    } catch {
      setError('Could not create follow-up');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="pb-safe bg-[var(--bg-surface)] border border-[var(--allone-line)] rounded-t-2xl sm:rounded-[var(--radius-lg)] shadow-xl w-full sm:max-w-md p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-semibold text-[var(--ink-900)]">Add follow-up</h2>
          <button onClick={close} className="text-[var(--ink-400)] hover:text-[var(--ink-900)]">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-[var(--ink-500)] mb-4">Schedule a follow-up task for this lead.</p>

        <div className="mb-4">
          <label className="block text-xs font-medium text-[var(--ink-700)] mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Follow up"
            className="w-full px-3 py-2.5 text-sm rounded-[var(--radius-sm)] border border-[var(--allone-line)] focus:border-gray-400 focus:outline-none"
          />
        </div>

        <p className="text-xs font-medium text-[var(--ink-700)] mb-2">When?</p>
        <div className="space-y-2 mb-5">
          {TASK_DUE_PRESETS.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.label}
                disabled={saving}
                onClick={() => submit(p.get())}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[var(--bg-surface)] border border-[var(--allone-line)] rounded-[var(--radius-md)] text-sm text-[var(--ink-800)] hover:border-gray-400 hover:bg-[var(--bg-surface-alt)] transition-all disabled:opacity-50"
              >
                <Icon className="w-4 h-4 text-[var(--ink-400)]" />
                <span className="flex-1 text-left">{p.label}</span>
              </button>
            );
          })}
        </div>

        <div className="border-t border-[var(--allone-line-soft)] pt-4">
          <label className="block text-xs font-medium text-[var(--ink-700)] mb-2">Or pick a custom time</label>
          <input
            type="datetime-local"
            value={dueValue}
            onChange={(e) => setDueValue(e.target.value)}
            className="w-full px-3 py-2.5 text-sm rounded-[var(--radius-sm)] border border-[var(--allone-line)] focus:border-gray-400 focus:outline-none"
          />
          <label className="block text-xs font-medium text-[var(--ink-700)] mt-4 mb-2">
            Notes <span className="text-[var(--ink-400)]">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Anything to remember?"
            className="w-full px-3 py-2.5 text-sm rounded-[var(--radius-sm)] border border-[var(--allone-line)] focus:border-gray-400 focus:outline-none resize-none"
          />

          {error && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-[var(--radius-sm)] text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="flex-1">{error}</span>
            </div>
          )}

          <button
            onClick={() => {
              if (!dueValue) return;
              submit(new Date(dueValue).toISOString());
            }}
            disabled={saving}
            className={cn(
              'w-full mt-3 py-3 bg-[var(--ink-900)] text-white text-sm font-medium rounded-[var(--radius-md)] hover:bg-[var(--ink-800)] transition-all disabled:opacity-50',
            )}
          >
            {saving ? 'Saving…' : 'Save follow-up'}
          </button>
        </div>
      </div>
    </div>
  );
}
