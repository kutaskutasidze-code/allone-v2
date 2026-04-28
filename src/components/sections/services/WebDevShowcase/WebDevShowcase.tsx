'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { MacBookFrame } from './MacBookFrame';
import { HeroPreview } from './HeroPreview';
import { useI18n } from '@/lib/i18n';

const techStack: { name: string; color: string }[] = [];

export function WebDevShowcase() {
  const { t } = useI18n();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const entryY_animated = useTransform(scrollYProgress, [0.1, 0.3], [60, 0]);
  const entryOpacity_animated = useTransform(scrollYProgress, [0.1, 0.22], [0, 1]);

  const entryY = isMobile ? 0 : entryY_animated;
  const entryOpacity = isMobile ? 1 : entryOpacity_animated;

  return (
    <section id="web-development" ref={sectionRef} className="relative py-24 lg:py-32 overflow-x-clip">
      {/* Glow — simplified on mobile */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="sm:hidden w-[280px] h-[280px] bg-gray-800/[0.08] rounded-full blur-[50px]" />
      </div>
      <div className="hidden sm:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none will-change-transform" style={{ transform: 'translate(-50%, -50%) translate3d(0,0,0)', contain: 'layout style' }}>
        <div className="relative w-[1100px] h-[800px]">
          <div className="absolute inset-[10%] bg-gray-900/[0.12] rounded-full blur-[150px]" />
          <div className="absolute top-[15%] right-[10%] w-[450px] h-[450px] bg-gray-800/[0.1] rounded-full blur-[120px]" />
          <div className="absolute bottom-[15%] left-[15%] w-[400px] h-[400px] bg-gray-900/[0.08] rounded-full blur-[130px]" />
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[0.68fr_0.32fr] gap-8 lg:gap-10 items-center">
          {/* MacBook — order-2 on mobile (below text), order-1 on desktop (left) */}
          <motion.div
            style={{
              y: entryY,
              opacity: entryOpacity,
            }}
            className="relative order-2 lg:order-1 lg:-ml-12 will-change-transform"
          >
            <MacBookFrame>
              <HeroPreview />
            </MacBookFrame>
          </motion.div>

          {/* Text — order-1 on mobile (above MacBook), order-2 on desktop (right) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="order-1 lg:order-2 text-center lg:text-left"
          >
            <span className="font-mono text-xs font-medium text-[#4D4D4D] uppercase tracking-normal">{t('services.webdev.label')}</span>
            <h2
              className="font-display text-3xl lg:text-[2.5rem] font-semibold text-[#071D2F] mt-3 mb-5 tracking-[-0.04em] leading-[1.1]"
            >
              {t('services.webdev.h2a')}{' '}<br className="hidden lg:block" />
              {t('services.webdev.h2b')}
            </h2>
            <p
              className="font-body text-[15px] text-[#4D4D4D] leading-[1.7] mb-6 max-w-[280px] mx-auto lg:mx-0"
            >
              {t('services.webdev.desc')}
            </p>

            <div className="flex flex-wrap justify-center lg:justify-start gap-2">
              {techStack.map((tech) => (
                <div
                  key={tech.name}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/40 backdrop-blur-lg border border-white/50 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_0_0_1px_rgba(255,255,255,0.5)_inset]"
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: tech.color }} />
                  <span className="text-xs font-medium text-gray-700">{tech.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
