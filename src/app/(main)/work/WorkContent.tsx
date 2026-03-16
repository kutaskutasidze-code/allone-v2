'use client';

import { CircularGallery } from '@/components/sections/CircularGallery';
import { galleryItems } from '@/data/work';
import { useI18n } from '@/lib/i18n';

export function WorkContent() {
  const { t } = useI18n();

  return (
    <section className="h-full bg-white flex flex-col pt-20 lg:pt-28 pb-12 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col h-full">
        <div className="max-w-3xl mb-16 lg:mb-24 shrink-0">
          <p className="mono-label mb-3">{t('work.label')}</p>
          <h1 className="text-4xl lg:text-6xl font-semibold text-[var(--black)] leading-none tracking-[-0.03em]">
            {t('work.title')}
          </h1>
        </div>

        <div className="flex-1 relative min-h-0">
          <CircularGallery items={galleryItems} radius={650} autoRotateSpeed={0.03} />
        </div>
      </div>
    </section>
  );
}
