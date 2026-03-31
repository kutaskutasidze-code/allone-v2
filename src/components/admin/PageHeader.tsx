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

const buttonClasses = 'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm hover:bg-gray-800 active:scale-[0.98] transition-all duration-150';

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-10">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-gray-900 font-display">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-sm text-gray-500">
            {description}
          </p>
        )}
      </div>
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
