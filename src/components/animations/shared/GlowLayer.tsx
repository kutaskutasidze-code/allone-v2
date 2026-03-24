'use client';

import { motion, type MotionValue, useMotionTemplate } from 'framer-motion';

interface GlowLayerProps {
  /** 0–1 intensity, can be a static number or MotionValue */
  intensity: number | MotionValue<number>;
  color?: string;
  className?: string;
}

export function GlowLayer({ intensity, color = '43, 138, 255', className = '' }: GlowLayerProps) {
  // If intensity is a MotionValue, use motion template for reactive opacity
  const isMotionValue = typeof intensity === 'object' && 'get' in intensity;

  if (isMotionValue) {
    const bg = useMotionTemplate`radial-gradient(circle, rgba(${color}, ${intensity as MotionValue<number>}) 0%, transparent 70%)`;
    return (
      <motion.div
        className={`absolute inset-0 pointer-events-none ${className}`}
        style={{
          background: bg,
          filter: 'blur(40px)',
          WebkitFilter: 'blur(40px)',
          transform: 'translate3d(0,0,0)',
        }}
      />
    );
  }

  return (
    <motion.div
      className={`absolute inset-0 pointer-events-none ${className}`}
      animate={{ opacity: [0, intensity as number] }}
      transition={{ duration: 2, ease: 'easeOut' }}
      style={{
        background: `radial-gradient(circle, rgba(${color}, 0.6) 0%, transparent 70%)`,
        filter: 'blur(40px)',
        WebkitFilter: 'blur(40px)',
        transform: 'translate3d(0,0,0)',
      }}
    />
  );
}
