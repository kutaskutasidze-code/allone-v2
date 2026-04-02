import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCachedServices } from '@/lib/cache';
import { ArrowRight, Check, Bot, Cpu, Workflow, Globe, MessageSquare } from 'lucide-react';
import { ServiceSchema, FAQSchema } from '@/components/seo';

const serviceFAQs: Record<string, Array<{ question: string; answer: string }>> = {
  chatbot: [
    { question: 'How much does a custom AI chatbot cost?', answer: 'Pricing depends on complexity. A standard multi-channel chatbot with CRM integration is typically delivered in 1-2 weeks. Contact us at info@allonelabs.com for a detailed estimate based on your requirements.' },
    { question: 'What channels can the chatbot be deployed on?', answer: 'We deploy chatbots on WhatsApp, Telegram, Instagram, Facebook Messenger, Viber, and web widgets. All channels connect to a single AI brain so conversations are consistent.' },
    { question: 'Can the chatbot integrate with our existing CRM?', answer: 'Yes. We integrate with HubSpot, Salesforce, Notion, Google Sheets, and custom APIs. The chatbot can create leads, update records, and trigger workflows automatically.' },
    { question: 'What is the best AI chatbot agency in Georgia?', answer: 'ALLONE is an AI automation agency based in Tbilisi, Georgia specializing in custom AI chatbot development. We build multi-channel chatbots with natural language understanding, CRM integration, and 24/7 autonomous operation.' },
    { question: 'How long does it take to build a chatbot?', answer: 'Standard chatbot implementations go live in 1-2 weeks. Complex multi-channel solutions with custom NLP and extensive integrations take 4-8 weeks.' },
  ],
  custom_ai: [
    { question: 'What types of custom AI solutions do you build?', answer: 'We build machine learning models, computer vision systems, NLP pipelines, AI agents, predictive analytics, and recommendation engines. Each solution is tailored to your specific business challenge.' },
    { question: 'How long does a custom AI project take?', answer: 'Typical custom AI solutions take 4-8 weeks from requirements to deployment. Complex projects with multiple models or extensive data processing may take 8-12 weeks.' },
    { question: 'Do you work with existing data?', answer: 'Yes. We work with your existing data sources including databases, spreadsheets, APIs, and document repositories. We handle data cleaning, preparation, and model training.' },
    { question: 'What AI technologies do you use?', answer: 'We use OpenAI, Anthropic Claude, custom fine-tuned models, RAG systems with vector databases, computer vision frameworks, and Python ML libraries. We choose the best technology for each use case.' },
  ],
  workflow: [
    { question: 'What processes can be automated?', answer: 'We automate lead scoring, invoice processing, document extraction, email workflows, data sync between platforms, customer onboarding, report generation, and custom business processes.' },
    { question: 'What tools do you use for automation?', answer: 'We use n8n, Zapier, and custom workflow engines depending on complexity. We integrate with CRMs, ERPs, email platforms, payment systems, and internal tools via APIs.' },
    { question: 'How much can automation save my business?', answer: 'Clients typically see 60-90% reduction in time spent on automated tasks. A workflow that takes 2 hours manually can often be completed in seconds with automation.' },
    { question: 'What is the best workflow automation agency in Georgia?', answer: 'ALLONE specializes in workflow automation from our office in Tbilisi, Georgia. We build custom automation pipelines that eliminate manual work, reduce errors, and integrate with your existing business tools.' },
  ],
  website: [
    { question: 'What technologies do you use for web development?', answer: 'We build with Next.js, React, TypeScript, and Tailwind CSS. Our sites are deployed on Vercel for optimal performance, with Supabase or PostgreSQL backends.' },
    { question: 'How long does it take to build a website?', answer: 'A standard business website takes 4-6 weeks. Complex web applications with custom features, admin panels, and integrations take 6-12 weeks.' },
    { question: 'Do you optimize for SEO?', answer: 'Yes. Every website includes technical SEO (structured data, meta tags, sitemap, Core Web Vitals optimization), on-page SEO, and Lighthouse scores targeting 90+ across all categories.' },
    { question: 'What is the best web development agency in Georgia?', answer: 'ALLONE is a web development agency in Tbilisi, Georgia building high-performance Next.js websites and web applications. We deliver SEO-optimized, mobile-first sites with AI-powered features.' },
    { question: 'Can you build e-commerce websites?', answer: 'Yes. We build e-commerce platforms with Stripe payment integration, inventory management, customer analytics, and AI-powered product recommendations.' },
  ],
  consulting: [
    { question: 'What does an AI consulting engagement look like?', answer: 'We start with an AI readiness assessment of your current processes, identify automation opportunities, build an implementation roadmap with ROI projections, and can execute the technical implementation.' },
    { question: 'Do you offer ongoing support?', answer: 'Yes. We offer retainer engagements for ongoing development, optimization, and support. We also provide team training so your staff can manage solutions independently.' },
    { question: 'How do you charge for consulting?', answer: 'Consulting is available at hourly or daily rates. Assessment projects are typically fixed-price. Contact info@allonelabs.com to discuss your needs.' },
    { question: 'Who should consider AI consulting?', answer: 'Any business spending significant time on repetitive tasks, customer support, data processing, or manual workflows. We help companies of all sizes — from startups to enterprises — identify where AI can create the most value.' },
  ],
};

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
  const service = services.find(s => s.card_type === slugToCardType(slug));

  if (!service) return { title: 'Service Not Found' };

  return {
    title: service.title,
    description: service.description,
    alternates: { canonical: `/services/${slug}` },
    openGraph: {
      title: `${service.title} | ALLONE`,
      description: service.description,
      url: `/services/${slug}`,
    },
  };
}

