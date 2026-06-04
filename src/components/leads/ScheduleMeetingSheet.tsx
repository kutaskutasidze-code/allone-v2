'use client';

import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TASK_DUE_PRESETS, fmtLocalInputValue } from './AddTaskSheet';

interface Props {
  leadId: string;
  open: boolean;
  onClose: () => void;
  onScheduled?: () => void;
}

export function ScheduleMeetingSheet({ leadId, open, onClose, onScheduled }: Props) {
  const [title, setTitle] = useState('Meeting');
  const [startsValue, setStartsValue] = useState(
    fmtLocalInputValue(new Date(Date.now() + 3600_000)),
  );
  const [endsValue, setEndsValue] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const reset = () => {
    setTitle('Meeting');
    setStartsValue(fmtLocalInputValue(new Date(Date.now() + 3600_000)));
    setEndsValue('');
    setLocation('');
    setNotes('');
    setError('');
    setSaving(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = async () => {
    if (!startsValue) {
      setError('Pick a start time');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const body: Record<string, unknown> = {
        title: title.trim() || 'Meeting',
        starts_at: new Date(startsValue).toISOString(),
      };
      if (endsValue) body.ends_at = new Date(endsValue).toISOString();
      if (location.trim()) body.location = location.trim();
      if (notes.trim()) body.notes = notes.trim();
      const res = await fetch(`/api/sales/leads/${leadId}/meetings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed');
      onScheduled?.();
      close();
    } catch {
      setError('Could not schedule meeting');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-[var(--bg-surface)] border border-[var(--allone-line)] rounded-t-2xl sm:rounded-[var(--radius-lg)] shadow-xl w-full sm:max-w-md p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-semibold text-[var(--ink-900)]">Schedule meeting</h2>
          <button onClick={close} className="text-[var(--ink-400)] hover:text-[var(--ink-900)]">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-[var(--ink-500)] mb-4">Book a meeting with this lead.</p>

        <div className="mb-4">
          <label className="block text-xs font-medium text-[var(--ink-700)] mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Meeting"
            className="w-full px-3 py-2.5 text-sm rounded-[var(--radius-sm)] border border-[var(--allone-line)] focus:border-gray-400 focus:outline-none"
          />
        </div>

        <p className="text-xs font-medium text-[var(--ink-700)] mb-2">Starts</p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {TASK_DUE_PRESETS.slice(0, 4).map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.label}
                onClick={() => setStartsValue(fmtLocalInputValue(new Date(p.get())))}
                className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-surface)] border border-[var(--allone-line)] rounded-[var(--radius-sm)] text-xs text-[var(--ink-800)] hover:border-gray-400 hover:bg-[var(--bg-surface-alt)] transition-all"
              >
                <Icon className="w-3.5 h-3.5 text-[var(--ink-400)]" />
                <span className="flex-1 text-left">{p.label}</span>
              </button>
            );
          })}
        </div>
        <input
          type="datetime-local"
          value={startsValue}
          onChange={(e) => setStartsValue(e.target.value)}
          className="w-full px-3 py-2.5 text-sm rounded-[var(--radius-sm)] border border-[var(--allone-line)] focus:border-gray-400 focus:outline-none"
        />

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div>
            <label className="block text-xs font-medium text-[var(--ink-700)] mb-2">
              Ends <span className="text-[var(--ink-400)]">(optional)</span>
            </label>
            <input
              type="datetime-local"
              value={endsValue}
              onChange={(e) => setEndsValue(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-[var(--radius-sm)] border border-[var(--allone-line)] focus:border-gray-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--ink-700)] mb-2">
              Location <span className="text-[var(--ink-400)]">(optional)</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Zoom, office…"
              className="w-full px-3 py-2.5 text-sm rounded-[var(--radius-sm)] border border-[var(--allone-line)] focus:border-gray-400 focus:outline-none"
            />
          </div>
        </div>

        <label className="block text-xs font-medium text-[var(--ink-700)] mt-4 mb-2">
          Notes <span className="text-[var(--ink-400)]">(optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Agenda, attendees…"
          className="w-full px-3 py-2.5 text-sm rounded-[var(--radius-sm)] border border-[var(--allone-line)] focus:border-gray-400 focus:outline-none resize-none"
        />

        {error && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-[var(--radius-sm)] text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        <button
          onClick={submit}
          disabled={saving}
          className={cn(
            'w-full mt-4 py-3 bg-[var(--ink-900)] text-white text-sm font-medium rounded-[var(--radius-md)] hover:bg-[var(--ink-800)] transition-all disabled:opacity-50',
          )}
        >
          {saving ? 'Saving…' : 'Schedule meeting'}
        </button>
      </div>
    </div>
  );
}
