'use client';

import { motion } from 'framer-motion';
import { LOGO_PATHS, LOGO_COLOR, LOGO_VIEWBOX } from './shared/logo-paths';

// Manhattan-routed circuit paths from corners to center
const CIRCUITS = [
  {
    id: 'tl',
    d: 'M10,10 L10,50 L60,50 L60,90 L95,90',
    nodes: [
      { x: 10, y: 10 },
      { x: 10, y: 50 },
      { x: 60, y: 50 },
      { x: 60, y: 90 },
      { x: 95, y: 90 },
    ],
    delay: 0,
  },
  {
    id: 'tr',
    d: 'M190,10 L190,55 L145,55 L145,90 L105,90',
    nodes: [
      { x: 190, y: 10 },
      { x: 190, y: 55 },
      { x: 145, y: 55 },
      { x: 145, y: 90 },
      { x: 105, y: 90 },
    ],
    delay: 0.15,
  },
  {
    id: 'br',
    d: 'M190,190 L190,145 L140,145 L140,110 L105,110',
    nodes: [
      { x: 190, y: 190 },
      { x: 190, y: 145 },
      { x: 140, y: 145 },
      { x: 140, y: 110 },
      { x: 105, y: 110 },
    ],
    delay: 0.3,
  },
  {
    id: 'bl',
    d: 'M10,190 L10,150 L55,150 L55,110 L95,110',
    nodes: [
      { x: 10, y: 190 },
      { x: 10, y: 150 },
      { x: 55, y: 150 },
      { x: 55, y: 110 },
      { x: 95, y: 110 },
    ],
    delay: 0.45,
  },
];

export function CircuitStreams() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.05, 0.15, 0.5, 0.3] }}
        transition={{ duration: 3.6, times: [0, 0.05, 0.5, 0.85, 1], ease: 'easeOut' }}
        style={{
          background: 'radial-gradient(circle, rgba(43, 138, 255, 0.6) 0%, transparent 70%)',
          filter: 'blur(40px)',
          transform: 'translate3d(0,0,0)',
        }}
      />

      <svg viewBox={LOGO_VIEWBOX} className="w-[60%] h-[60%] relative z-10">
        {/* Circuit traces */}
        {CIRCUITS.map((circuit) => (
          <g key={circuit.id}>
            {/* Path trace */}
            <motion.path
              d={circuit.d}
              fill="none"
              stroke={LOGO_COLOR}
              strokeWidth={1.2}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: [0, 1],
                opacity: [0, 0.7, 0.7, 0.15],
              }}
              transition={{
                pathLength: {
                  duration: 1.4,
                  delay: 0.2 + circuit.delay,
                  ease: [0.16, 1, 0.3, 1],
                },
                opacity: {
                  duration: 3.2,
                  delay: 0.2 + circuit.delay,
                  times: [0, 0.1, 0.8, 1],
                },
              }}
            />

            {/* Traveling dot */}
            <motion.circle
              r={2.5}
              fill="#FFFFFF"
              initial={{ offsetDistance: '0%', opacity: 0 }}
              animate={{
                offsetDistance: ['0%', '100%'],
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                offsetDistance: {
                  duration: 1.4,
                  delay: 0.2 + circuit.delay,
                  ease: [0.16, 1, 0.3, 1],
                },
                opacity: {
                  duration: 1.6,
                  delay: 0.2 + circuit.delay,
                  times: [0, 0.05, 0.85, 1],
                },
              }}
              style={{
                offsetPath: `path("${circuit.d}")`,
                filter: 'drop-shadow(0 0 4px rgba(43, 138, 255, 0.8))',
              }}
            />

            {/* Junction nodes — light up sequentially */}
            {circuit.nodes.map((node, ni) => (
              <motion.circle
                key={`${circuit.id}-n${ni}`}
                cx={node.x}
                cy={node.y}
                r={2}
                fill={LOGO_COLOR}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.5, 1], opacity: [0, 0.8, 0.4] }}
                transition={{
                  duration: 0.3,
                  delay: 0.2 + circuit.delay + (ni / circuit.nodes.length) * 1.4,
                  ease: 'easeOut',
                }}
                style={{ transformOrigin: `${node.x}px ${node.y}px` }}
              />
            ))}
          </g>
        ))}

        {/* Convergence sparks at center */}
        {[
          { cx: 95, cy: 90 },
          { cx: 105, cy: 90 },
          { cx: 105, cy: 110 },
          { cx: 95, cy: 110 },
        ].map((spark, i) => (
          <motion.circle
            key={`spark-${i}`}
            cx={spark.cx}
            cy={spark.cy}
            r={0}
            fill="white"
            initial={{ r: 0, opacity: 0 }}
            animate={{ r: [0, 6, 0], opacity: [0, 0.9, 0] }}
            transition={{
              duration: 0.3,
              delay: 1.8 + i * 0.1,
              ease: 'easeOut',
            }}
            style={{
              filter: 'drop-shadow(0 0 6px rgba(43, 138, 255, 0.9))',
            }}
          />
        ))}

        {/* Logo paths — build piece by piece */}
        {LOGO_PATHS.map((path, i) => {
          const isConnector = path.type === 'connector';
          const buildDelay = 2.4 + (isConnector ? (i - 4) * 0.08 : 0.32 + i * 0.08);

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
                  duration: 0.4,
                  delay: buildDelay,
                  ease: [0.16, 1, 0.3, 1],
                },
                strokeOpacity: {
                  duration: 0.6,
                  delay: buildDelay,
                  times: [0, 0.1, 0.6, 1],
                },
                fillOpacity: {
                  duration: 0.3,
                  delay: buildDelay + 0.25,
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
        animate={{ opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 2, delay: 3.6, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background: 'radial-gradient(circle, rgba(43, 138, 255, 0.35) 0%, transparent 60%)',
          filter: 'blur(30px)',
          transform: 'translate3d(0,0,0)',
        }}
      />
    </div>
  );
}
