'use client';

import { Suspense, lazy } from 'react';
import { motion } from 'framer-motion';

const Spline = lazy(() => import('@splinetool/react-spline'));

function SplineLoadingFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-16 h-16 rounded-full border-2 border-border border-t-accent animate-spin" />
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative h-[100svh] flex flex-col items-center overflow-hidden bg-white">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(10,104,245,0.04)_0%,transparent_70%)] pointer-events-none" />

      {/* Mono label */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mono-label mt-[clamp(6rem,15vh,8rem)] mb-[clamp(1rem,2vh,1.5rem)]"
      >
        AI Automation Agency
      </motion.p>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 text-center text-[clamp(2.5rem,6vw,5.5rem)] font-semibold leading-[0.95] tracking-[-0.04em] text-[#071D2F] px-4"
      >
        All Systems.
        <br />
        <span className="text-accent">One Intelligence.</span>
      </motion.h1>

      {/* 3D Robot — optimized container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full flex-1 will-change-transform"
        style={{
          marginTop: '-2rem',
          height: '120vh', // Reduced from 180vh to save GPU resources
          minHeight: '800px',
        }}
      >
        <Suspense fallback={<SplineLoadingFallback />}>
          <Spline
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full"
          />
        </Suspense>
      </motion.div>

      {/* Gradient fade — bottom, blends into next section */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent via-white/80 to-white z-20 pointer-events-none" />
    </section>
  );
}
