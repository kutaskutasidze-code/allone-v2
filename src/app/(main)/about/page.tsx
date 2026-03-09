import type { Metadata } from 'next';
import { AboutContent } from './AboutContent';
import {
  getCachedStats,
  getCachedValues,
  getCachedAboutContent,
} from '@/lib/cache';

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn about ALLONE — an AI automation agency with offices in Georgia and Belgium, building intelligent systems for modern businesses.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About ALLONE',
    description: 'AI automation agency. Georgia + Belgium.',
    url: '/about',
  },
};

export default async function AboutPage() {
  const [stats, values, about] = await Promise.all([
    getCachedStats(),
    getCachedValues(),
    getCachedAboutContent(),
  ]);

  return <AboutContent stats={stats} values={values} about={about} />;
}
