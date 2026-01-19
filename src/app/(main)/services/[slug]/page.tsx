import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCachedServices } from '@/lib/cache';
import { ArrowRight, Check, Bot, Cpu, Workflow, Globe, MessageSquare } from 'lucide-react';
import { ServiceSchema } from '@/components/seo';

const iconMap: Record<string, typeof Bot> = {
  chatbot: Bot,
  custom_ai: Cpu,
  workflow: Workflow,
  website: Globe,
  consulting: MessageSquare,
};

function slugToCardType(slug: string): string {
  return slug.replace(/-/g, '_');
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const services = await getCachedServices();
  const cardType = slugToCardType(slug);
  const service = services.find(s => s.card_type === cardType);

  if (!service) {
    return {
      title: 'Service Not Found',
    };
  }

  return {
    title: service.title,
    description: service.description,
    alternates: {
      canonical: `/services/${slug}`,
      languages: {
        'en': `/services/${slug}`,
        'ka': `/services/${slug}`,
        'x-default': `/services/${slug}`,
      },
    },
    openGraph: {
      title: `${service.title} | ALLONE`,
      description: service.description,
      url: `/services/${slug}`,
      images: [{ url: '/images/allone-logo.png', width: 500, height: 500, alt: 'ALLONE' }],
    },
  };
}

export async function generateStaticParams() {
  const services = await getCachedServices();
  return services
    .filter(s => s.card_type)
    .map(s => ({
      slug: s.card_type!.replace(/_/g, '-'),
    }));
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const services = await getCachedServices();
  const cardType = slugToCardType(slug);
  const service = services.find(s => s.card_type === cardType);

  if (!service) {
    notFound();
  }

  const Icon = iconMap[service.card_type || ''] || Cpu;
  const otherServices = services.filter(s => s.id !== service.id).slice(0, 3);

  return (
    <>
      <ServiceSchema
        name={service.title}
        description={service.description}
        url={`https://allone.ge/services/${slug}`}
      />

      <section className="min-h-screen bg-white pt-28 pb-20 lg:pt-36 lg:pb-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <ol className="flex items-center gap-2 text-sm text-zinc-500">
              <li>
                <Link href="/" className="hover:text-zinc-900 transition-colors">
                  Home
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link href="/services" className="hover:text-zinc-900 transition-colors">
                  Services
                </Link>
              </li>
              <li>/</li>
              <li className="text-zinc-900 font-medium">{service.title}</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="flex items-start gap-6 mb-12">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center flex-shrink-0">
              <Icon className="w-8 h-8 text-white" />
            </div>
            <div>
              {service.subtitle && (
                <p className="text-zinc-500 text-sm font-medium tracking-wide uppercase mb-2">
                  {service.subtitle}
                </p>
              )}
              <h1 className="text-3xl lg:text-5xl font-light text-zinc-900 leading-tight mb-4">
                {service.title}
              </h1>
              <p className="text-lg text-zinc-600 leading-relaxed max-w-2xl">
                {service.description}
              </p>
            </div>
          </div>

          {/* Stats */}
          {service.stats && service.stats.length > 0 && (
            <div className="grid sm:grid-cols-3 gap-6 mb-12">
              {service.stats.map((stat: { value: string; label: string }, i: number) => (
                <div key={i} className="p-6 bg-zinc-50 rounded-xl">
                  <p className="text-3xl font-semibold text-zinc-900 mb-1">{stat.value}</p>
                  <p className="text-sm text-zinc-600">{stat.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Secondary Description */}
          {service.secondary_description && (
            <div className="mb-12">
              <p className="text-zinc-700 leading-relaxed text-lg">
                {service.secondary_description}
              </p>
            </div>
          )}

          {/* Features */}
          {service.features && service.features.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-medium text-zinc-900 mb-6">What&apos;s Included</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {service.features.map((feature: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-zinc-50 rounded-xl">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-zinc-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="bg-zinc-900 rounded-2xl p-8 lg:p-12 text-center mb-16">
            <h3 className="text-2xl lg:text-3xl font-light text-white mb-4">
              Ready to get started?
            </h3>
            <p className="text-zinc-400 mb-8 max-w-lg mx-auto">
              {service.footer_text || 'Let\'s discuss how we can help transform your business with AI.'}
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-zinc-900 font-medium rounded-xl hover:bg-zinc-100 transition-colors"
            >
              {service.cta_text || 'Get Started'}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Other Services */}
          {otherServices.length > 0 && (
            <div>
              <h2 className="text-xl font-medium text-zinc-900 mb-6">Other Services</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {otherServices.map((s) => {
                  const OtherIcon = iconMap[s.card_type || ''] || Cpu;
                  const otherSlug = s.card_type?.replace(/_/g, '-') || s.title.toLowerCase().replace(/\s+/g, '-');

                  return (
                    <Link
                      key={s.id}
                      href={`/services/${otherSlug}`}
                      className="group flex items-center gap-3 p-4 bg-zinc-50 rounded-xl hover:bg-zinc-100 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-zinc-200 flex items-center justify-center flex-shrink-0 group-hover:bg-zinc-300 transition-colors">
                        <OtherIcon className="w-5 h-5 text-zinc-700" />
                      </div>
                      <div>
                        <p className="font-medium text-zinc-900 group-hover:text-zinc-700 transition-colors">
                          {s.title}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
