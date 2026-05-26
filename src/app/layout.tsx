import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { Plus_Jakarta_Sans, JetBrains_Mono, Space_Grotesk, Instrument_Sans } from 'next/font/google';
import { OrganizationSchema, WebsiteSchema, LocalBusinessSchema } from '@/components/seo';
import './globals.css';

const generalSans = localFont({
  src: [
    { path: '../../public/fonts/general-sans/GeneralSans-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../../public/fonts/general-sans/GeneralSans-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../../public/fonts/general-sans/GeneralSans-Semibold.woff2', weight: '600', style: 'normal' },
    { path: '../../public/fonts/general-sans/GeneralSans-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-display',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
  weight: ['400', '500', '600'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
  weight: ['400', '500'],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-heading',
  weight: ['400', '500', '600', '700'],
});

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-instrument',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://allone.ge'),
  title: {
    default: 'ALLONE — All Systems. One Intelligence.',
    template: '%s | ALLONE',
  },
  alternates: {
    canonical: '/',
  },
  description:
    'AI automation company building custom AI chatbots, workflow automation, and intelligent software. Based in Tbilisi, Georgia & Brussels, Belgium. All systems converge into one.',
  keywords: [
    'AI automation company',
    'AI company Georgia',
    'AI chatbot development',
    'custom AI solutions',
    'workflow automation',
    'business process automation',
    'AI consulting',
    'machine learning solutions',
    'NLP chatbot',
    'AI web development',
    'Tbilisi AI company',
    'Belgium AI company',
    'artificial intelligence services',
    'enterprise AI',
    'AI integration',
  ],
  authors: [{ name: 'ALLONE', url: 'https://allone.ge' }],
  creator: 'ALLONE',
  publisher: 'ALLONE',
  category: 'Technology',
  icons: {
    icon: '/favicon-32.png',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://allone.ge',
    siteName: 'ALLONE',
    title: 'ALLONE — All Systems. One Intelligence.',
    description:
      'AI automation company that converges all your systems into one intelligent layer.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ALLONE — All Systems. One Intelligence.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ALLONE — All Systems. One Intelligence.',
    description: 'AI automation company. All systems converge into one.',
    creator: '@allone_ai',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${generalSans.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable} ${instrumentSans.variable} overflow-x-hidden`}>
      <body className="antialiased bg-white overflow-x-hidden">
        <OrganizationSchema />
        <WebsiteSchema />
        <LocalBusinessSchema />
        {children}
      </body>
    </html>
  );
}
