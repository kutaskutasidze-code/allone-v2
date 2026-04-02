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
  title: 'AI Automation Services — Chatbots, Web Development, Workflow Automation',
  description: 'ALLONE offers AI chatbot development, workflow automation, web development, and consulting services from Tbilisi, Georgia and Brussels, Belgium. Custom AI solutions delivered in 1-8 weeks at 90% lower cost than traditional agencies.',
  alternates: { canonical: '/services' },
  openGraph: {
    title: 'AI Automation Services | ALLONE',
    description: 'Custom AI chatbots, workflow automation, and web development. Based in Georgia and Belgium, serving clients worldwide.',
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
