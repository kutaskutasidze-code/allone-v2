'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { Container } from '@/components/layout';
import { useRef, useState, useEffect } from 'react';

export function ProjectsHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  const y_animated = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const opacity_animated = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const y = isMobile ? 0 : y_animated;
  const opacity = isMobile ? 1 : opacity_animated;

  return (
    <section ref={sectionRef} className="pt-28 pb-16 lg:pt-36 lg:pb-20 relative overflow-hidden">
      <Container>
        <motion.div className="max-w-4xl" style={{ y, opacity }}>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-[var(--accent)] text-sm font-medium tracking-wide mb-4"
          >
            Our Work
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-[clamp(2.5rem,7vw,5rem)] font-[var(--font-display)] font-light text-[var(--black)] leading-[1.05] tracking-[-0.02em] mb-8"
          >
            Selected projects
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-[var(--gray-600)] max-w-xl leading-relaxed"
          >
            A curated selection of work where we've helped companies
            transform their operations through intelligent automation.
          </motion.p>
        </motion.div>
      </Container>
    </section>
  );
}
