'use client';

import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'accent' | 'outline';

interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-white/[0.04] border border-white/[0.08] text-muted',
  accent: 'bg-accent/10 border border-accent/20 text-accent',
  outline: 'bg-transparent border border-white/[0.12] text-white/60',
};

export function Badge({ variant = 'default', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-md',
        'text-xs font-medium uppercase tracking-wider',
        'transition-colors duration-200',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
