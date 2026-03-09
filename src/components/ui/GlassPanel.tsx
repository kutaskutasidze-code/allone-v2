'use client';

import { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

type GlassPanelPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

interface GlassPanelProps extends Omit<HTMLMotionProps<'div'>, 'ref' | 'children'> {
  children?: React.ReactNode;
  padding?: GlassPanelPadding;
  hover?: boolean;
  rounded?: 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  as?: 'div' | 'article' | 'section' | 'aside';
}

const paddingClasses: Record<GlassPanelPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-10',
};

const roundedClasses: Record<NonNullable<GlassPanelProps['rounded']>, string> = {
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
};

export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, children, padding = 'md', hover = false, rounded = '2xl', as = 'div', ...props }, forwardedRef) => {
    const MotionComponent = motion[as] as typeof motion.div;

    return (
      <MotionComponent
        ref={forwardedRef}
        className={cn(
          'relative bg-surface border border-white/[0.06]',
          paddingClasses[padding],
          roundedClasses[rounded],
          'transition-all duration-300',
          hover && 'hover:border-white/[0.12] hover:-translate-y-0.5',
          className
        )}
        {...props}
      >
        {children}
      </MotionComponent>
    );
  }
);

GlassPanel.displayName = 'GlassPanel';

export const GlassPanelHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('mb-4', className)} {...props} />
);
GlassPanelHeader.displayName = 'GlassPanelHeader';

export const GlassPanelTitle = forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement> & { as?: 'h2' | 'h3' | 'h4' }
>(({ className, as: Tag = 'h3', ...props }, ref) => (
  <Tag
    ref={ref}
    className={cn('font-[family-name:var(--font-display)] font-semibold text-white tracking-tight', className)}
    {...props}
  />
));
GlassPanelTitle.displayName = 'GlassPanelTitle';

export const GlassPanelContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('text-muted', className)} {...props} />
);
GlassPanelContent.displayName = 'GlassPanelContent';

export const GlassPanelFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('mt-6 pt-4 border-t border-white/[0.06]', className)} {...props} />
  )
);
GlassPanelFooter.displayName = 'GlassPanelFooter';
