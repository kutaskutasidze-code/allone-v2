'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { EmbeddableDashboard } from '@/components/showcase/DashboardShowcase';

export function DashboardShowcase() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const dashY = useTransform(scrollYProgress, [0.1, 0.35], [60, 0]);
  const dashOpacity = useTransform(scrollYProgress, [0.1, 0.25], [0, 1]);

  return (
    <section ref={sectionRef} className="relative py-24 lg:py-32 overflow-x-clip">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-50/30 pointer-events-none" />

      {/* Background glow — large and vivid */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/4 -translate-y-1/2 pointer-events-none">
        <div className="relative w-[900px] h-[700px]">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-400/45 via-sky-300/40 to-indigo-200/30 rounded-full blur-[100px]" />
          <div className="absolute -top-10 right-20 w-72 h-72 bg-violet-300/50 rounded-full blur-[80px]" />
          <div className="absolute bottom-10 left-10 w-80 h-80 bg-sky-300/45 rounded-full blur-[90px]" />
          <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-rose-200/30 rounded-full blur-[70px]" />
          <div className="absolute bottom-1/3 right-1/4 w-56 h-56 bg-amber-100/25 rounded-full blur-[60px]" />
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[0.32fr_0.68fr] gap-10 lg:gap-12 items-start">
          {/* Left — Text */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:pt-4"
          >
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-gray-400">Workflow Automation</span>
            <h2 className="text-3xl lg:text-[2.75rem] font-bold text-gray-900 mt-3 mb-5 tracking-[-0.03em] leading-[1.1]" style={{ fontFamily: 'var(--font-display)' }}>
              Automate the work{' '}<br className="hidden lg:block" />
              that slows you down
            </h2>
            <p className="text-[15px] text-gray-500 leading-[1.7] mb-6 max-w-sm" style={{ fontFamily: 'var(--font-body)' }}>
              From lead scoring to invoice processing, we build custom workflows that run 24/7 — so your team focuses on what matters.
            </p>

            <div className="flex flex-wrap gap-2">
              {['n8n', 'Make', 'Zapier', 'Custom APIs', 'Webhooks'].map((tag) => (
                <span key={tag} className="px-3 py-2 text-xs font-medium text-gray-500 rounded-xl bg-white/40 backdrop-blur-lg border border-white/50 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_0_0_1px_rgba(255,255,255,0.5)_inset]">
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Right — Dashboard zoomed in, overflowing right */}
          <motion.div
            style={{
              y: dashY,
              opacity: dashOpacity,
            }}
            className="relative lg:-mr-48"
          >
            {/* Glassy wrapper */}
            <div className="relative rounded-2xl overflow-hidden border border-white/40 shadow-[0_8px_60px_rgba(0,0,0,0.06),0_0_0_1px_rgba(255,255,255,0.6)_inset]">
              <div className="pointer-events-none">
                {/*
                  Render at fixed 900px width, then scale to fit container.
                  Mobile: 900→~380px = scale(0.42), Tablet: 900→~600px = scale(0.67)
                  Desktop: scale(1.15) with fixed height for overflow effect.
                  Using w-[900px] + transform to ensure the dashboard always renders at full fidelity.
                */}
                <div className="block lg:hidden overflow-hidden" style={{ aspectRatio: '16 / 10' }}>
                  <div className="w-[900px] h-[600px] origin-top-left scale-[0.42] sm:scale-[0.7] md:scale-[0.85]">
                    <EmbeddableDashboard />
                  </div>
                </div>
                <div className="hidden lg:block origin-top-left h-[700px]" style={{ transform: 'scale(1.15)', transformOrigin: 'top left' }}>
                  <EmbeddableDashboard />
                </div>
              </div>
              {/* Bottom fade */}
              <div className="absolute bottom-0 left-0 right-0 h-20 sm:h-32 lg:h-56 bg-gradient-to-t from-white via-white/70 to-transparent pointer-events-none" />
              {/* Right fade — desktop only */}
              <div className="hidden lg:block absolute top-0 right-0 bottom-0 w-40 bg-gradient-to-l from-white via-white/70 to-transparent pointer-events-none" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
