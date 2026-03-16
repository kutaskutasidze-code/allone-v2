'use client';

import { motion } from 'framer-motion';
import { CpuArchitecture } from '@/components/ui/CpuArchitecture';
import { useI18n } from '@/lib/i18n';

export function LabHero() {
  const { t } = useI18n();
  return (
    <section className="relative h-svh flex items-center justify-center overflow-hidden bg-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(10,104,245,0.04)_0%,transparent_70%)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 0.3 }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <CpuArchitecture className="w-[300vw] opacity-80" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 text-[clamp(2rem,5vw,4rem)] font-display font-bold tracking-tight leading-none text-heading"
      >
        {t('lab.hero')}
      </motion.h1>

      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-white z-20 pointer-events-none" />
    </section>
  );
}
