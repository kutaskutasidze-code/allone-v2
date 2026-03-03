'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, MotionValue } from 'framer-motion';
import { Eye, Sparkles, TrendingUp } from 'lucide-react';
import { EmbeddableDashboard } from '@/components/showcase/DashboardShowcase';

// ============================================================================
// CONSTANTS & UTILITIES
// ============================================================================

const SPRING_CONFIG = { stiffness: 80, damping: 25, mass: 0.5 };
const DASHBOARD_SPRING_CONFIG = { stiffness: 70, damping: 25, mass: 0.6 };
const OPACITY_SPRING_CONFIG = { stiffness: 100, damping: 20, mass: 0.3 };

const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);

const features = [
  { icon: Eye, text: "See exactly what's working—and what isn't" },
  { icon: Sparkles, text: "Let AI surface optimizations you'd miss" },
  { icon: TrendingUp, text: "Scale operations without adding headcount" },
];

// Animation variants for mobile
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 25 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const }
  }
};

// ============================================================================
// SCROLL-ANIMATED COMPONENTS
// ============================================================================

// Custom hook for scroll-linked spring animations
function useScrollSpring(
  scrollYProgress: MotionValue<number>,
  outputRange: [number, number],
  config = SPRING_CONFIG
) {
  const smoothProgress = useTransform(scrollYProgress, easeOutCubic);
  const value = useTransform(smoothProgress, [0, 1], outputRange);
  return useSpring(value, config);
}

// Text column - slides from left
const ScrollTextColumn = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 90%", "start 30%"]
  });

  const smoothX = useScrollSpring(scrollYProgress, [-100, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.4], [0, 1]);
  const smoothOpacity = useSpring(opacity, OPACITY_SPRING_CONFIG);

  return (
    <motion.div
      ref={ref}
      style={{ x: smoothX, opacity: smoothOpacity, willChange: 'transform, opacity' }}
      className="lg:col-span-3 space-y-6"
    >
      {children}
    </motion.div>
  );
};

// Dashboard column - slides from right with 3D effect
const ScrollDashboardColumn = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 95%", "start 25%"]
  });

  const smoothX = useScrollSpring(scrollYProgress, [120, 0], DASHBOARD_SPRING_CONFIG);
  const smoothRotateY = useScrollSpring(scrollYProgress, [8, 0], DASHBOARD_SPRING_CONFIG);
  const smoothScale = useScrollSpring(scrollYProgress, [0.95, 1], DASHBOARD_SPRING_CONFIG);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);
  const smoothOpacity = useSpring(opacity, OPACITY_SPRING_CONFIG);

  return (
    <motion.div
      ref={ref}
      style={{
        x: smoothX,
        rotateY: smoothRotateY,
        scale: smoothScale,
        opacity: smoothOpacity,
        perspective: 2000,
        transformStyle: 'preserve-3d',
        willChange: 'transform, opacity',
      }}
      className="lg:col-span-9 relative"
    >
      {children}
    </motion.div>
  );
};

export function DashboardShowcase() {
  return (
    <section className="relative w-full bg-[var(--black)] overflow-hidden py-12 sm:py-16 lg:py-32">

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop: side by side layout with scroll animations */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-12 items-start">
          {/* Text Column - slides from LEFT */}
          <ScrollTextColumn>
            <p className="mono-label mb-2">Dashboard</p>
            <h2 className="text-5xl font-light text-white leading-[1.1] tracking-[-0.02em]">
              See your business
              <br />
              run itself
            </h2>

            <p className="text-lg text-white/60 leading-relaxed">
              We turn chaotic workflows into streamlined systems you can monitor, optimize, and scale from a single view.
            </p>

            <div className="space-y-3 pt-2">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-4 rounded-[var(--radius-sm)] bg-white/[0.04] border border-white/10 group hover:border-white/20 transition-colors"
                >
                  <div className="flex-shrink-0 p-2.5 rounded-[var(--radius-sm)] bg-white/[0.06]">
                    <feature.icon className="w-5 h-5 text-white/60 group-hover:text-[var(--accent)] transition-colors" />
                  </div>
                  <span className="text-white text-sm">{feature.text}</span>
                </div>
              ))}
            </div>
          </ScrollTextColumn>

          {/* Dashboard Column - slides from RIGHT */}
          <ScrollDashboardColumn>
            <div className="relative">
              {/* Dashboard container */}
              <div
                className="relative rounded-[var(--radius-lg)] overflow-hidden pointer-events-none border border-white/10"
                style={{
                  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
              >
                <div style={{ WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale', textRendering: 'optimizeLegibility' }}>
                  <EmbeddableDashboard />
                </div>
              </div>
            </div>
          </ScrollDashboardColumn>
        </div>

        {/* Mobile: stacked layout - Headline, Features, Dashboard */}
        <div className="lg:hidden space-y-5">
          {/* Headline + Body */}
          <motion.div
            className="space-y-2 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={containerVariants}
          >
            <motion.p variants={itemVariants} className="mono-label">Dashboard</motion.p>
            <motion.h2
              variants={itemVariants}
              className="text-3xl font-light text-white leading-[1.1] tracking-[-0.02em]"
            >
              See your business
              <br />
              run itself
            </motion.h2>

            <motion.p
              variants={itemVariants}
              className="text-sm text-white/60 leading-relaxed"
            >
              Streamlined systems you can monitor and scale.
            </motion.p>
          </motion.div>

          {/* Features - BEFORE dashboard on mobile */}
          <motion.div
            className="space-y-2"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            {features.map((feature, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="flex items-center gap-2.5 p-2.5 rounded-[var(--radius-sm)] bg-white/[0.04] border border-white/10"
              >
                <div className="flex-shrink-0 p-1.5 rounded-[var(--radius-sm)] bg-white/[0.06]">
                  <feature.icon className="w-3.5 h-3.5 text-white/60" />
                </div>
                <span className="text-white text-xs">{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Dashboard - FULL WIDTH edge to edge */}
          <motion.div
            className="relative -mx-4 sm:-mx-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div
              className="relative overflow-visible"
              style={{ height: '220px' }}
            >
              <div
                className="rounded-[var(--radius-lg)] overflow-hidden border border-white/10"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  width: '1000px',
                  transform: 'translateX(-50%) scale(0.36)',
                  transformOrigin: 'top center',
                  pointerEvents: 'none',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                }}
              >
                <EmbeddableDashboard />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
