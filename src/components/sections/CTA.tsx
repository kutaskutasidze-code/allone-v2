'use client';

import { motion } from 'framer-motion';
import { Container } from '@/components/layout';
import { ShimmerText } from '@/components/ui/ShimmerText';
import SlideTextButton from '@/components/kokonutui/slide-text-button';
import { useI18n } from '@/lib/i18n';

export function CTA() {
  const { t } = useI18n();

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
            {t('cta.label')}
          </motion.p>

          {/* Headline - same style as Hero with ShimmerText */}
          <div className="mb-6">
            <ShimmerText
              className="text-[clamp(1.75rem,4vw,3.5rem)] font-light leading-[1.1] tracking-[-0.02em]"
              delay={0.1}
            >
              {t('cta.title')}
            </ShimmerText>
          </div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-[var(--gray-600)] text-base lg:text-lg leading-relaxed mb-10 max-w-xl mx-auto"
          >
            {t('cta.desc')}
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
              text={t('cta.talk.label')}
              hoverText={t('cta.talk.btn')}
              href="/contact"
              className="h-12 px-10 rounded-full"
            />
            <SlideTextButton
              text={t('cta.work.label')}
              hoverText={t('cta.work.btn')}
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
