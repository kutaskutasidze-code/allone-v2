import type { Metadata, Viewport } from 'next';
import { Outfit, Inter } from 'next/font/google';
import { OrganizationSchema, WebsiteSchema } from '@/components/seo';
import './globals.css';

// Optimize font loading with next/font
const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
  weight: ['300', '400', '500', '600', '700', '800'],
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  weight: ['300', '400', '500', '600'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://allone.ge'),
  title: {
    default: 'ALLONE | AI Automation Solutions',
    template: '%s | ALLONE',
  },
  alternates: {
    canonical: '/',
    languages: {
      'en': '/',
      'ka': '/',
      'x-default': '/',
    },
  },
  description:
    'Transform your business with intelligent AI automation. We design and build custom AI solutions that automate complex workflows, enhance decision-making, and unlock unprecedented efficiency.',
  keywords: [
    'AI automation',
    'artificial intelligence',
    'chatbots',
    'workflow automation',
    'custom AI solutions',
    'machine learning',
    'business automation',
  ],
  authors: [{ name: 'ALLONE' }],
  creator: 'ALLONE',
  icons: {
    icon: '/images/allone-logo.png',
    apple: '/images/allone-logo.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://allone.ge',
    siteName: 'ALLONE',
    title: 'ALLONE | AI Automation Solutions',
    description:
      'Transform your business with intelligent AI automation. Custom AI solutions for modern enterprises.',
    images: [
      {
        url: '/images/allone-logo.png',
        width: 500,
        height: 500,
        alt: 'ALLONE - AI Automation Solutions',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ALLONE | AI Automation Solutions',
    description:
      'Transform your business with intelligent AI automation.',
    creator: '@allone_ai',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`}>
      <body className="antialiased">
        <OrganizationSchema />
        <WebsiteSchema />
        {children}
      </body>
    </html>
  );
}
