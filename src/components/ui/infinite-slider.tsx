'use client';

import { cn } from '@/lib/utils';
import { motion, useAnimationControls, type HTMLMotionProps } from 'framer-motion';
import { useEffect, useRef, useState, useCallback } from 'react';

interface InfiniteSliderProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode;
  gap?: number;
  reverse?: boolean;
  duration?: number;
  durationOnHover?: number;
  direction?: 'horizontal' | 'vertical';
}

export function InfiniteSlider({
  children,
  gap = 24,
  reverse = false,
  duration = 40,
  durationOnHover,
  direction = 'horizontal',
  className,
  ...props
}: InfiniteSliderProps) {
  const [contentWidth, setContentWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const controls = useAnimationControls();

  useEffect(() => {
    if (contentRef.current) {
      setContentWidth(contentRef.current.scrollWidth);
    }
  }, [children]);

  const startAnimation = useCallback(async () => {
    const finalDuration = duration;
    const distance = contentWidth + gap;

    await controls.set({ x: reverse ? -distance : 0 });
    await controls.start({
      x: reverse ? 0 : -distance,
      transition: {
        duration: finalDuration,
        ease: 'linear',
        repeat: Infinity,
      },
    });
  }, [controls, contentWidth, gap, reverse, duration]);

  useEffect(() => {
    if (contentWidth > 0) {
      startAnimation();
    }
  }, [contentWidth, startAnimation]);

  return (
    <motion.div
      ref={containerRef}
      className={cn('overflow-hidden', className)}
      {...props}
    >
      <motion.div
        className="flex w-max"
        style={{ gap: `${gap}px` }}
        animate={controls}
      >
        <div ref={contentRef} className="flex" style={{ gap: `${gap}px` }}>
          {children}
        </div>
        <div className="flex" style={{ gap: `${gap}px` }} aria-hidden="true">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}
