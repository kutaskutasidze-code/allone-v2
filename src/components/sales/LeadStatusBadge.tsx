'use client';

import { cn } from '@/lib/utils';
import type { LeadStatus } from '@/types/database';
import { LEAD_STATUS_STYLES, LEAD_STATUS_LABELS } from '@/lib/validations/leads';

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
        LEAD_STATUS_STYLES[status] ?? 'bg-[var(--bg-sunken)] text-[var(--ink-500)]',
        className
      )}
    >
      {LEAD_STATUS_LABELS[status] ?? status}
    </span>
  );
}
