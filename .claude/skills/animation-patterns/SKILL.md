---
name: animation-patterns
description: Animation patterns using Framer Motion and CSS for Next.js applications. Covers page transitions, scroll animations, micro-interactions, and performance. Use when adding motion to websites.
---

# Animation Patterns with Framer Motion

## Installation

```bash
npm install framer-motion
```

---

## Pattern 1: Basic Animations

### Fade In on Mount

```typescript
// components/FadeIn.tsx
'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export function FadeIn({
  children,
  delay = 0,
  duration = 0.5,
  direction,
}: FadeInProps) {
  const directionOffset = {
    up: { y: 40 },
    down: { y: -40 },
    left: { x: 40 },
    right: { x: -40 },
  };

  return (
    <motion.div
      initial={{
        opacity: 0,
        ...(direction ? directionOffset[direction] : {}),
      }}
      animate={{
        opacity: 1,
        x: 0,
        y: 0,
      }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

// Usage
<FadeIn delay={0.2} direction="up">
  <h1>Welcome</h1>
</FadeIn>
```

### Stagger Children

```typescript
// components/StaggerContainer.tsx
'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface StaggerContainerProps {
  children: ReactNode;
  staggerDelay?: number;
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

export function StaggerContainer({ children, className }: StaggerContainerProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children }: { children: ReactNode }) {
  return <motion.div variants={itemVariants}>{children}</motion.div>;
}

// Usage
<StaggerContainer className="grid grid-cols-3 gap-4">
  {items.map(item => (
    <StaggerItem key={item.id}>
      <Card {...item} />
    </StaggerItem>
  ))}
</StaggerContainer>
```

---

## Pattern 2: Scroll Animations

### Animate on Scroll

```typescript
// components/ScrollReveal.tsx
'use client';

import { motion, useInView } from 'framer-motion';
import { ReactNode, useRef } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  className?: string;
}

export function ScrollReveal({
  children,
  delay = 0,
  direction = 'up',
  className,
}: ScrollRevealProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: true,
    margin: '-100px',
  });

  const directionOffset = {
    up: { y: 50 },
    down: { y: -50 },
    left: { x: 50 },
    right: { x: -50 },
  };

  return (
    <motion.div
      ref={ref}
      initial={{
        opacity: 0,
        ...directionOffset[direction],
      }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Usage
<ScrollReveal direction="up" delay={0.2}>
  <section>...</section>
</ScrollReveal>
```

### Parallax Effect

```typescript
// components/Parallax.tsx
'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { ReactNode, useRef } from 'react';

interface ParallaxProps {
  children: ReactNode;
  offset?: number;
  className?: string;
}

export function Parallax({ children, offset = 50, className }: ParallaxProps) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [-offset, offset]);

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}

// Usage
<Parallax offset={100}>
  <Image src="/hero.jpg" alt="Hero" />
</Parallax>
```

### Scroll Progress Indicator

```typescript
// components/ScrollProgress.tsx
'use client';

import { motion, useScroll, useSpring } from 'framer-motion';

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-black origin-left z-50"
      style={{ scaleX }}
    />
  );
}
```

---

## Pattern 3: Page Transitions

### Layout Animation Wrapper

```typescript
// components/PageTransition.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
    },
  },
};

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Usage in layout.tsx
export default function Layout({ children }) {
  return (
    <PageTransition>
      {children}
    </PageTransition>
  );
}
```

### Slide Transitions

```typescript
// components/SlideTransition.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

type Direction = 'left' | 'right' | 'up' | 'down';

interface SlideTransitionProps {
  children: ReactNode;
  direction?: Direction;
}

const slideVariants = (direction: Direction) => {
  const offset = 100;
  const directions = {
    left: { x: -offset, y: 0 },
    right: { x: offset, y: 0 },
    up: { x: 0, y: -offset },
    down: { x: 0, y: offset },
  };

  return {
    initial: { opacity: 0, ...directions[direction] },
    animate: { opacity: 1, x: 0, y: 0 },
    exit: {
      opacity: 0,
      x: -directions[direction].x,
      y: -directions[direction].y,
    },
  };
};

export function SlideTransition({
  children,
  direction = 'right',
}: SlideTransitionProps) {
  const pathname = usePathname();
  const variants = slideVariants(direction);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

---

## Pattern 4: Micro-Interactions

### Button Hover Effects

```typescript
// components/AnimatedButton.tsx
'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimatedButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'scale' | 'lift' | 'glow';
  className?: string;
}

