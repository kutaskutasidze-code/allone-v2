'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useI18n } from '@/lib/i18n';
import { LAB_RESEARCH } from '@/data/lab-research';

export function LabResearches() {
  const { t, lang } = useI18n();
  const isKa = lang === 'ka';

  // Sort by chapter (chronological reading order)
  const papers = [...LAB_RESEARCH].sort((a, b) => a.chapter - b.chapter);
  const featured = papers[papers.length - 1]; // Latest paper featured
  const rest = papers.slice(0, -1).reverse(); // Rest in reverse chrono

  return (
    <section className="relative bg-white overflow-hidden">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16"
        >
          <div className="flex items-baseline gap-4 mb-3">
            <span className="text-[11px] font-mono text-accent tracking-widest uppercase">
              {isKa ? 'კვლევა' : 'Research'}
            </span>
            <div className="h-px flex-1 bg-border-light" />
            <span className="text-[11px] font-mono text-muted">
              {papers.length} {isKa ? 'ნაშრომი' : 'papers'}
            </span>
          </div>
          <h2 className="text-4xl font-semibold tracking-tight text-heading">
            {t('lab.research.title')}
          </h2>
          <p className="text-muted text-base mt-2 max-w-xl">
            {t('lab.research.desc')}
          </p>
        </motion.div>

        {/* Featured latest paper */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-1"
        >
          <Link
            href={`/lab/research/${featured.slug}`}
            className="group grid grid-cols-1 lg:grid-cols-2 gap-6 rounded-lg p-3 transition-colors duration-75 hover:bg-accent/[0.03] active:bg-accent/[0.06]"
          >
            <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-surface-2">
              <Image
                src={featured.image}
                alt={isKa ? featured.titleKa : featured.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                sizes="(max-width: 1024px) 100vw, 50vw"
                unoptimized
              />
            </div>
            <div className="flex flex-col justify-center py-2">
              <div className="flex items-center gap-3 text-[11px] text-muted mb-4">
                <span className="font-mono uppercase tracking-wider text-accent font-medium">
                  {isKa ? featured.labelKa : featured.label}
                </span>
                <span className="text-border-light">|</span>
                <span>{isKa ? featured.dateKa : featured.date}</span>
                <span className="text-border-light">|</span>
                <span>{featured.readTime}</span>
              </div>
              <h3 className="text-2xl lg:text-3xl font-semibold leading-tight tracking-tight text-heading mb-3 group-hover:text-accent transition-colors">
                {isKa ? featured.titleKa : featured.title}
              </h3>
              <p className="text-sm text-muted leading-relaxed line-clamp-3">
                {isKa ? featured.descriptionKa : featured.description}
              </p>
              <div className="mt-4">
                <span className="text-xs font-mono text-accent tracking-wider uppercase">
                  {isKa ? `ნაწილი ${featured.chapter} / ${papers.length}` : `Part ${featured.chapter} of ${papers.length}`}
                </span>
              </div>
            </div>
          </Link>
        </motion.div>

        <div className="h-px w-full bg-border-light my-4" />

        {/* Rest of papers */}
        <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((paper, i) => (
            <motion.div
              key={paper.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                href={`/lab/research/${paper.slug}`}
                className="group flex flex-col gap-2 rounded-lg p-2 transition-colors duration-75 hover:bg-accent/[0.03] active:bg-accent/[0.06]"
              >
                <div className="relative aspect-video overflow-hidden rounded-lg bg-surface-2">
                  <Image
                    src={paper.image}
                    alt={isKa ? paper.titleKa : paper.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    unoptimized
                  />
                </div>

                <div className="space-y-2 px-1 pb-2">
                  <div className="flex items-center gap-2 text-[11px] text-muted">
                    <span className="font-mono uppercase tracking-wider text-accent font-medium">{isKa ? paper.labelKa : paper.label}</span>
                    <span className="text-border-light">|</span>
                    <span>{isKa ? paper.dateKa : paper.date}</span>
                    <span className="text-border-light">|</span>
                    <span>{isKa ? `ნაწ. ${paper.chapter}` : `Pt. ${paper.chapter}`}</span>
                  </div>

                  <h3 className="text-lg font-semibold leading-tight tracking-tight text-heading line-clamp-2 group-hover:text-accent transition-colors">
                    {isKa ? paper.titleKa : paper.title}
                  </h3>

                  <p className="text-sm text-muted line-clamp-2 leading-relaxed">
                    {isKa ? paper.descriptionKa : paper.description}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
