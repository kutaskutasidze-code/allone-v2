'use client';

import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export function Card({ children, className, padding = 'md', hover = false }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white border border-[var(--gray-200)] rounded-xl',
        paddingStyles[padding],
        hover && 'hover:border-[var(--gray-300)] transition-colors duration-200',
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function CardHeader({ title, description, action }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-sm font-medium text-[var(--black)]">{title}</h3>
        {description && (
          <p className="mt-0.5 text-xs text-[var(--gray-500)]">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

interface CardSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function CardSection({ title, children, className }: CardSectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="pb-2 border-b border-[var(--gray-100)]">
        <h3 className="text-sm font-medium text-[var(--black)]">{title}</h3>
      </div>
      {children}
    </div>
  );
}
