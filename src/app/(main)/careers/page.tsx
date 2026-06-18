import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, ArrowRight, Briefcase } from 'lucide-react';
import { getOpenVacancies } from '@/lib/careers';
import { employmentTypeLabel } from '@/lib/validations/careers';

export const metadata: Metadata = {
  title: 'Careers at AllOne — Open Roles',
  description:
    'Join AllOne, an AI company in Tbilisi. We build AI chatbots, custom AI solutions, workflow automation, and websites. See our open roles and apply.',
  alternates: { canonical: 'https://allonelabs.com/careers' },
  openGraph: {
    title: 'Careers at AllOne',
    description: 'See our open roles and apply to join the team.',
    url: 'https://allonelabs.com/careers',
    images: [{ url: 'https://app.allonelabs.com/images/careers-og.jpg', width: 1200, height: 630, alt: 'AllOne' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Careers at AllOne',
    description: 'See our open roles and apply to join the team.',
    images: ['https://app.allonelabs.com/images/careers-og.jpg'],
  },
};

// ISR — serve a fast, CDN-cached response (crawler-friendly); refresh every 5 min.
export const revalidate = 300;

export default async function CareersPage() {
  const vacancies = await getOpenVacancies();

  return (
    <section className="min-h-screen pt-16 pb-24">
      <div className="max-w-5xl mx-auto px-6">
        <Image
          src="/images/allone-wordmark.png"
          alt="AllOne"
          width={150}
          height={41}
          priority
          className="mb-10 h-auto w-[130px] sm:w-[150px]"
        />
        <span className="font-mono text-xs font-medium text-[#4D4D4D] uppercase tracking-normal mb-3 block">
          Careers
        </span>
        <h1 className="font-instrument text-[clamp(28px,5vw,52px)] font-medium tracking-[-0.02em] leading-[1.05] text-[#071D2F]">
          Build with AI at AllOne.
        </h1>

        <div className="mt-12">
          {vacancies.length === 0 ? (
            <div className="bg-white border border-[#EBEBEB] rounded-2xl p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-[#071D2F]/[0.06] flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-6 h-6 text-[#071D2F]" />
              </div>
              <h2 className="font-display text-lg font-semibold text-[#071D2F] mb-1">
                No open roles right now
              </h2>
              <p className="text-sm text-[#4D4D4D]">
                Check back soon — or reach out via our{' '}
                <Link href="/contact" className="text-[#0369a1] underline">contact page</Link>.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {vacancies.map((v) => (
                <Link
                  key={v.id}
                  href={`/careers/${v.slug}`}
                  className="group flex items-start justify-between gap-4 bg-white border border-[#EBEBEB] rounded-2xl p-6 hover:border-[#071D2F]/20 hover:shadow-[0_4px_24px_-12px_rgba(7,29,47,0.12)] transition-all"
                >
                  <div className="min-w-0">
                    <h2 className="font-display text-lg font-semibold text-[#071D2F] mb-2">
                      {v.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#0369a1]/[0.08] text-[#0369a1] text-xs font-medium">
                        {employmentTypeLabel(v.employment_type)}
                      </span>
                      {v.location && (
                        <span className="inline-flex items-center gap-1 text-xs text-[#4D4D4D]">
                          <MapPin className="w-3.5 h-3.5" />
                          {v.location}
                        </span>
                      )}
                      {v.department && (
                        <span className="text-xs text-[#4D4D4D]">· {v.department}</span>
                      )}
                    </div>
                    {v.summary && (
                      <p className="text-sm text-[#4D4D4D] leading-relaxed line-clamp-2">{v.summary}</p>
                    )}
                  </div>
                  <ArrowRight className="w-5 h-5 text-[#4D4D4D] group-hover:text-[#071D2F] group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                </Link>
              ))}
            </div>
          )}
        </div>

        <p className="mt-12 text-sm text-[#4D4D4D]">
          Questions? Email{' '}
          <a href="mailto:info@allonelabs.com" className="text-[#0369a1] underline">
            info@allonelabs.com
          </a>
        </p>
      </div>
    </section>
  );
}
