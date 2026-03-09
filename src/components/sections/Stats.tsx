'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { ShineBorder } from '@/components/ui/ShineBorder';

interface StatItem {
  value: string;
  label: string;
}

const stats: StatItem[] = [
  { value: '94%', label: 'Resolution Rate' },
  { value: '<2s', label: 'Response Time' },
  { value: '10x', label: 'Faster Processing' },
  { value: '24/7', label: 'Availability' },
];

function AnimatedStat({ stat, delay }: { stat: StatItem; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className="text-center"
    >
      <p className="text-4xl lg:text-5xl font-semibold text-heading font-[family-name:var(--font-display)] tracking-[-0.03em] mb-2">
        {stat.value}
      </p>
      <p className="font-mono text-[11px] text-muted uppercase tracking-widest">
        {stat.label}
      </p>
    </motion.div>
  );
}

export function Stats() {
  return (
    <section className="py-20 lg:py-24 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <ShineBorder borderRadius={40} borderWidth={2} duration={10} className="border border-border p-0">
          <div className="w-full bg-white px-8 py-12 lg:px-12 lg:py-16">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
              {stats.map((stat, i) => (
                <AnimatedStat key={stat.label} stat={stat} delay={i * 0.1} />
              ))}
            </div>
          </div>
        </ShineBorder>
      </div>
    </section>
  );
}
