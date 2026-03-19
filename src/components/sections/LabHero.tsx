'use client';

import { motion } from 'framer-motion';
import { CpuArchitecture } from '@/components/ui/CpuArchitecture';
import { GradientBlobs } from '@/components/ui/GradientBlobs';
import { useI18n } from '@/lib/i18n';

export function LabHero() {
  const { t } = useI18n();
  return (
    <section className="relative flex items-center justify-center bg-white/90 pt-10 sm:pt-20 pb-32 lg:pt-24 lg:pb-40 overflow-hidden">
      {/* Gradient blobs behind CPU architecture */}
      <GradientBlobs variant="hero" />

      {/* Film grain noise overlay */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 opacity-[0.035]" xmlns="http://www.w3.org/2000/svg">
        <filter id="lab-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="4" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#lab-noise)" />
      </svg>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 0.3 }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <CpuArchitecture className="h-[250vh] w-auto md:h-auto md:w-[350vw] opacity-90" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex flex-col items-center text-center gap-4 max-w-3xl mx-auto px-4"
      >
        <p className="font-mono text-xs font-medium text-[#4D4D4D] uppercase tracking-normal">Lab</p>
        <h1 className="font-display text-[clamp(32px,5vw,48px)] font-semibold leading-[1.1] tracking-[-0.047em] text-[#071D2F]">
          {t('lab.hero')}
        </h1>
        <p className="max-w-[540px] text-base text-[#4D4D4D] leading-relaxed">
          Research, experiments, and open findings on AI agents, cost optimization, and automation.
        </p>
      </motion.div>

      {/* Bottom fade — blends hero into research section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent z-20" />
    </section>
  );
}
