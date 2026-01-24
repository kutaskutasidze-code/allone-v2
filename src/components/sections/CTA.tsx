'use client';

import { motion } from 'framer-motion';
import { Container } from '@/components/layout';
import { ShimmerText } from '@/components/ui/ShimmerText';
import SlideTextButton from '@/components/kokonutui/slide-text-button';

export function CTA() {
  return (
    <section className="relative overflow-hidden bg-white min-h-[500px] flex items-center">

      <Container>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="max-w-3xl mx-auto text-center relative z-10 py-20 lg:py-28"
        >
          {/* Label */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-[var(--accent)] text-sm font-medium tracking-wide mb-4"
          >
            Get in touch
          </motion.p>

          {/* Headline - same style as Hero with ShimmerText */}
          <div className="mb-6">
            <ShimmerText
              text="Ready to Start Your Next Project?"
              className="text-[clamp(1.75rem,4vw,3.5rem)] font-light leading-[1.1] tracking-[-0.02em]"
              delay={0.1}
            />
          </div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-[var(--gray-600)] text-base lg:text-lg leading-relaxed mb-10 max-w-xl mx-auto"
          >
            From strategy to deployment, we partner with you to build AI systems that deliver real results.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <SlideTextButton
              text="Start a conversation"
              hoverText="Let's talk →"
              href="/contact"
              className="h-12 px-10 rounded-full"
            />
            <SlideTextButton
              text="View our work"
              hoverText="See projects →"
              href="/projects"
              variant="ghost"
              className="h-12 px-10 rounded-full"
            />
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
