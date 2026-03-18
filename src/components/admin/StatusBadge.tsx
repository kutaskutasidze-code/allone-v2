'use client';

import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  published: boolean;
  size?: 'sm' | 'md';
}

export function StatusBadge({ published, size = 'sm' }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-md',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        published
          ? 'bg-[var(--gray-900)] text-white'
          : 'bg-[var(--gray-100)] text-[var(--gray-600)]'
      )}
    >
      {published ? 'Published' : 'Draft'}
    </span>
  );
}

interface CountBadgeProps {
  count: number;
  label?: string;
}

export function CountBadge({ count, label }: CountBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-[var(--gray-100)] text-[var(--gray-600)] rounded-md">
      {count}
      {label && <span className="text-[var(--gray-400)]">{label}</span>}
    </span>
  );
}
