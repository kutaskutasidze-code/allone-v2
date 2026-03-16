'use client';

import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'accent' | 'outline';

interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-surface-2 border border-border text-muted',
  accent: 'bg-accent-light border border-accent/20 text-accent',
  outline: 'bg-transparent border border-border text-muted',
};

export function Badge({ variant = 'default', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md',
        'text-[10px] font-mono font-medium uppercase tracking-widest',
        'transition-colors duration-200',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
