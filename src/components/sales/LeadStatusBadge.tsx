'use client';

import { cn } from '@/lib/utils';
import type { LeadStatus } from '@/types/database';

const STATUS_STYLES: Record<LeadStatus, string> = {
  new: 'bg-[var(--ao-accent-soft)] text-[var(--ao-accent-hover)]',
  contacted: 'bg-yellow-100 text-yellow-700',
  callback: 'bg-teal-100 text-teal-700',
  qualified: 'bg-purple-100 text-purple-700',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-[var(--bg-sunken)] text-[var(--ink-500)]',
  not_interested: 'bg-red-100 text-red-700',
  unavailable: 'bg-orange-100 text-orange-700',
};

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  callback: 'Callback',
  qualified: 'Qualified',
  won: 'Won',
  lost: 'Lost',
  not_interested: 'Not Interested',
  unavailable: 'Unavailable',
};

interface LeadStatusBadgeProps {
  status: LeadStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export function LeadStatusBadge({ status, size = 'sm', className }: LeadStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        STATUS_STYLES[status],
        className
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
