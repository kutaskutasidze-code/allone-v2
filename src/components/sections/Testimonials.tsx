'use client';

import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';

const testimonialKeys = [
  { quoteKey: 'testimonials.q1', authorKey: 'testimonials.a1', roleKey: 'testimonials.r1' },
  { quoteKey: 'testimonials.q2', authorKey: 'testimonials.a2', roleKey: 'testimonials.r2' },
  { quoteKey: 'testimonials.q3', authorKey: 'testimonials.a3', roleKey: 'testimonials.r3' },
];

export function Testimonials() {
  const { t } = useI18n();

  return (
    <section className="py-[clamp(4rem,8vw,8rem)] bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mb-[clamp(3rem,6vw,5rem)]"
        >
          <p className="mono-label mb-4">{t('testimonials.label')}</p>
          <h2 className="text-3xl lg:text-4xl font-semibold text-heading leading-[1.1] tracking-[-0.03em]">
            {t('testimonials.title')}
          </h2>
        </motion.div>

        {/* Grid */}
        <div className="grid md:grid-cols-3 gap-4">
          {testimonialKeys.map((tk, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-3xl p-8 bg-white transition-colors flex flex-col"
            >
              {/* Quote mark */}
              <svg className="w-8 h-8 text-accent/30 mb-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
              </svg>

              <p className="text-foreground/80 leading-relaxed text-sm flex-1 mb-6">
                &ldquo;{t(tk.quoteKey)}&rdquo;
              </p>

              <div className="pt-4">
                <p className="text-heading font-medium text-sm">{t(tk.authorKey)}</p>
                <p className="text-muted text-xs mt-0.5">
                  {t(tk.roleKey)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
