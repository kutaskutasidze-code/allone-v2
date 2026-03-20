import dynamic from 'next/dynamic';
import { getCachedServices } from '@/lib/cache';
import { V2ShellServer } from '@/app/v2-shell';

const ChatbotShowcase = dynamic(
  () => import('@/components/sections/services/ChatbotShowcase').then(m => ({ default: m.ChatbotShowcase })),
  { loading: () => <div className="min-h-[600px]" /> }
);

const ServicesNew = dynamic(() => import('@/components/sections/ServicesNew'), {
  loading: () => <div className="min-h-[100px]" />,
});

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

export default async function V2ServicesPage() {
  const services = await getCachedServices();

  return (
    <V2ShellServer>
      <div className="bg-white pt-12 lg:pt-16 [--accent:#008000] [--accent-hover:#006b00]">
        <ChatbotShowcase />
        <WebDevShowcase />
        <DashboardShowcase />
        <ConsultationCTA />
      </div>
    </V2ShellServer>
  );
}
