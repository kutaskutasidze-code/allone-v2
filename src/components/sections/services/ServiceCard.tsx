'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, MotionValue, useInView } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SPRING_CONFIG, DIRECTION_TRANSFORMS, easeOutCubic, type Direction } from './constants';

// Dark card wrapper for Ciridae-style design
function StaticCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative h-full", className)}>
      <div className="relative z-10 bg-[#141414] overflow-hidden h-full">
        {children}
      </div>
    </div>
  );
}

interface ServiceCardProps {
  children: React.ReactNode;
  className?: string;
  direction?: Direction;
}

// Hook to detect mobile devices
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

// Custom hook for scroll-linked spring animations (desktop only)
function useScrollSpring(scrollYProgress: MotionValue<number>, outputRange: [number, number], enabled: boolean) {
  const smoothProgress = useTransform(scrollYProgress, easeOutCubic);
  const value = useTransform(smoothProgress, [0, 1], outputRange);
  const spring = useSpring(value, enabled ? SPRING_CONFIG : { stiffness: 200, damping: 30, mass: 0.1 });
  return enabled ? spring : value;
}

// Mobile-optimized card with Framer Motion (one-time animation, not scroll-linked)
function MobileServiceCard({ children, className = '', direction = 'bottom' }: ServiceCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  // Direction-based initial transforms for variety
  const getInitialTransform = () => {
    switch (direction) {
      case 'left': return { x: -40, y: 20, rotate: -2 };
      case 'right': return { x: 40, y: 20, rotate: 2 };
      case 'top': return { x: 0, y: -30, rotate: 0 };
      case 'top-left': return { x: -30, y: -20, rotate: -1 };
      case 'top-right': return { x: 30, y: -20, rotate: 1 };
      default: return { x: 0, y: 40, rotate: 0 };
    }
  };

  const initial = getInitialTransform();

  return (
    <motion.div
      ref={ref}
      initial={{
        opacity: 0,
        y: initial.y,
        x: initial.x,
        scale: 0.95,
        rotate: initial.rotate
      }}
      animate={isInView ? {
        opacity: 1,
        y: 0,
        x: 0,
        scale: 1,
        rotate: 0
      } : {}}
      transition={{
        duration: 0.6,
        ease: [0.25, 0.1, 0.25, 1],
        opacity: { duration: 0.4 }
      }}
      className={`h-full ${className}`}
    >
      <StaticCard>
        {children}
      </StaticCard>
    </motion.div>
  );
}

// Desktop card with full spring animations
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
      style={{
        y: smoothY,
        scale: smoothScale,
        opacity,
      }}
      className={`h-full ${className}`}
    >
      <StaticCard>{children}</StaticCard>
    </motion.div>
  );
}

export function ServiceCard(props: ServiceCardProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileServiceCard {...props} />;
  }

  return <DesktopServiceCard {...props} />;
}
