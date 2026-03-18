'use client';

import Link from 'next/link';
import { Plus, type LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-12 h-12 rounded-xl bg-[var(--gray-100)] flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-[var(--gray-400)]" />
      </div>
      <h3 className="text-sm font-medium text-[var(--black)] mb-1">{title}</h3>
      <p className="text-sm text-[var(--gray-500)] text-center max-w-sm mb-6">
        {description}
      </p>
      {action && (
        action.href ? (
          <Link
            href={action.href}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--black)] rounded-lg hover:bg-[var(--gray-800)] transition-colors duration-200"
          >
            <Plus className="h-4 w-4" />
            {action.label}
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--black)] rounded-lg hover:bg-[var(--gray-800)] transition-colors duration-200"
          >
            <Plus className="h-4 w-4" />
            {action.label}
          </button>
        )
      )}
    </div>
  );
}
