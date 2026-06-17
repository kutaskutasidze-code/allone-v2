import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, MapPin } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getVacancyBySlug } from '@/lib/careers';
import { employmentTypeLabel } from '@/lib/validations/careers';
import { ApplicationForm } from '@/components/forms/ApplicationForm';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const vacancy = await getVacancyBySlug(slug);
  if (!vacancy || !vacancy.is_open) {
    return { title: 'Role not found — AllOne Careers' };
  }
  return {
    title: `${vacancy.title} — AllOne Careers`,
    description: vacancy.summary || `Apply for ${vacancy.title} at AllOne.`,
    alternates: { canonical: `/careers/${vacancy.slug}` },
    openGraph: {
      title: `${vacancy.title} — AllOne Careers`,
      description: vacancy.summary || `Apply for ${vacancy.title} at AllOne.`,
      url: `/careers/${vacancy.slug}`,
      images: [{ url: 'https://allonelabs.com/images/careers-og.png', width: 1200, height: 630, alt: 'AllOne' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${vacancy.title} — AllOne Careers`,
      description: vacancy.summary || `Apply for ${vacancy.title} at AllOne.`,
      images: ['https://allonelabs.com/images/careers-og.png'],
    },
  };
}

// Markdown is styled via Tailwind child selectors (no typography plugin).
const mdClass =
  'text-[#4D4D4D] [&_h2]:font-instrument [&_h2]:text-xl [&_h2]:font-medium [&_h2]:text-[#071D2F] [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:font-display [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-[#071D2F] [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:leading-relaxed [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5 [&_ol]:mb-4 [&_li]:leading-relaxed [&_a]:text-[#0369a1] [&_a]:underline [&_strong]:text-[#071D2F] [&_strong]:font-semibold';

export default async function VacancyPage({ params }: PageProps) {
  const { slug } = await params;
  const vacancy = await getVacancyBySlug(slug);
  if (!vacancy || !vacancy.is_open) notFound();

  return (
    <section className="min-h-screen pt-16 pb-24">
      <div className="max-w-3xl mx-auto px-6">
        <Image
          src="/images/allone-wordmark.png"
          alt="AllOne"
          width={130}
          height={36}
          priority
          className="mb-8 h-auto w-[120px]"
        />
        <Link
          href="/careers"
          className="inline-flex items-center gap-1.5 text-sm text-[#4D4D4D] hover:text-[#071D2F] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          All roles
        </Link>

        <h1 className="font-instrument text-[clamp(26px,4.5vw,44px)] font-medium tracking-[-0.02em] leading-[1.05] text-[#071D2F]">
          {vacancy.title}
        </h1>
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#0369a1]/[0.08] text-[#0369a1] text-xs font-medium">
            {employmentTypeLabel(vacancy.employment_type)}
          </span>
          {vacancy.location && (
            <span className="inline-flex items-center gap-1 text-xs text-[#4D4D4D]">
              <MapPin className="w-3.5 h-3.5" />
              {vacancy.location}
            </span>
          )}
          {vacancy.department && <span className="text-xs text-[#4D4D4D]">· {vacancy.department}</span>}
        </div>

        {vacancy.description_md && (
          <div className={`mt-10 ${mdClass}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{vacancy.description_md}</ReactMarkdown>
          </div>
        )}

        <div className="mt-12 pt-10 border-t border-[#EBEBEB]">
          <h2 className="font-instrument text-2xl font-medium text-[#071D2F] mb-1">Apply</h2>
          <p className="text-sm text-[#4D4D4D] mb-6">
            Tell us about yourself and attach your CV. We read every application.
          </p>
          <ApplicationForm vacancyId={vacancy.id} vacancyTitle={vacancy.title} />
        </div>

        <p className="mt-10 text-sm text-[#4D4D4D]">
          Questions? Email{' '}
          <a href="mailto:info@allonelabs.com" className="text-[#0369a1] underline">
            info@allonelabs.com
          </a>
        </p>
      </div>
    </section>
  );
}
