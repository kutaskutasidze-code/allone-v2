import type { Metadata } from 'next';
import { CircularGallery } from '@/components/sections/CircularGallery';
import { galleryItems } from '@/data/work';

export const metadata: Metadata = {
  title: 'Work',
  description: 'Case studies and portfolio of AI automation projects by ALLONE.',
  alternates: { canonical: '/work' },
  openGraph: {
    title: 'Work | ALLONE',
    description: 'Our AI automation portfolio.',
    url: '/work',
  },
};

export default function WorkPage() {
  return (
    <section className="h-full bg-white flex flex-col pt-20 lg:pt-28 pb-12 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col h-full">
        <div className="max-w-3xl mb-16 lg:mb-24 shrink-0">
          <p className="mono-label mb-3">Portfolio</p>
          <h1 className="text-4xl lg:text-6xl font-semibold text-[var(--black)] leading-none tracking-[-0.03em]">
            Our Work
          </h1>
        </div>

        <div className="flex-1 relative min-h-0">
          <CircularGallery items={galleryItems} radius={650} autoRotateSpeed={0.03} />
        </div>
      </div>
    </section>
  );
}
