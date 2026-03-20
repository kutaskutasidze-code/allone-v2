import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { getCachedServices } from '@/lib/cache';

const ChatbotShowcase = dynamic(
  () => import('@/components/sections/services/ChatbotShowcase').then(m => ({ default: m.ChatbotShowcase })),
  { loading: () => <div className="min-h-[600px]" /> }
);

const WebDevShowcase = dynamic(
  () => import('@/components/sections/services/WebDevShowcase/WebDevShowcase').then(m => ({ default: m.WebDevShowcase })),
  { loading: () => <div className="min-h-[500px]" /> }
);

const DashboardShowcase = dynamic(
  () => import('@/components/sections/DashboardShowcase').then(m => ({ default: m.DashboardShowcase })),
  { loading: () => <div className="min-h-[600px]" /> }
);

const ConsultationCTA = dynamic(
  () => import('@/components/sections/services/ConsultationCTA').then(m => ({ default: m.ConsultationCTA })),
  { loading: () => <div className="min-h-[300px]" /> }
);

export const metadata: Metadata = {
  title: 'Services',
  description: 'AI automation services: chatbots, workflow automation, custom AI solutions, web development, and strategic consulting.',
  alternates: { canonical: '/services' },
  openGraph: {
    title: 'Services | ALLONE',
    description: 'AI automation services for modern businesses.',
    url: '/services',
  },
};

export default async function ServicesPage() {
  const services = await getCachedServices();

  return (
    <div className="bg-white pt-12 lg:pt-16">
      <ChatbotShowcase />
      <WebDevShowcase />
      <DashboardShowcase />
      <ConsultationCTA />
    </div>
  );
}
