'use client';

import { forwardRef, SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, options, placeholder, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-medium uppercase tracking-wider text-[var(--gray-600)] mb-3"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'w-full px-0 py-3 pr-8',
              'bg-transparent',
              'border-0 border-b border-[var(--gray-300)]',
              'text-black text-base',
              'transition-all duration-300',
              'focus:outline-none focus:border-black',
              'hover:border-[var(--gray-500)]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'appearance-none cursor-pointer',
              error && 'border-black',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--gray-500)] pointer-events-none"
          />
        </div>
        {hint && !error && (
          <p className="mt-2 text-xs text-[var(--gray-500)]">{hint}</p>
        )}
        {error && (
          <p className="mt-2 text-xs text-black">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
