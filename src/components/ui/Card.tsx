'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  variant?: 'default' | 'bordered' | 'filled';
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const variantStyles = {
  default: 'bg-surface',
  bordered: 'bg-surface border border-white/[0.06]',
  filled: 'bg-white',
};

const paddingStyles = {
  none: '',
  sm: 'p-5',
  md: 'p-7',
  lg: 'p-10',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'bordered', hover = false, padding = 'md', children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={hover ? { y: -4 } : undefined}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          'rounded-2xl transition-all duration-300',
          variantStyles[variant],
          paddingStyles[padding],
          hover && 'cursor-pointer hover:border-white/[0.12]',
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('mb-4', className)}>{children}</div>;
}

export function CardTitle({ className, children, as: Tag = 'h3' }: { className?: string; children: React.ReactNode; as?: 'h2' | 'h3' | 'h4' }) {
  return (
    <Tag className={cn('font-[family-name:var(--font-display)] font-semibold text-white tracking-tight', Tag === 'h2' && 'text-3xl', Tag === 'h3' && 'text-2xl', Tag === 'h4' && 'text-xl', className)}>
      {children}
    </Tag>
  );
}

export function CardDescription({ className, children }: { className?: string; children: React.ReactNode }) {
  return <p className={cn('text-muted leading-relaxed text-sm', className)}>{children}</p>;
}

export function CardContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('', className)}>{children}</div>;
}

export function CardFooter({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('mt-6 pt-6 border-t border-white/[0.06]', className)}>{children}</div>;
}
