import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { getCachedServices } from '@/lib/cache';

const ServicesNew = dynamic(() => import('@/components/sections/ServicesNew'), {
  loading: () => <div className="min-h-[100px]" />,
});

const DashboardShowcase = dynamic(
  () => import('@/components/sections/DashboardShowcase').then(m => ({ default: m.DashboardShowcase })),
  { loading: () => <div className="min-h-[600px]" /> }
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
      <ServicesNew services={services} showViewAll={false} />
      <DashboardShowcase />
    </div>
  );
}
