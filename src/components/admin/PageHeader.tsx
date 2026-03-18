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
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--black)]">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-[var(--gray-500)]">
            {description}
          </p>
        )}
      </div>
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
