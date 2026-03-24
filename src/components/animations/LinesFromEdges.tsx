'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { LOGO_PATHS, LOGO_COLOR, LOGO_VIEWBOX } from './shared/logo-paths';

interface EdgeLine {
  x1: number;
  y1: number;
  delay: number;
  opacity: number;
}

function generateLines(count: number): EdgeLine[] {
  const lines: EdgeLine[] = [];
  for (let i = 0; i < count; i++) {
    const edge = i % 4;
    const t = (i * 37 + 13) % 100; // deterministic pseudo-random
    let x1: number, y1: number;
    switch (edge) {
      case 0: x1 = (t / 100) * 200; y1 = -10; break;     // top
      case 1: x1 = 210; y1 = (t / 100) * 200; break;      // right
      case 2: x1 = (t / 100) * 200; y1 = 210; break;      // bottom
      default: x1 = -10; y1 = (t / 100) * 200; break;     // left
    }
    lines.push({
      x1,
      y1,
      delay: (i * 0.04),
      opacity: 0.15 + (t / 100) * 0.35,
    });
  }
  return lines;
}

export function LinesFromEdges() {
  const lines = useMemo(() => generateLines(24), []);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.05, 0.4, 0.55, 0.3] }}
        transition={{ duration: 3.5, times: [0, 0.1, 0.6, 0.8, 1], ease: 'easeOut' }}
        style={{
          background: 'radial-gradient(circle, rgba(43, 138, 255, 0.6) 0%, transparent 70%)',
          filter: 'blur(40px)',
          transform: 'translate3d(0,0,0)',
        }}
      />

      <svg viewBox={LOGO_VIEWBOX} className="w-[60%] h-[60%] relative z-10">
        {/* Streaming lines */}
        {lines.map((line, i) => (
          <motion.line
            key={`line-${i}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x1}
            y2={line.y1}
            stroke={LOGO_COLOR}
            strokeWidth={1}
            strokeLinecap="round"
            initial={{ x2: line.x1, y2: line.y1, opacity: 0 }}
            animate={{
              x2: [line.x1, 100],
              y2: [line.y1, 100],
              opacity: [0, line.opacity, line.opacity, 0],
            }}
            transition={{
              duration: 1.8,
              delay: line.delay,
              times: [0, 0.6, 0.85, 1],
              ease: [0.16, 1, 0.3, 1],
            }}
          />
        ))}

        {/* Logo paths — draw stroke then fill */}
        {LOGO_PATHS.map((path, i) => {
          const isArm = path.type === 'arm';
          const drawDelay = 2.0 + (isArm ? i * 0.06 : 0.24 + (i - 4) * 0.04);

          return (
            <motion.path
              key={path.id}
              d={path.d}
              stroke={LOGO_COLOR}
              strokeWidth={1.5}
              fill={LOGO_COLOR}
              initial={{
                pathLength: 0,
                fillOpacity: 0,
                strokeOpacity: 0,
              }}
              animate={{
                pathLength: [0, 1],
                strokeOpacity: [0, 1, 1, 0],
                fillOpacity: [0, 0, 0, 1],
              }}
              transition={{
                pathLength: {
                  duration: 0.7,
                  delay: drawDelay,
                  ease: [0.16, 1, 0.3, 1],
                },
                strokeOpacity: {
                  duration: 1.2,
                  delay: drawDelay,
                  times: [0, 0.1, 0.6, 1],
                },
                fillOpacity: {
                  duration: 0.5,
                  delay: drawDelay + 0.5,
                  ease: 'easeOut',
                },
              }}
            />
          );
        })}
      </svg>

      {/* Breathing */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.2, 0.3, 0.2] }}
        transition={{ duration: 2, delay: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background: 'radial-gradient(circle, rgba(43, 138, 255, 0.35) 0%, transparent 60%)',
          filter: 'blur(30px)',
          transform: 'translate3d(0,0,0)',
        }}
      />
    </div>
  );
}
