'use client';

import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium uppercase tracking-wider text-[var(--gray-600)] mb-3"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-0 py-3',
            'bg-transparent',
            'border-0 border-b border-[var(--gray-300)]',
            'text-black text-base',
            'placeholder:text-[var(--gray-400)]',
            'transition-all duration-300',
            'focus:outline-none focus:border-black',
            'hover:border-[var(--gray-500)]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-black',
            className
          )}
          {...props}
        />
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

Input.displayName = 'Input';
