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
            className="block font-mono text-[11px] font-medium uppercase tracking-widest text-muted mb-3"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-4 py-3',
            'bg-surface',
            'border border-white/[0.08] rounded-xl',
            'text-white text-sm',
            'placeholder:text-white/30',
            'transition-colors duration-200',
            'focus:outline-none focus:border-accent',
            'hover:border-white/[0.15]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-error',
            className
          )}
          {...props}
        />
        {hint && !error && (
          <p className="mt-2 text-xs text-muted">{hint}</p>
        )}
        {error && (
          <p className="mt-2 text-xs text-error">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
