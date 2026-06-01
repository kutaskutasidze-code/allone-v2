'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  // Optional slot rendered to the LEFT of the primary action (e.g. icon
  // buttons like a dark-mode toggle).
  extras?: React.ReactNode;
}

const buttonClasses = 'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--ink-900)] rounded-[var(--radius-sm)] shadow-[var(--shadow-xs)] hover:bg-[var(--ink-800)] active:scale-[0.98] transition-all duration-150';

export function PageHeader({ title, description, action, extras }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-10">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--ink-900)] font-display">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-sm text-[var(--ink-500)]">
            {description}
          </p>
        )}
      </div>
      {(extras || action) && (
        <div className="flex items-center gap-2">
          {extras}
          {action && (
            action.href ? (
              <Link href={action.href} className={buttonClasses}>
                <Plus className="h-4 w-4" />
                {action.label}
              </Link>
            ) : (
              <button onClick={action.onClick} className={buttonClasses}>
                <Plus className="h-4 w-4" />
                {action.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
