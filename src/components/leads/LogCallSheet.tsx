'use client';

import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { CALL_OUTCOMES } from '@/lib/validations/activity';
import { cn } from '@/lib/utils';

interface Props {
  leadId: string;
  open: boolean;
  onClose: () => void;
  onLogged?: () => void;
}

// Accept either a raw seconds count ("90") or mm:ss ("1:30"). Returns the
// number of seconds, or null when the field is blank/unparseable.
function parseDuration(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.includes(':')) {
    const [m, s] = trimmed.split(':');
    const mins = parseInt(m, 10);
    const secs = parseInt(s, 10);
    if (Number.isNaN(mins) || Number.isNaN(secs)) return null;
    return mins * 60 + secs;
  }
  const secs = parseInt(trimmed, 10);
  return Number.isNaN(secs) ? null : secs;
}

export function LogCallSheet({ leadId, open, onClose, onLogged }: Props) {
  const [outcome, setOutcome] = useState<string>('');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const reset = () => {
    setOutcome('');
    setDuration('');
    setNotes('');
    setError('');
    setSaving(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const save = async () => {
    if (!outcome) {
      setError('Pick an outcome');
      return;
    }
    const durationSeconds = parseDuration(duration);
    if (duration.trim() && durationSeconds === null) {
      setError('Duration must be seconds or mm:ss');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const body: Record<string, unknown> = { outcome };
      if (durationSeconds !== null) body.duration_seconds = durationSeconds;
      if (notes.trim()) body.notes = notes.trim();
      const res = await fetch(`/api/sales/leads/${leadId}/calls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to log call');
      onLogged?.();
      close();
    } catch {
      setError('Could not log this call');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-[var(--bg-surface)] border border-[var(--allone-line)] rounded-t-2xl sm:rounded-[var(--radius-lg)] shadow-xl w-full sm:max-w-md p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-semibold text-[var(--ink-900)]">Log call</h2>
          <button onClick={close} className="text-[var(--ink-400)] hover:text-[var(--ink-900)]">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-[var(--ink-500)] mb-4">How did the call go?</p>

        <div className="grid grid-cols-2 gap-2 mb-5">
          {CALL_OUTCOMES.map((o) => {
            const active = outcome === o.value;
            return (
              <button
                key={o.value}
                onClick={() => setOutcome(o.value)}
                className={cn(
                  'px-3 py-3 rounded-[var(--radius-md)] text-sm font-medium transition-all active:scale-[0.98]',
                  active
                    ? 'bg-[var(--ink-900)] text-white'
                    : 'bg-[var(--bg-surface)] border border-[var(--allone-line)] text-[var(--ink-700)] hover:border-gray-400 hover:bg-[var(--bg-surface-alt)]',
                )}
              >
                {o.label}
              </button>
            );
          })}
        </div>

        <div className="border-t border-[var(--allone-line-soft)] pt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--ink-700)] mb-2">
              Duration <span className="text-[var(--ink-400)]">(optional · seconds or mm:ss)</span>
            </label>
            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g. 90 or 1:30"
              className="w-full px-3 py-2.5 text-sm rounded-[var(--radius-sm)] border border-[var(--allone-line)] focus:border-gray-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--ink-700)] mb-2">
              Notes <span className="text-[var(--ink-400)]">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="What was discussed? Any next steps?"
              className="w-full px-3 py-2.5 text-sm rounded-[var(--radius-sm)] border border-[var(--allone-line)] focus:border-gray-400 focus:outline-none resize-none"
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-[var(--radius-sm)] text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        <button
          onClick={save}
          disabled={saving}
          className="w-full mt-5 py-3 bg-[var(--ink-900)] text-white text-sm font-medium rounded-[var(--radius-md)] hover:bg-[var(--ink-800)] transition-all disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Log call'}
        </button>
      </div>
    </div>
  );
}
