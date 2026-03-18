'use client';

import { cn } from '@/lib/utils';
import type { LeadStatus } from '@/types/database';

const STATUS_STYLES: Record<LeadStatus, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  qualified: 'bg-purple-100 text-purple-700',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-gray-100 text-gray-500',
};

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  won: 'Won',
  lost: 'Lost',
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
