'use client';

import { motion, type Variants, type Transition } from 'framer-motion';
import { LOGO_PATHS, LOGO_COLOR, LOGO_VIEWBOX } from './logo-paths';

interface LogoSVGProps {
  /** Variants applied to each path */
  pathVariants?: Variants;
  /** Variants applied to the parent svg */
  containerVariants?: Variants;
  /** Override transition for paths */
  pathTransition?: Transition;
  /** Initial state name */
  initial?: string;
  /** Animate state name */
  animate?: string;
  className?: string;
  /** Whether to render as stroke (outline) or fill */
  strokeMode?: boolean;
  /** Custom style per path index */
  getPathStyle?: (index: number) => React.CSSProperties;
  /** Custom initial per path index */
  getPathInitial?: (index: number) => Record<string, unknown>;
  /** Custom animate per path index */
  getPathAnimate?: (index: number) => Record<string, unknown>;
  /** Custom transition per path index */
  getPathTransition?: (index: number) => Transition;
}

export function LogoSVG({
  pathVariants,
  containerVariants,
  pathTransition,
  initial = 'hidden',
  animate = 'visible',
  className = '',
  strokeMode = false,
  getPathStyle,
  getPathInitial,
  getPathAnimate,
  getPathTransition,
}: LogoSVGProps) {
  return (
    <motion.svg
      viewBox={LOGO_VIEWBOX}
      className={className}
      variants={containerVariants}
      initial={initial}
      animate={animate}
    >
      {LOGO_PATHS.map((path, i) => (
        <motion.path
          key={path.id}
          d={path.d}
          fill={strokeMode ? 'none' : LOGO_COLOR}
          stroke={strokeMode ? LOGO_COLOR : 'none'}
          strokeWidth={strokeMode ? 2 : 0}
          variants={pathVariants}
          initial={getPathInitial?.(i)}
          animate={getPathAnimate?.(i)}
          transition={getPathTransition?.(i) ?? pathTransition}
          style={{
            transformOrigin: `${path.cx}px ${path.cy}px`,
            ...getPathStyle?.(i),
          }}
        />
      ))}
    </motion.svg>
  );
}
