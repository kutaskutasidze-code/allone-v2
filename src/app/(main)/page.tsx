import dynamic from 'next/dynamic';
import { Hero } from '@/components/sections';
import { getCachedClients, getCachedServices } from '@/lib/cache';

// Dynamic imports for below-the-fold sections to reduce initial bundle
const ServicesNew = dynamic(() => import('@/components/sections/ServicesNew'), {
  loading: () => <div className="min-h-[400px] animate-pulse bg-neutral-100" />,
});

const DashboardShowcase = dynamic(
  () => import('@/components/sections/DashboardShowcase').then((mod) => ({ default: mod.DashboardShowcase })),
  { loading: () => <div className="min-h-[600px] animate-pulse bg-neutral-50" /> }
);

const Clients = dynamic(
  () => import('@/components/sections/Clients').then((mod) => ({ default: mod.Clients })),
  { loading: () => <div className="min-h-[200px] animate-pulse bg-white" /> }
);

const WorkComingSoon = dynamic(
  () => import('@/components/sections/WorkComingSoon').then((mod) => ({ default: mod.WorkComingSoon })),
  { loading: () => <div className="min-h-[400px] animate-pulse bg-neutral-100" /> }
);


export default async function HomePage() {
  const [clients, services] = await Promise.all([
    getCachedClients(),
    getCachedServices(),
  ]);

  return (
    <>
      <Hero />
      <ServicesNew services={services} />
      <DashboardShowcase />
      <Clients clients={clients} />
      <WorkComingSoon />
    </>
  );
}
