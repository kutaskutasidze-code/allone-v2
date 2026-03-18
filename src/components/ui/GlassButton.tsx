'use client';

import { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

type GlassButtonVariant = 'primary' | 'secondary' | 'ghost' | 'transparent';
type GlassButtonSize = 'sm' | 'md' | 'lg';

interface GlassButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref' | 'children'> {
  children?: React.ReactNode;
  variant?: GlassButtonVariant;
  size?: GlassButtonSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
  href?: string;
}

const sizeClasses: Record<GlassButtonSize, string> = {
  sm: 'px-5 py-2 text-xs',
  md: 'px-6 py-2.5 text-sm',
  lg: 'px-8 py-3.5 text-sm',
};

const variantClasses: Record<GlassButtonVariant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-hover',
  secondary: 'bg-transparent text-white border border-white/[0.12] hover:border-white/[0.25] hover:bg-white/[0.04]',
  ghost: 'bg-transparent text-white/60 hover:text-white hover:bg-white/[0.04]',
  transparent: 'bg-transparent text-white border border-white/[0.12] hover:border-white/[0.25] hover:bg-white/[0.04]',
};

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant = 'primary', size = 'md', leftIcon, rightIcon, isLoading, disabled, children, href, ...props }, forwardedRef) => {
    const content = (
      <span className="relative z-10 flex items-center justify-center gap-2">
        {isLoading ? (
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </span>
    );

    const commonClasses = cn(
      'relative inline-flex items-center justify-center rounded-xl',
      'font-medium tracking-wide transition-all duration-200',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      variantClasses[variant],
      sizeClasses[size],
      className
    );

    if (href) {
      return (
        <motion.a href={href} className={commonClasses} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.15 }}>
          {content}
        </motion.a>
      );
    }

    return (
      <motion.button ref={forwardedRef} className={commonClasses} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.15 }} disabled={disabled || isLoading} {...props}>
        {content}
      </motion.button>
    );
  }
);

GlassButton.displayName = 'GlassButton';
