'use client';

import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useRef } from 'react';
import { MacBookFrame } from './MacBookFrame';
import { HeroPreview } from './HeroPreview';

const techStack = [
  { name: 'Next.js', color: '#000000' },
  { name: 'React', color: '#61DAFB' },
  { name: 'TypeScript', color: '#3178C6' },
  { name: 'Tailwind CSS', color: '#06B6D4' },
  { name: 'Supabase', color: '#3FCF8E' },
];

export function WebDevShowcase() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const stiff = { stiffness: 200, damping: 40, mass: 1 };
  const entryY_raw = useTransform(scrollYProgress, [0.1, 0.3], [80, 0]);
  const entryScale_raw = useTransform(scrollYProgress, [0.1, 0.3], [0.92, 1]);
  const entryRotateX_raw = useTransform(scrollYProgress, [0.1, 0.3], [4, 0]);
  const entryOpacity = useTransform(scrollYProgress, [0.1, 0.22], [0, 1]);
  const entryY = useSpring(entryY_raw, stiff);
  const entryScale = useSpring(entryScale_raw, stiff);
  const entryRotateX = useSpring(entryRotateX_raw, stiff);

  return (
    <section ref={sectionRef} className="relative py-24 lg:py-32 overflow-x-clip">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-50/20 to-transparent pointer-events-none" />

      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="relative w-[1000px] h-[700px]">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-400/30 via-purple-300/25 to-indigo-300/20 rounded-full blur-[120px]" />
          <div className="absolute top-20 -right-10 w-72 h-72 bg-purple-400/25 rounded-full blur-[80px]" />
          <div className="absolute -bottom-10 left-20 w-80 h-80 bg-indigo-300/20 rounded-full blur-[90px]" />
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[0.68fr_0.32fr] gap-8 lg:gap-10 items-center">
          {/* MacBook — order-2 on mobile (below text), order-1 on desktop (left) */}
          <motion.div
            style={{
              y: entryY,
              scale: entryScale,
              rotateX: entryRotateX,
              opacity: entryOpacity,
              transformPerspective: 1200,
            }}
            className="relative order-2 lg:order-1 lg:-ml-12"
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
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-gray-400">Web Development</span>
            <h2
              className="text-3xl lg:text-[2.5rem] font-bold text-gray-900 mt-3 mb-5 tracking-[-0.03em] leading-[1.1]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Websites that convert{' '}<br className="hidden lg:block" />
              visitors into customers
            </h2>
            <p
              className="text-[15px] text-gray-500 leading-[1.7] mb-6 max-w-[280px] mx-auto lg:mx-0"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              We design and build fast, modern web applications with Next.js — optimized for performance, SEO, and conversion from day one.
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
