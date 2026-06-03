'use client';

import { X } from 'lucide-react';
import { LOST_REASONS } from '@/lib/validations/leads';

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (reason: string) => void;
}

export function LostReasonPicker({ open, onClose, onPick }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-[var(--bg-surface)] border border-[var(--allone-line)] rounded-t-2xl sm:rounded-[var(--radius-lg)] shadow-xl w-full sm:max-w-md p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-semibold text-[var(--ink-900)]">Mark as lost</h2>
          <button onClick={onClose} className="text-[var(--ink-400)] hover:text-[var(--ink-900)]">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-[var(--ink-500)] mb-4">Why is this lead lost?</p>

        <div className="space-y-2">
          {LOST_REASONS.map(r => (
            <button
              key={r.value}
              onClick={() => onPick(r.value)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-[var(--bg-surface)] border border-[var(--allone-line)] rounded-[var(--radius-md)] text-sm text-[var(--ink-800)] hover:border-gray-400 hover:bg-[var(--bg-surface-alt)] transition-all"
            >
              <span className="flex-1 text-left">{r.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
