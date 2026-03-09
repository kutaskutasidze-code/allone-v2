'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, MotionValue, useInView } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SPRING_CONFIG, DIRECTION_TRANSFORMS, easeOutCubic, type Direction } from './constants';

interface ServiceCardProps {
  children: React.ReactNode;
  className?: string;
  direction?: Direction;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

function useScrollSpring(scrollYProgress: MotionValue<number>, outputRange: [number, number], enabled: boolean) {
  const smoothProgress = useTransform(scrollYProgress, easeOutCubic);
  const value = useTransform(smoothProgress, [0, 1], outputRange);
  const spring = useSpring(value, enabled ? SPRING_CONFIG : { stiffness: 200, damping: 30, mass: 0.1 });
  return enabled ? spring : value;
}

function MobileServiceCard({ children, className = '', direction = 'bottom' }: ServiceCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      className={`h-full ${className}`}
    >
      <div className="relative h-full bg-surface rounded-2xl overflow-hidden border border-white/[0.06]">
        {children}
      </div>
    </motion.div>
  );
}

function DesktopServiceCard({ children, className = '', direction = 'bottom' }: ServiceCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 95%", "start 40%"]
  });

  const transforms = DIRECTION_TRANSFORMS[direction];
  const smoothY = useScrollSpring(scrollYProgress, transforms.y, true);
  const smoothScale = useScrollSpring(scrollYProgress, [0.98, 1], true);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);

  return (
    <motion.div
      ref={ref}
      style={{ y: smoothY, scale: smoothScale, opacity }}
      className={`h-full ${className}`}
    >
      <div className="relative h-full bg-surface rounded-2xl overflow-hidden border border-white/[0.06]">
        {children}
      </div>
    </motion.div>
  );
}

export function ServiceCard(props: ServiceCardProps) {
  const isMobile = useIsMobile();
  return isMobile ? <MobileServiceCard {...props} /> : <DesktopServiceCard {...props} />;
}
