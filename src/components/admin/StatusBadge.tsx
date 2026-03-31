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
        'inline-flex items-center gap-1.5 font-medium rounded-md',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        published
          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
          : 'bg-gray-50 text-gray-500 ring-1 ring-gray-200'
      )}
    >
      <span className={cn(
        'w-1.5 h-1.5 rounded-full',
        published ? 'bg-emerald-500' : 'bg-gray-400'
      )} />
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
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-gray-50 text-gray-600 rounded-md ring-1 ring-gray-200">
      {count}
      {label && <span className="text-gray-400">{label}</span>}
    </span>
  );
}
