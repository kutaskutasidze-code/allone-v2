'use client';

import { motion } from 'framer-motion';

interface GradientBlobsProps {
  variant?: 'hero' | 'subtle';
  className?: string;
}

const sfBlur = (px: number) => ({ filter: `blur(${px}px)`, WebkitFilter: `blur(${px}px)`, transform: 'translate3d(0,0,0)' } as React.CSSProperties);

export function GradientBlobs({ variant = 'hero', className = '' }: GradientBlobsProps) {
  if (variant === 'subtle') {
    return (
      <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
        <motion.div
          className="absolute w-[500px] h-[200px] rounded-[50%]"
          style={{ backgroundColor: 'rgb(0,90,255)', opacity: 0.12, top: '10%', left: '-10%', ...sfBlur(100) }}
          animate={{ x: [0, 40, -20, 30, 0], y: [0, -15, 10, -5, 0], scaleX: [1, 1.1, 0.95, 1.05, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-[400px] h-[160px] rounded-[50%]"
          style={{ backgroundColor: 'rgb(0,210,210)', opacity: 0.1, top: '30%', right: '-5%', ...sfBlur(90) }}
          animate={{ x: [0, -30, 20, -10, 0], y: [0, 15, -10, 5, 0], scaleX: [1.05, 0.95, 1.1, 1, 1.05] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-[350px] h-[140px] rounded-[50%]"
          style={{ backgroundColor: 'rgb(16,185,129)', opacity: 0.08, bottom: '10%', left: '20%', ...sfBlur(80) }}
          animate={{ x: [-20, 30, -10, 20, -20], y: [10, -10, 15, -5, 10] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    );
  }

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <motion.div
        className="absolute w-[700px] h-[220px] rounded-[50%]"
        style={{ backgroundColor: 'rgb(0,90,255)', opacity: 0.5, top: '10%', left: '0%', ...sfBlur(90) }}
        animate={{ x: [-120, -20, -140, -60, -120], y: [0, -30, 20, -15, 0], scaleX: [1, 1.2, 0.95, 1.15, 1], opacity: [0.5, 0.35, 0.55, 0.4, 0.5] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[600px] h-[200px] rounded-[50%]"
        style={{ backgroundColor: 'rgb(0,210,210)', opacity: 0.4, top: '35%', right: '5%', ...sfBlur(80) }}
        animate={{ x: [60, -40, 80, 10, 60], y: [-10, 25, -20, 15, -10], scaleX: [1.1, 0.9, 1.2, 1, 1.1], opacity: [0.4, 0.5, 0.3, 0.45, 0.4] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[550px] h-[180px] rounded-[50%]"
        style={{ backgroundColor: 'rgb(16,185,129)', opacity: 0.35, bottom: '10%', left: '10%', ...sfBlur(80) }}
        animate={{ x: [-40, 60, -60, 30, -40], y: [-20, -40, -10, -30, -20], scaleX: [1.05, 0.95, 1.15, 1, 1.05], opacity: [0.35, 0.45, 0.25, 0.4, 0.35] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[200px] h-[100px] rounded-[50%]"
        style={{ backgroundColor: 'rgb(0,120,255)', opacity: 0.25, top: '25%', left: '45%', ...sfBlur(60) }}
        animate={{ x: [120, -120, 100, -90, 120], y: [-60, 60, -50, 50, -60], opacity: [0.25, 0.35, 0.2, 0.3, 0.25] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}
