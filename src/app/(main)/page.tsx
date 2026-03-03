import dynamic from 'next/dynamic';
import { Hero } from '@/components/sections';
import { getCachedServices } from '@/lib/cache';

// Dynamic imports for below-the-fold sections to reduce initial bundle
const ServicesNew = dynamic(() => import('@/components/sections/ServicesNew'), {
  loading: () => <div className="min-h-[400px] animate-pulse bg-[var(--black)]" />,
});

const DashboardShowcase = dynamic(
  () => import('@/components/sections/DashboardShowcase').then((mod) => ({ default: mod.DashboardShowcase })),
  { loading: () => <div className="min-h-[600px] animate-pulse bg-[var(--black)]" /> }
);


export default async function HomePage() {
  const services = await getCachedServices();

  return (
    <>
      <Hero />
      <ServicesNew services={services} />
      <DashboardShowcase />
    </>
  );
}
