'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { EmbeddableDashboard } from '@/components/showcase/DashboardShowcase';
import { ShineBorder } from '@/components/ui/ShineBorder';


export function DashboardShowcase() {
  const { t } = useI18n();
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start 90%', 'start 30%'],
  });

  const smoothY = useSpring(
    useTransform(scrollYProgress, [0, 1], [80, 0]),
    { stiffness: 80, damping: 25 }
  );
  const smoothOpacity = useSpring(
    useTransform(scrollYProgress, [0, 0.4], [0, 1]),
    { stiffness: 100, damping: 20 }
  );

  return (
    <section className="pt-8 lg:pt-12 pb-24 lg:pb-32 bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mb-12 lg:mb-16"
        >
          <p className="mono-label mb-4">{t('dashboard.label')}</p>
          <h2 className="text-4xl lg:text-5xl font-semibold text-heading leading-[1.05] tracking-[-0.03em] mb-4">
            {t('dashboard.title1')}
            <br />{t('dashboard.title2')}
          </h2>
          <p className="text-lg text-muted leading-relaxed">
            {t('dashboard.desc')}
          </p>
        </motion.div>

        {/* Dashboard preview with 3D perspective */}
        <motion.div
          ref={sectionRef}
          style={{ y: smoothY, opacity: smoothOpacity }}
          className="relative"
        >
          <div className="bg-white rounded-3xl overflow-hidden">
            <div
              className="relative w-full pointer-events-none"
              style={{
                boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
                transform: 'perspective(2000px) rotateX(2deg)',
              }}
            >
              <div className="hidden md:block">
                <EmbeddableDashboard />
              </div>
              <div className="md:hidden overflow-hidden" style={{ height: '240px' }}>
                <div style={{ width: '1100px', transform: 'scale(0.35)', transformOrigin: 'top left' }}>
                  <EmbeddableDashboard />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
        </motion.div>
      </div>
    </section>
  );
}
