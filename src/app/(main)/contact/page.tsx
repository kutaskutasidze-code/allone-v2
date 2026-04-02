import type { Metadata } from 'next';
import { ContactContent } from './ContactContent';
import { getCachedContactInfo } from '@/lib/cache';

export const metadata: Metadata = {
  title: 'Contact ALLONE — AI Automation Agency in Georgia & Belgium',
  description: 'Contact ALLONE for AI chatbot development, workflow automation, and web development. Offices in Tbilisi, Georgia and Brussels, Belgium. Email info@allonelabs.com for a free consultation.',
  alternates: {
    canonical: '/contact',
  },
  openGraph: {
    title: 'Contact ALLONE — AI Automation Agency',
    description: 'Get in touch with ALLONE. Offices in Tbilisi, Georgia and Brussels, Belgium. AI chatbots, workflow automation, web development.',
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
