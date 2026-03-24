'use client';

import { motion } from 'framer-motion';
import { LOGO_PATHS, LOGO_COLOR, LOGO_VIEWBOX, getScatterOffset } from './shared/logo-paths';
import { GlowLayer } from './shared/GlowLayer';

export function ScatteredAssembly() {
  const scatterData = LOGO_PATHS.map((p) => getScatterOffset(p));

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 0.15, 0.6, 0.3] }}
        transition={{ duration: 3.2, times: [0, 0.12, 0.5, 0.8, 1], ease: 'easeOut' }}
        style={{
          background: 'radial-gradient(circle, rgba(43, 138, 255, 0.6) 0%, transparent 70%)',
          filter: 'blur(40px)',
          transform: 'translate3d(0,0,0)',
        }}
      />

      <motion.svg
        viewBox={LOGO_VIEWBOX}
        className="w-[60%] h-[60%] relative z-10"
        initial="scatter"
        animate="assembled"
      >
        {LOGO_PATHS.map((path, i) => {
          const scatter = scatterData[i];
          const isArm = path.type === 'arm';
          const delay = isArm ? i * 0.1 : 0.4 + (i - 4) * 0.08;

          return (
            <motion.path
              key={path.id}
              d={path.d}
              fill={LOGO_COLOR}
              style={{ transformOrigin: `${path.cx}px ${path.cy}px` }}
              initial={{
                x: scatter.x,
                y: scatter.y,
                rotate: scatter.rotate,
                scale: 0.7,
                opacity: 0.4,
              }}
              animate={{
                x: [scatter.x, scatter.x * 0.95, 0],
                y: [scatter.y, scatter.y * 0.95, 0],
                rotate: [scatter.rotate, scatter.rotate * 0.9, 0],
                scale: [0.7, 0.75, 1.03, 1],
                opacity: [0.4, 0.7, 1, 1],
                fill: [LOGO_COLOR, LOGO_COLOR, '#FFFFFF', LOGO_COLOR],
              }}
              transition={{
                duration: 2.8,
                delay,
                times: [0, 0.15, 0.75, 1],
                x: { type: 'spring', stiffness: 80, damping: 14, delay },
                y: { type: 'spring', stiffness: 80, damping: 14, delay },
                rotate: { type: 'spring', stiffness: 80, damping: 14, delay },
                scale: {
                  duration: 2.8,
                  delay,
                  times: [0, 0.15, 0.85, 1],
                  ease: 'easeOut',
                },
                fill: {
                  duration: 0.3,
                  delay: delay + 2.0,
                  times: [0, 0.3, 0.6, 1],
                },
                opacity: {
                  duration: 1.5,
                  delay,
                  times: [0, 0.3, 0.7, 1],
                },
              }}
            />
          );
        })}
      </motion.svg>

      {/* Breathing pulse after assembly */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 0.15, 0.25, 0.15] }}
        transition={{
          duration: 2,
          delay: 3.2,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut',
        }}
        style={{
          background: 'radial-gradient(circle, rgba(43, 138, 255, 0.4) 0%, transparent 60%)',
          filter: 'blur(30px)',
          transform: 'translate3d(0,0,0)',
        }}
      />
    </div>
  );
}
