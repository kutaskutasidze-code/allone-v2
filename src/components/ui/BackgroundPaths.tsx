'use client';

import { motion } from 'framer-motion';
import { memo, useMemo } from 'react';

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

function generateAestheticPath(
  index: number,
  position: number,
  type: 'primary' | 'secondary' | 'accent'
): string {
  const baseAmplitude =
    type === 'primary' ? 150 : type === 'secondary' ? 100 : 60;
  const phase = index * 0.2;
  const points: Point[] = [];
  const segments = type === 'primary' ? 10 : type === 'secondary' ? 8 : 6;

  const startX = 2400;
  const startY = 800;
  const endX = -2400;
  const endY = -800 + index * 25;

  for (let i = 0; i <= segments; i++) {
    const progress = i / segments;
    const eased = 1 - (1 - progress) ** 2;

    const baseX = startX + (endX - startX) * eased;
    const baseY = startY + (endY - startY) * eased;

    const amplitudeFactor = 1 - eased * 0.3;
    const wave1 =
      Math.sin(progress * Math.PI * 3 + phase) *
      (baseAmplitude * 0.7 * amplitudeFactor);
    const wave2 =
      Math.cos(progress * Math.PI * 4 + phase) *
      (baseAmplitude * 0.3 * amplitudeFactor);
    const wave3 =
      Math.sin(progress * Math.PI * 2 + phase) *
      (baseAmplitude * 0.2 * amplitudeFactor);

    points.push({
      x: baseX * position,
      y: baseY + wave1 + wave2 + wave3,
    });
  }

  const pathCommands = points.map((point: Point, i: number) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    const prevPoint = points[i - 1];
    const tension = 0.4;
    const cp1x = prevPoint.x + (point.x - prevPoint.x) * tension;
    const cp1y = prevPoint.y;
    const cp2x = prevPoint.x + (point.x - prevPoint.x) * (1 - tension);
    const cp2y = point.y;
    return `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${point.x} ${point.y}`;
  });

  return pathCommands.join(' ');
}

const generateUniqueId = (prefix: string): string =>
  `${prefix}-${Math.random().toString(36).substr(2, 9)}`;

const FloatingPaths = memo(function FloatingPaths({
  position,
}: {
  position: number;
}) {
  const primaryPaths: PathData[] = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: generateUniqueId('primary'),
        d: generateAestheticPath(i, position, 'primary'),
        opacity: 0.7 + i * 0.02,
        width: 2 + i * 0.2,
      })),
    [position]
  );

  const secondaryPaths: PathData[] = useMemo(
    () =>
      Array.from({ length: 15 }, (_, i) => ({
        id: generateUniqueId('secondary'),
        d: generateAestheticPath(i, position, 'secondary'),
        opacity: 0.6 + i * 0.025,
        width: 1.8 + i * 0.18,
      })),
    [position]
  );

  const accentPaths: PathData[] = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        id: generateUniqueId('accent'),
        d: generateAestheticPath(i, position, 'accent'),
        opacity: 0.5 + i * 0.02,
        width: 1.5 + i * 0.15,
      })),
    [position]
  );

  const sharedAnimationProps = {
    opacity: 1,
    scale: 1,
    transition: {
      opacity: { duration: 1 },
      scale: { duration: 1 },
    },
  };

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ transform: 'scale(2)', transformOrigin: 'center center' }}
    >
      <svg
        className="h-full w-full"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
        viewBox="-2400 -800 4800 1600"
      >
        <title>Background Paths</title>
        <defs>
          <linearGradient id="pathGradient" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="rgba(61, 90, 128, 0.85)" />
            <stop offset="25%" stopColor="rgba(80, 100, 130, 0.75)" />
            <stop offset="50%" stopColor="rgba(100, 115, 140, 0.65)" />
            <stop offset="75%" stopColor="rgba(80, 100, 130, 0.75)" />
            <stop offset="100%" stopColor="rgba(61, 90, 128, 0.85)" />
          </linearGradient>
        </defs>

        <g className="primary-waves">
          {primaryPaths.map((path) => (
            <motion.path
              animate={{
                ...sharedAnimationProps,
                y: [0, -35, 0],
              }}
              d={path.d}
              initial={{ opacity: 0, scale: 0.8 }}
              key={path.id}
              stroke="url(#pathGradient)"
              strokeLinecap="round"
              strokeWidth={path.width}
              style={{ opacity: path.opacity }}
              transition={{
                ...sharedAnimationProps.transition,
                y: {
                  duration: 6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  repeatType: 'reverse',
                },
              }}
            />
          ))}
        </g>

        <g className="secondary-waves" style={{ opacity: 1 }}>
          {secondaryPaths.map((path) => (
            <motion.path
              animate={{
                ...sharedAnimationProps,
                y: [0, -25, 0],
              }}
              d={path.d}
              initial={{ opacity: 0, scale: 0.9 }}
              key={path.id}
              stroke="url(#pathGradient)"
              strokeLinecap="round"
              strokeWidth={path.width}
              style={{ opacity: path.opacity }}
              transition={{
                ...sharedAnimationProps.transition,
                y: {
                  duration: 5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  repeatType: 'reverse',
                },
              }}
            />
          ))}
        </g>

        <g className="accent-waves" style={{ opacity: 0.9 }}>
          {accentPaths.map((path) => (
            <motion.path
              animate={{
                ...sharedAnimationProps,
                y: [0, -15, 0],
              }}
              d={path.d}
              initial={{ opacity: 0, scale: 0.95 }}
              key={path.id}
              stroke="url(#pathGradient)"
              strokeLinecap="round"
              strokeWidth={path.width}
              style={{ opacity: path.opacity }}
              transition={{
                ...sharedAnimationProps.transition,
                y: {
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  repeatType: 'reverse',
                },
              }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
});

export const BackgroundPaths = memo(function BackgroundPaths() {
  return (
    <div className="absolute inset-0">
      <FloatingPaths position={1} />
    </div>
  );
});