export function AnimatedButton({
  children,
  onClick,
  variant = 'scale',
  className = '',
}: AnimatedButtonProps) {
  const variants = {
    scale: {
      whileHover: { scale: 1.05 },
      whileTap: { scale: 0.95 },
    },
    lift: {
      whileHover: { y: -4, boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
      whileTap: { y: 0 },
    },
    glow: {
      whileHover: {
        boxShadow: '0 0 20px rgba(0,0,0,0.3)',
      },
      whileTap: { scale: 0.98 },
    },
  };

  return (
    <motion.button
      onClick={onClick}
      className={className}
      {...variants[variant]}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.button>
  );
}

// Usage
<AnimatedButton variant="lift" className="px-6 py-3 bg-black text-white rounded-lg">
  Get Started
</AnimatedButton>
```

### Card Hover Effects

```typescript
// components/AnimatedCard.tsx
'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedCard({ children, className }: AnimatedCardProps) {
  return (
    <motion.div
      className={`${className} cursor-pointer`}
      whileHover={{
        y: -8,
        transition: { duration: 0.3, ease: 'easeOut' },
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <motion.div
        className="h-full"
        whileHover={{
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
```

### Text Reveal Animation

```typescript
// components/TextReveal.tsx
'use client';

import { motion } from 'framer-motion';

interface TextRevealProps {
  text: string;
  className?: string;
  delay?: number;
}

export function TextReveal({ text, className, delay = 0 }: TextRevealProps) {
  const words = text.split(' ');

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: delay,
      },
    },
  };

  const child = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  return (
    <motion.p
      variants={container}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {words.map((word, index) => (
        <motion.span
          key={index}
          variants={child}
          className="inline-block mr-[0.25em]"
        >
          {word}
        </motion.span>
      ))}
    </motion.p>
  );
}

// Usage
<TextReveal
  text="Building the future of intelligent automation"
  className="text-4xl font-bold"
/>
```

### Number Counter Animation

```typescript
// components/Counter.tsx
'use client';

import { motion, useSpring, useTransform, useInView } from 'framer-motion';
import { useRef, useEffect } from 'react';

interface CounterProps {
  from?: number;
  to: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}

export function Counter({
  from = 0,
  to,
  duration = 2,
  suffix = '',
  prefix = '',
  className,
}: CounterProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const spring = useSpring(from, {
    duration: duration * 1000,
    bounce: 0,
  });

  const display = useTransform(spring, (value) =>
    Math.round(value).toLocaleString()
  );

  useEffect(() => {
    if (isInView) {
      spring.set(to);
    }
  }, [isInView, spring, to]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      <motion.span>{display}</motion.span>
      {suffix}
    </span>
  );
}

// Usage
<Counter to={10000} suffix="+" prefix="$" duration={2.5} />
```

---

## Pattern 5: Loading & Skeleton Animations

### Skeleton Loader

```typescript
// components/Skeleton.tsx
'use client';

import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <motion.div
      className={`bg-gray-200 rounded ${className}`}
      animate={{
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

// Card skeleton
export function CardSkeleton() {
  return (
    <div className="p-4 border rounded-lg">
      <Skeleton className="h-40 w-full mb-4" />
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}
```

### Loading Spinner

```typescript
// components/Spinner.tsx
'use client';

import { motion } from 'framer-motion';

export function Spinner({ size = 24 }: { size?: number }) {
  return (
    <motion.div
      className="border-2 border-gray-200 border-t-black rounded-full"
      style={{ width: size, height: size }}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
}

// Dots loader
export function DotsLoader() {
  return (
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-black rounded-full"
          animate={{
            y: [0, -8, 0],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
          }}
        />
      ))}
    </div>
  );
}
```

---

## Pattern 6: Gesture Animations

### Draggable Element

```typescript
// components/Draggable.tsx
'use client';

import { motion } from 'framer-motion';
import { ReactNode, useRef } from 'react';

interface DraggableProps {
  children: ReactNode;
  constraintsRef?: React.RefObject<HTMLElement>;
}

export function Draggable({ children, constraintsRef }: DraggableProps) {
  const defaultConstraints = useRef(null);

  return (
    <motion.div
      drag
      dragConstraints={constraintsRef ?? defaultConstraints}
      dragElastic={0.1}
      whileDrag={{ scale: 1.05, cursor: 'grabbing' }}
      className="cursor-grab"
    >
      {children}
    </motion.div>
  );
}
```

### Swipeable Cards

```typescript
// components/SwipeableCard.tsx
'use client';

import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { ReactNode } from 'react';

interface SwipeableCardProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
}: SwipeableCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const controls = useAnimation();

  const handleDragEnd = async (
    _: unknown,
    info: { offset: { x: number }; velocity: { x: number } }
  ) => {
    const threshold = 100;

    if (info.offset.x > threshold) {
      await controls.start({ x: 300, opacity: 0 });
      onSwipeRight?.();
    } else if (info.offset.x < -threshold) {
      await controls.start({ x: -300, opacity: 0 });
      onSwipeLeft?.();
    } else {
      controls.start({ x: 0 });
    }
  };

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      animate={controls}
      className="cursor-grab active:cursor-grabbing"
    >
      {children}
    </motion.div>
  );
}
```

---

## Pattern 7: Performance Optimization

### Reduce Motion for Accessibility

```typescript
// hooks/useReducedMotion.ts
'use client';

import { useReducedMotion as useFramerReducedMotion } from 'framer-motion';

export function useReducedMotion() {
  return useFramerReducedMotion();
}

// Component that respects reduced motion
export function AccessibleFadeIn({ children }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
}
```

### Lazy Loading Animations

```typescript
// components/LazyAnimation.tsx
'use client';

import { motion, LazyMotion, domAnimation } from 'framer-motion';
import { ReactNode } from 'react';

interface LazyAnimationProps {
  children: ReactNode;
}

export function LazyAnimation({ children }: LazyAnimationProps) {
  return (
    <LazyMotion features={domAnimation}>
      {children}
    </LazyMotion>
  );
}

// Use m instead of motion for smaller bundle
import { m } from 'framer-motion';

export function OptimizedComponent() {
  return (
    <LazyMotion features={domAnimation}>
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        Content
      </m.div>
    </LazyMotion>
  );
}
```

### Hardware Accelerated Animations

```typescript
// Use transform properties for GPU acceleration
const goodAnimation = {
  // GPU accelerated
  transform: 'translateX(100px)',
  opacity: 0.5,
};

const badAnimation = {
  // Not GPU accelerated - causes reflow
  left: '100px',
  width: '200px',
};

// In Framer Motion - prefer these properties:
<motion.div
  animate={{
    x: 100,        // Good - uses transform
    y: 50,         // Good - uses transform
    scale: 1.2,    // Good - uses transform
    rotate: 45,    // Good - uses transform
    opacity: 0.5,  // Good - composited
  }}
/>
```

---

## Animation Presets

```typescript
// lib/animation-presets.ts
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const slideIn = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

export const scale = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
};

export const spring = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
};

export const smooth = {
  duration: 0.5,
  ease: [0.25, 0.1, 0.25, 1],
};

// Usage
<motion.div {...slideUp} transition={smooth}>
  Content
</motion.div>
```

---

## Best Practices

1. **Use transform properties** - For GPU acceleration (x, y, scale, rotate)
2. **Respect reduced motion** - Check `prefers-reduced-motion`
3. **Lazy load animations** - Use `LazyMotion` for smaller bundles
4. **Keep durations short** - 200-500ms for most interactions
5. **Use easing** - Never use linear for UI animations
6. **Animate presence** - Use `AnimatePresence` for exit animations
7. **Stagger children** - Creates natural visual hierarchy
8. **Test on slow devices** - Ensure smooth 60fps
