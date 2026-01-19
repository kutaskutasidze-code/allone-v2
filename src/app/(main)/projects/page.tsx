import type { Metadata } from 'next';
import { ProjectsGrid, CTA } from '@/components/sections';
import { getCachedProjects } from '@/lib/cache';
import { ProjectsHero } from './ProjectsHero';

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Explore our portfolio of AI automation projects. See how we help businesses transform with intelligent solutions.',
  alternates: {
    canonical: '/projects',
    languages: {
      'en': '/projects',
      'ka': '/projects',
      'x-default': '/projects',
    },
  },
  openGraph: {
    title: 'Projects | ALLONE',
    description: 'Explore our portfolio of AI automation projects.',
    url: '/projects',
    images: [{ url: '/images/allone-logo.png', width: 500, height: 500, alt: 'ALLONE' }],
  },
  twitter: {
    card: 'summary',
    title: 'Projects | ALLONE',
    description: 'Explore our portfolio of AI automation projects.',
  },
};

async function getProjects() {
  return getCachedProjects();
}

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <>
      <ProjectsHero />
      <ProjectsGrid projects={projects} showHeader={false} />
      <CTA />
    </>
  );
}
