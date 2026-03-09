import dynamic from 'next/dynamic';
import { Hero } from '@/components/sections';
import { PortfolioParallax } from '@/components/sections/PortfolioParallax';
import { getCachedClients } from '@/lib/cache';

const Clients = dynamic(
  () => import('@/components/sections/Clients').then(m => ({ default: m.Clients })),
  { loading: () => <div className="min-h-[100px]" /> }
);

export default async function HomePage() {
  const clients = await getCachedClients();

  return (
    <>
      <Hero />
      <PortfolioParallax />
      <Clients clients={clients} />
    </>
  );
}
