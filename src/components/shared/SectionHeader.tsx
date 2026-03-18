'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = 'left',
  className,
}: SectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6 }}
      className={cn(
        'max-w-3xl mb-16',
        align === 'center' ? 'mx-auto text-center' : 'text-left',
        className
      )}
    >
      {eyebrow && (
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--gray-500)] mb-4">
          {eyebrow}
        </p>
      )}
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-[var(--font-serif)] font-medium text-black leading-tight mb-4">
        {title}
      </h2>
      {description && (
        <p className="text-lg text-[var(--gray-600)] leading-relaxed">
          {description}
        </p>
      )}
    </motion.div>
  );
}
