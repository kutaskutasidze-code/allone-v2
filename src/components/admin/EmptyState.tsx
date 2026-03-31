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

const buttonClasses = 'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm hover:bg-gray-800 active:scale-[0.98] transition-all duration-150';

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 border border-dashed border-gray-200 rounded-2xl">
      <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-gray-400" />
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 text-center max-w-sm mb-6">
        {description}
      </p>
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
  );
}