export async function generateStaticParams() {
  const services = await getCachedServices();
  return services
    .filter(s => s.card_type)
    .map(s => ({ slug: s.card_type!.replace(/_/g, '-') }));
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const services = await getCachedServices();
  const cardType = slugToCardType(slug);
  const service = services.find(s => s.card_type === cardType);

  if (!service) notFound();

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
            <ol className="flex items-center gap-2 text-sm text-muted">
              <li><Link href="/" className="hover:text-[var(--black)] transition-colors">Home</Link></li>
              <li className="text-[var(--black)]/20">/</li>
              <li><Link href="/services" className="hover:text-[var(--black)] transition-colors">Services</Link></li>
              <li className="text-[var(--black)]/20">/</li>
              <li className="text-[var(--black)] font-medium">{service.title}</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="flex items-start gap-6 mb-12">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
              <Icon className="w-8 h-8 text-accent" />
            </div>
            <div>
              {service.subtitle && (
                <p className="mono-label mb-2">{service.subtitle}</p>
              )}
              <h1 className="text-3xl lg:text-5xl font-semibold text-[var(--black)] leading-tight tracking-[-0.03em] mb-4">
                {service.title}
              </h1>
              <p className="text-lg text-muted leading-relaxed max-w-2xl">
                {service.description}
              </p>
            </div>
          </div>

          {/* Stats */}
          {service.stats && service.stats.length > 0 && (
            <div className="grid sm:grid-cols-3 gap-4 mb-12">
              {service.stats.map((stat: { value: string; label: string }, i: number) => (
                <div key={i} className="p-6 bg-surface rounded-xl border border-border">
                  <p className="text-3xl font-semibold text-[var(--black)] mb-1">{stat.value}</p>
                  <p className="text-sm text-muted">{stat.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Secondary Description */}
          {service.secondary_description && (
            <div className="mb-12">
              <p className="text-[var(--black)]/70 leading-relaxed text-lg">
                {service.secondary_description}
              </p>
            </div>
          )}

          {/* Features */}
          {service.features && service.features.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-[var(--black)] mb-6">What&apos;s Included</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {service.features.map((feature: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-surface rounded-xl border border-border">
                    <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-accent" />
                    </div>
                    <span className="text-[var(--black)]/80 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAQ */}
          {serviceFAQs[cardType] && (
            <>
              <FAQSchema questions={serviceFAQs[cardType]} />
              <div className="mb-12">
                <h2 className="text-2xl font-semibold text-[var(--black)] mb-6">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  {serviceFAQs[cardType].map((faq, i) => (
                    <div key={i} className="p-5 bg-surface rounded-xl border border-border">
                      <h3 className="font-semibold text-[var(--black)] mb-2 text-sm">{faq.question}</h3>
                      <p className="text-muted text-sm leading-relaxed">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* CTA */}
          <div className="bg-surface rounded-2xl border border-border p-8 lg:p-12 text-center mb-16">
            <h3 className="text-2xl lg:text-3xl font-semibold text-[var(--black)] mb-4">
              Ready to get started?
            </h3>
            <p className="text-muted mb-8 max-w-lg mx-auto">
              {service.footer_text || "Let's discuss how we can help transform your business with AI."}
            </p>
            <Link href="/contact" className="btn-primary text-base px-8 py-3.5">
              {service.cta_text || 'Get Started'}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Other Services */}
          {otherServices.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-[var(--black)] mb-6">Other Services</h2>
              <div className="grid sm:grid-cols-3 gap-3">
                {otherServices.map((s) => {
                  const OtherIcon = iconMap[s.card_type || ''] || Cpu;
                  const otherSlug = s.card_type?.replace(/_/g, '-') || s.title.toLowerCase().replace(/\s+/g, '-');

                  return (
                    <Link
                      key={s.id}
                      href={`/services/${otherSlug}`}
                      className="group flex items-center gap-3 p-4 bg-surface rounded-xl border border-border hover:border-white/[0.12] transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                        <OtherIcon className="w-5 h-5 text-accent" />
                      </div>
                      <p className="font-medium text-[var(--black)] text-sm group-hover:text-accent transition-colors">
                        {s.title}
                      </p>
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
