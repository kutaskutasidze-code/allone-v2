import type { Metadata } from 'next';
import { CTA } from '@/components/sections';
import { AboutContent } from './AboutContent';
import {
  getCachedStats,
  getCachedValues,
  getCachedAboutContent,
} from '@/lib/cache';

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn about ALLONE - a team of AI automation experts transforming businesses with intelligent solutions and custom workflows.',
  alternates: {
    canonical: '/about',
    languages: {
      'en': '/about',
      'ka': '/about',
      'x-default': '/about',
    },
  },
  openGraph: {
    title: 'About ALLONE',
    description: 'Learn about ALLONE - a team of AI automation experts transforming businesses with intelligent solutions.',
    url: '/about',
    images: [{ url: '/images/allone-logo.png', width: 500, height: 500, alt: 'ALLONE' }],
  },
  twitter: {
    card: 'summary',
    title: 'About ALLONE',
    description: 'Learn about ALLONE - AI automation experts transforming businesses.',
  },
};

async function getAboutData() {
  const [stats, values, about] = await Promise.all([
    getCachedStats(),
    getCachedValues(),
    getCachedAboutContent(),
  ]);

  return { stats, values, about };
}

export default async function AboutPage() {
  const { stats, values, about } = await getAboutData();

  return (
    <>
      <AboutContent stats={stats} values={values} about={about} />
      <CTA />
    </>
  );
}
