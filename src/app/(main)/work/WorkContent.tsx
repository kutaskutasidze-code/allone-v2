'use client';

import { galleryItems } from '@/data/work';
import { useI18n } from '@/lib/i18n';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { GradientBlobs } from '@/components/ui/GradientBlobs';

export function WorkContent() {
  const { t } = useI18n();

  return (
    <section className="min-h-screen bg-white pt-12 sm:pt-24 lg:pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="relative mb-16 lg:mb-20 pb-8">
          <div className="relative z-10 max-w-3xl">
            <p className="font-mono text-xs font-medium text-[#4D4D4D] uppercase tracking-normal mb-3">{t('work.label')}</p>
            <h1 className="font-display text-[clamp(32px,5vw,48px)] font-semibold text-[#071D2F] leading-[1.1] tracking-[-0.047em]">
              {t('work.title')}
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {galleryItems.map((item, index) => (
            <motion.a
              key={item.common}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group block"
            >
              <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-gray-100 border border-black/5">
                <Image
                  src={item.photo.url}
                  alt={item.photo.text}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  style={{ objectPosition: item.photo.pos || 'top' }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
              </div>

              <div className="mt-6 flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold text-black group-hover:text-[var(--accent)] transition-colors">
                    {item.common}
                  </h3>
                  <p className="text-sm text-black/60 mt-1">
                    {item.binomial}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-300">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="7" y1="17" x2="17" y2="7"></line>
                    <polyline points="7 7 17 7 17 17"></polyline>
                  </svg>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
