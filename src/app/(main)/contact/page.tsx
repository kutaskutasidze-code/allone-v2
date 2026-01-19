import type { Metadata } from 'next';
import { ContactContent } from './ContactContent';
import { getCachedContactInfo } from '@/lib/cache';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with ALLONE for AI automation solutions. We help businesses streamline workflows and boost efficiency.',
  alternates: {
    canonical: '/contact',
    languages: {
      'en': '/contact',
      'ka': '/contact',
      'x-default': '/contact',
    },
  },
  openGraph: {
    title: 'Contact ALLONE',
    description: 'Get in touch with ALLONE for AI automation solutions.',
    url: '/contact',
    images: [{ url: '/images/allone-logo.png', width: 500, height: 500, alt: 'ALLONE' }],
  },
  twitter: {
    card: 'summary',
    title: 'Contact ALLONE',
    description: 'Get in touch with ALLONE for AI automation solutions.',
  },
};

export default async function ContactPage() {
  const contactInfo = await getCachedContactInfo();

  return <ContactContent contactInfo={contactInfo} />;
}
