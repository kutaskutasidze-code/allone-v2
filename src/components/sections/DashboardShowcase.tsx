'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Eye, Sparkles, TrendingUp } from 'lucide-react';
import { EmbeddableDashboard } from '@/components/showcase/DashboardShowcase';
import { ShineBorder } from '@/components/ui/ShineBorder';

const features = [
  { icon: Eye, text: "See exactly what's working — and what isn't" },
  { icon: Sparkles, text: "Let AI surface optimizations you'd miss" },
  { icon: TrendingUp, text: "Scale operations without adding headcount" },
];

export function DashboardShowcase() {
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
    <section className="pt-8 lg:pt-12 pb-24 lg:pb-32 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mb-12 lg:mb-16"
        >
          <p className="mono-label mb-4">Dashboard</p>
          <h2 className="text-4xl lg:text-5xl font-semibold text-heading leading-[1.05] tracking-[-0.03em] mb-4">
            See your business
            <br />run itself
          </h2>
          <p className="text-lg text-muted leading-relaxed">
            We turn chaotic workflows into streamlined systems you can monitor, optimize, and scale from a single view.
          </p>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-3 mb-12"
        >
          {features.map((f, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface border border-border"
            >
              <div className="flex-shrink-0 p-2 rounded-lg bg-accent-light">
                <f.icon className="w-4 h-4 text-accent" />
              </div>
              <span className="text-foreground text-sm">{f.text}</span>
            </div>
          ))}
        </motion.div>

        {/* Dashboard preview with 3D perspective */}
        <motion.div
          ref={sectionRef}
          style={{ y: smoothY, opacity: smoothOpacity }}
          className="relative"
        >
          <ShineBorder borderRadius={20} className="p-0 border border-border overflow-hidden">
            <div
              className="relative w-full pointer-events-none"
              style={{
                boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
                transform: 'perspective(2000px) rotateX(2deg)',
              }}
            >
              <EmbeddableDashboard />
            </div>
          </ShineBorder>

          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
        </motion.div>
      </div>
    </section>
  );
}
