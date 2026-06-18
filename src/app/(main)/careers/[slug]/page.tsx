import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, MapPin } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getVacancyBySlug } from '@/lib/careers';
import { Inter } from 'next/font/google';
import { employmentTypeLabel } from '@/lib/validations/careers';
import { ApplicationForm } from '@/components/forms/ApplicationForm';

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

interface PageProps {
  params: Promise<{ slug: string }>;
}

// ISR — serve a fast, CDN-cached response (crawler-friendly); refresh every 5 min.
export const revalidate = 300;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const vacancy = await getVacancyBySlug(slug);
  if (!vacancy || !vacancy.is_open) {
    return { title: 'Role not found — AllOne Careers' };
  }
  return {
    title: `${vacancy.title} — AllOne Careers`,
    description: vacancy.summary || `Apply for ${vacancy.title} at AllOne.`,
    alternates: { canonical: `https://allonelabs.com/careers/${vacancy.slug}` },
    openGraph: {
      title: `${vacancy.title} — AllOne Careers`,
      description: vacancy.summary || `Apply for ${vacancy.title} at AllOne.`,
      url: `https://allonelabs.com/careers/${vacancy.slug}`,
      images: [{ url: 'https://app.allonelabs.com/images/careers-og.jpg', width: 1200, height: 630, alt: 'AllOne' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${vacancy.title} — AllOne Careers`,
      description: vacancy.summary || `Apply for ${vacancy.title} at AllOne.`,
      images: ['https://app.allonelabs.com/images/careers-og.jpg'],
    },
  };
}

// Markdown styled via Tailwind child selectors (light theme, no typography plugin).
const mdClass =
  'text-[#565f6b] [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[#0c1016] [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-[#0c1016] [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:leading-relaxed [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5 [&_ol]:mb-4 [&_li]:leading-relaxed [&_a]:text-[#2776ea] [&_a]:underline [&_strong]:text-[#0c1016] [&_strong]:font-semibold';

export default async function VacancyPage({ params }: PageProps) {
  const { slug } = await params;
  const vacancy = await getVacancyBySlug(slug);
  if (!vacancy || !vacancy.is_open) notFound();

  return (
    <section className={`${inter.className} min-h-screen pt-16 pb-24 bg-[#f1f0ee] text-[#0c1016]`}>
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
          className="inline-flex items-center gap-1.5 text-sm text-[#6b7480] hover:text-[#0c1016] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          All roles
        </Link>

        <h1 className="text-[clamp(30px,5vw,56px)] font-extrabold tracking-[-0.035em] leading-[1] text-[#0c1016]">
          {vacancy.title}
        </h1>
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#2776ea]/10 text-[#2776ea] text-xs font-medium">
            {employmentTypeLabel(vacancy.employment_type)}
          </span>
          {vacancy.location && (
            <span className="inline-flex items-center gap-1 text-xs text-[#6b7480]">
              <MapPin className="w-3.5 h-3.5" />
              {vacancy.location}
            </span>
          )}
          {vacancy.department && <span className="text-xs text-[#6b7480]">· {vacancy.department}</span>}
        </div>

        {vacancy.description_md && (
          <div className={`mt-10 ${mdClass}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{vacancy.description_md}</ReactMarkdown>
          </div>
        )}

        <div className="mt-12 pt-10 border-t border-[#0c1016]/10">
          <h2 className="text-2xl font-bold text-[#0c1016] mb-1">Apply</h2>
          <p className="text-sm text-[#565f6b] mb-6">
            Tell us about yourself and attach your CV. We read every application.
          </p>
          <ApplicationForm vacancyId={vacancy.id} vacancyTitle={vacancy.title} />
        </div>

        <p className="mt-10 text-sm text-[#565f6b]">
          Questions? Email{' '}
          <a href="mailto:info@allonelabs.com" className="text-[#2776ea] underline">
            info@allonelabs.com
          </a>
        </p>
      </div>
    </section>
  );
}
