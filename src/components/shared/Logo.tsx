'use client';

import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const sizeStyles = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-3xl',
};

const iconSizes = {
  sm: { className: 'w-6 h-6', px: 24 },
  md: { className: 'w-8 h-8', px: 32 },
  lg: { className: 'w-10 h-10', px: 40 },
};

export function Logo({ className, size = 'md', showIcon = true }: LogoProps) {
  return (
    <Link href="/" className={cn('flex items-center gap-2 group', className)}>
      {showIcon && (
        <motion.div
          whileHover={{ rotate: 180 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className={cn(
            'relative flex items-center justify-center',
            iconSizes[size].className
          )}
        >
          <Image
            src="/images/allone-logo.png"
            alt="Allone"
            width={iconSizes[size].px}
            height={iconSizes[size].px}
            className="object-contain"
            priority
          />
        </motion.div>
      )}
      <span
        className={cn(
          'font-[var(--font-display)] font-bold tracking-tight',
          'text-[var(--slate-950)]',
          'group-hover:text-gradient transition-all duration-300',
          sizeStyles[size]
        )}
      >
        ALLONE
      </span>
    </Link>
  );
}
