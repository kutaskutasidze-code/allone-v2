import type { Metadata } from 'next';
import Link from 'next/link';
import { getCachedServices } from '@/lib/cache';
import { ArrowRight, Bot, Cpu, Workflow, Globe, MessageSquare } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Services',
  description: 'Explore ALLONE AI automation services - chatbots, custom AI solutions, workflow automation, websites, and consulting.',
  alternates: {
    canonical: '/services',
    languages: {
      'en': '/services',
      'ka': '/services',
      'x-default': '/services',
    },
  },
  openGraph: {
    title: 'Services | ALLONE',
    description: 'Explore our AI automation services.',
    url: '/services',
    images: [{ url: '/images/allone-logo.png', width: 500, height: 500, alt: 'ALLONE' }],
  },
};

const iconMap: Record<string, typeof Bot> = {
  chatbot: Bot,
  custom_ai: Cpu,
  workflow: Workflow,
  website: Globe,
  consulting: MessageSquare,
};

function getSlug(service: { card_type: string | null; title: string }): string {
  if (service.card_type) {
    return service.card_type.replace(/_/g, '-');
  }
  return service.title.toLowerCase().replace(/\s+/g, '-');
}

export default async function ServicesPage() {
  const services = await getCachedServices();

  return (
    <section className="min-h-screen bg-white pt-28 pb-20 lg:pt-36 lg:pb-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-16">
          <p className="text-zinc-500 text-sm font-medium tracking-wide uppercase mb-4">
            Services
          </p>
          <h1 className="text-4xl lg:text-6xl font-light text-zinc-900 leading-[1.1] mb-6">
            Everything you need to grow with AI
          </h1>
          <p className="text-lg text-zinc-600 leading-relaxed">
            From intelligent chatbots to complete automation solutions, we help businesses leverage AI to work smarter.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => {
            const Icon = iconMap[service.card_type || ''] || Cpu;
            const slug = getSlug(service);

            return (
              <Link
                key={service.id}
                href={`/services/${slug}`}
                className="group block p-6 bg-zinc-50 rounded-2xl border border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-medium text-zinc-900 mb-2 group-hover:text-zinc-700 transition-colors">
                  {service.title}
                </h3>
                <p className="text-zinc-600 text-sm mb-4 line-clamp-2">
                  {service.description}
                </p>
                {service.features.length > 0 && (
                  <ul className="space-y-1 mb-4">
                    {service.features.slice(0, 3).map((feature: string, i: number) => (
                      <li key={i} className="text-xs text-zinc-500 flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-zinc-400" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-900 group-hover:gap-3 transition-all">
                  Learn more
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-zinc-600 mb-4">Not sure which service is right for you?</p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-colors"
          >
            Let&apos;s discuss your needs
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
