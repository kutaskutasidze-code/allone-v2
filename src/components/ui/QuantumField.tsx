'use client';

import { motion } from 'framer-motion';
import { memo, useMemo, useEffect, useState } from 'react';

interface Point {
  x: number;
  y: number;
}

interface PathData {
  id: string;
  d: string;
  opacity: number;
  width: number;
}

function generateQuantumPath(
  index: number,
  position: number
): string {
  const baseAmplitude = 80;
  const phase = index * 0.5;
  const points: Point[] = [];
  const segments = 12;

  const startX = 2000;
  const startY = 600;
  const endX = -2000;
  const endY = -600 + index * 40;

  for (let i = 0; i <= segments; i++) {
    const progress = i / segments;
    const eased = 1 - (1 - progress) ** 2;

    const baseX = startX + (endX - startX) * eased;
    const baseY = startY + (endY - startY) * eased;

    const wave = Math.sin(progress * Math.PI * 4 + phase) * baseAmplitude;

    points.push({
      x: baseX * position,
      y: baseY + wave,
    });
  }

  const pathCommands = points.map((point: Point, i: number) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    const prevPoint = points[i - 1];
    const tension = 0.5;
    const cp1x = prevPoint.x + (point.x - prevPoint.x) * tension;
    const cp1y = prevPoint.y;
    const cp2x = prevPoint.x + (point.x - prevPoint.x) * (1 - tension);
    const cp2y = point.y;
    return `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${point.x} ${point.y}`;
  });

  return pathCommands.join(' ');
}

export const QuantumField = memo(function QuantumField() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const paths: PathData[] = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        id: `quantum-path-${i}`, // Stable ID for hydration
        d: generateQuantumPath(i, 1),
        opacity: 0.15 + i * 0.05,
        width: 0.5 + i * 0.1,
      })),
    []
  );

  if (!mounted) return <div className="absolute inset-0 bg-white" />;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-40">
      <svg
        className="h-full w-full"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
        viewBox="-2000 -600 4000 1200"
      >
        <defs>
          <linearGradient id="quantumGradient" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#0A68F5" stopOpacity="0" />
            <stop offset="50%" stopColor="#0A68F5" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0A68F5" stopOpacity="0" />
          </linearGradient>
        </defs>

        {paths.map((path, i) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="url(#quantumGradient)"
            strokeWidth={path.width}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: 1, 
              opacity: path.opacity,
              y: [0, -20, 0] 
            }}
            transition={{
              pathLength: { duration: 3, delay: i * 0.2, ease: "easeInOut" },
              opacity: { duration: 1, delay: i * 0.2 },
              y: { 
                duration: 10 + i * 2, 
                repeat: Infinity, 
                ease: "easeInOut",
                repeatType: "reverse"
              }
            }}
          />
        ))}
      </svg>
    </div>
  );
});
