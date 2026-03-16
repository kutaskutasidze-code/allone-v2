'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { InteractiveImageAccordion } from "@/components/ui/interactive-image-accordion";
import { InfiniteSlider } from "@/components/ui/infinite-slider";

const projects = [
  {
    src: '/images/work/equivalenza.webp',
    alt: 'Equivalenza Georgia - E-Commerce Platform powered by AI automation',
    title: 'Equivalenza',
    subtitle: 'E-Commerce Platform',
  },
  {
    src: '/images/work/datarooms.webp',
    alt: 'DataRooms - AI-Powered Investor Data Rooms for secure document management',
    title: 'DataRooms',
    subtitle: 'AI Data Rooms',
  },
  {
    src: '/images/work/fifty.webp',
    alt: 'FIFTY - Community-Owned Innovation Space with smart automation',
    title: 'FIFTY',
    subtitle: 'Innovation Space',
  },
  {
    src: '/images/work/hostwise.webp',
    alt: 'HostWise - Property Management SaaS with intelligent workflows',
    title: 'HostWise',
    subtitle: 'Property Management',
  },
  {
    src: '/images/work/kaotenders.webp',
    alt: 'KaoTenders - B2B Industrial Tender Platform with AI matching',
    title: 'KaoTenders',
    subtitle: 'B2B Industrial',
  },
  {
    src: '/images/work/chaos-concept.webp',
    alt: 'Chaos Concept - Fashion & Art Concept Store digital platform',
    title: 'Chaos Concept',
    subtitle: 'Fashion & Art',
  },
  {
    src: '/images/work/innrburial.webp',
    alt: 'INNRBURIAL - Publishing & Art Platform for contemporary literature',
    title: 'INNRBURIAL',
    subtitle: 'Publishing & Art',
  },
];

export function PortfolioParallax() {
  const { t } = useI18n();
  return (
    <section className="bg-white" aria-label="Portfolio">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-12 lg:mb-16"
        >
          <p className="mono-label mb-4">{t('portfolio.label')}</p>
          <h2 className="text-4xl lg:text-6xl font-semibold text-heading tracking-tight mb-6">
            {t('portfolio.title')}
          </h2>
          <p className="text-muted max-w-xl mx-auto text-lg">
            {t('portfolio.desc')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <InteractiveImageAccordion items={projects} defaultActive={2} />
        </motion.div>
      </div>

      <div className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 text-center">
          <p className="mono-label mb-4">{t('portfolio.integrations')}</p>
          <h3 className="text-3xl font-semibold text-heading">{t('portfolio.trusted')}</h3>
        </div>

        <InfiniteSlider gap={80} reverse className="w-full bg-white py-12">
          <span className="text-2xl md:text-3xl font-semibold text-foreground/15 whitespace-nowrap select-none tracking-tight font-[family-name:var(--font-display)]">
            Equivalenza
          </span>
          <span className="text-2xl md:text-3xl font-semibold text-foreground/15 whitespace-nowrap select-none tracking-tight font-[family-name:var(--font-display)]">
            DataRooms
          </span>
          <span className="text-2xl md:text-3xl font-semibold text-foreground/15 whitespace-nowrap select-none tracking-tight font-[family-name:var(--font-display)]">
            FIFTY
          </span>
          <span className="text-2xl md:text-3xl font-semibold text-foreground/15 whitespace-nowrap select-none tracking-tight font-[family-name:var(--font-display)]">
            Chaos Concept
          </span>
          <span className="text-2xl md:text-3xl font-semibold text-foreground/15 whitespace-nowrap select-none tracking-tight font-[family-name:var(--font-display)]">
            HostWise
          </span>
          <span className="text-2xl md:text-3xl font-semibold text-foreground/15 whitespace-nowrap select-none tracking-tight font-[family-name:var(--font-display)]">
            KaoTenders
          </span>
          <span className="text-2xl md:text-3xl font-semibold text-foreground/15 whitespace-nowrap select-none tracking-tight font-[family-name:var(--font-display)]">
            INNRBURIAL
          </span>
        </InfiniteSlider>
      </div>
    </section>
  );
}
