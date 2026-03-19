import dynamic from 'next/dynamic';
import { getCachedServices } from '@/lib/cache';
import { V2ShellServer } from '../shell';

const ServicesNew = dynamic(() => import('@/components/sections/ServicesNew'), {
  loading: () => <div className="min-h-[100px]" />,
});

const DashboardShowcase = dynamic(
  () => import('@/components/sections/DashboardShowcase').then(m => ({ default: m.DashboardShowcase })),
  { loading: () => <div className="min-h-[600px]" /> }
);

export default async function V2ServicesPage() {
  const services = await getCachedServices();

  return (
    <V2ShellServer>
      <div className="bg-white pt-12 lg:pt-16 [--accent:#008000] [--accent-hover:#006b00]">
        <ServicesNew services={services} showViewAll={false} />
        <DashboardShowcase />
      </div>
    </V2ShellServer>
  );
}
