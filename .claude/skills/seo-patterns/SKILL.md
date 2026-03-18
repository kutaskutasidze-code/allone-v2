---
name: seo-patterns
description: SEO optimization patterns for Next.js applications. Covers metadata, structured data, sitemaps, robots.txt, and performance. Use when optimizing websites for search engines.
---

# SEO Patterns for Next.js

## Overview

This skill covers:
- Metadata API (Next.js 13+)
- Structured data (JSON-LD)
- Sitemaps and robots.txt
- Open Graph and Twitter cards
- Performance optimization

---

## Pattern 1: Metadata API

### Static Metadata

```typescript
// app/page.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Allone | AI Automation Solutions',
  description: 'Transform your business with intelligent automation. AI chatbots, workflow automation, and custom AI solutions.',
  keywords: ['AI automation', 'chatbots', 'workflow automation', 'custom AI'],

  // Open Graph
  openGraph: {
    title: 'Allone | AI Automation Solutions',
    description: 'Transform your business with intelligent automation.',
    url: 'https://allone.ai',
    siteName: 'Allone',
    images: [
      {
        url: 'https://allone.ai/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Allone AI Automation',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  // Twitter
  twitter: {
    card: 'summary_large_image',
    title: 'Allone | AI Automation Solutions',
    description: 'Transform your business with intelligent automation.',
    images: ['https://allone.ai/og-image.jpg'],
    creator: '@allone_ai',
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Verification
  verification: {
    google: 'google-site-verification-code',
    yandex: 'yandex-verification-code',
  },

  // Alternate languages
  alternates: {
    canonical: 'https://allone.ai',
    languages: {
      'en-US': 'https://allone.ai',
      'ru-RU': 'https://allone.ai/ru',
    },
  },
};
```

### Dynamic Metadata

```typescript
// app/blog/[slug]/page.tsx
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: `${post.title} | Allone Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.published_at,
      modifiedTime: post.updated_at,
      authors: [post.author_name],
      images: [
        {
          url: post.cover_image,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [post.cover_image],
    },
  };
}
```

### Layout Metadata Template

```typescript
// app/layout.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://allone.ai'),
  title: {
    default: 'Allone | AI Automation Solutions',
    template: '%s | Allone',
  },
  description: 'Transform your business with intelligent automation.',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};
```

---

## Pattern 2: Structured Data (JSON-LD)

### Organization Schema

```typescript
// components/seo/OrganizationSchema.tsx
export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Allone',
    url: 'https://allone.ai',
    logo: 'https://allone.ai/logo.png',
    description: 'AI automation and intelligent systems company',
    foundingDate: '2020',
    founders: [
      {
        '@type': 'Person',
        name: 'Founder Name',
      },
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: '123 Tech Street',
      addressLocality: 'San Francisco',
      addressRegion: 'CA',
      postalCode: '94102',
      addressCountry: 'US',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-555-123-4567',
      contactType: 'customer service',
      email: 'hello@allone.ai',
    },
    sameAs: [
      'https://twitter.com/allone_ai',
      'https://linkedin.com/company/allone',
      'https://github.com/allone',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

### Service Schema

```typescript
// components/seo/ServiceSchema.tsx
interface ServiceSchemaProps {
  name: string;
  description: string;
  url: string;
  image?: string;
}

export function ServiceSchema({ name, description, url, image }: ServiceSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    url,
    image,
    provider: {
      '@type': 'Organization',
      name: 'Allone',
      url: 'https://allone.ai',
    },
    areaServed: {
      '@type': 'Country',
      name: 'Worldwide',
    },
    serviceType: 'AI Automation',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

### Article Schema

```typescript
// components/seo/ArticleSchema.tsx
interface ArticleSchemaProps {
  title: string;
  description: string;
  url: string;
  image: string;
  publishedAt: string;
  modifiedAt: string;
  author: string;
}

export function ArticleSchema({
  title,
  description,
  url,
  image,
  publishedAt,
  modifiedAt,
  author,
}: ArticleSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    url,
    image: {
      '@type': 'ImageObject',
      url: image,
      width: 1200,
      height: 630,
    },
    datePublished: publishedAt,
    dateModified: modifiedAt,
    author: {
      '@type': 'Person',
      name: author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Allone',
      logo: {
        '@type': 'ImageObject',
        url: 'https://allone.ai/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

### FAQ Schema

```typescript
// components/seo/FAQSchema.tsx
interface FAQ {
  question: string;
  answer: string;
}

export function FAQSchema({ faqs }: { faqs: FAQ[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

### Breadcrumb Schema

```typescript
// components/seo/BreadcrumbSchema.tsx
interface Breadcrumb {
  name: string;
  url: string;
}

export function BreadcrumbSchema({ items }: { items: Breadcrumb[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

---

## Pattern 3: Sitemap Generation

### Static Sitemap

```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://allone.ai';

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];
}
```

### Dynamic Sitemap

```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/admin';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://allone.ai';
  const supabase = createClient();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  // Dynamic: Blog posts
  const { data: posts } = await supabase
    .from('posts')
    .select('slug, updated_at')
    .eq('is_published', true);

  const postPages: MetadataRoute.Sitemap = (posts ?? []).map(post => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updated_at),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  // Dynamic: Projects
  const { data: projects } = await supabase
    .from('projects')
    .select('id, updated_at')
    .eq('is_published', true);

  const projectPages: MetadataRoute.Sitemap = (projects ?? []).map(project => ({
    url: `${baseUrl}/projects/${project.id}`,
    lastModified: new Date(project.updated_at),
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  return [...staticPages, ...postPages, ...projectPages];
}
```

### Multiple Sitemaps (Large Sites)

```typescript
// app/sitemap/[id]/route.ts
import { createClient } from '@/lib/supabase/admin';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createClient();
  const baseUrl = 'https://allone.ai';

  let urls: string[] = [];

  if (id === 'posts') {
    const { data: posts } = await supabase
      .from('posts')
      .select('slug')
      .eq('is_published', true);

    urls = (posts ?? []).map(
      post => `
        <url>
          <loc>${baseUrl}/blog/${post.slug}</loc>
          <changefreq>weekly</changefreq>
          <priority>0.6</priority>
        </url>
      `
    );
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${urls.join('')}
    </urlset>
  `;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}

// Sitemap index
// app/sitemap.xml/route.ts
export async function GET() {
  const baseUrl = 'https://allone.ai';

  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
    <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <sitemap>
        <loc>${baseUrl}/sitemap/main</loc>
      </sitemap>
      <sitemap>
        <loc>${baseUrl}/sitemap/posts</loc>
      </sitemap>
      <sitemap>
        <loc>${baseUrl}/sitemap/projects</loc>
      </sitemap>
    </sitemapindex>
  `;

  return new Response(sitemapIndex, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
```

---

## Pattern 4: Robots.txt

```typescript
// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://allone.ai';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/private/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: '/admin/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```

---

## Pattern 5: Performance SEO

### Image Optimization

```typescript
// components/OptimizedImage.tsx
import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
}: OptimizedImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      loading={priority ? 'eager' : 'lazy'}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAUH/8QAIBAAAgEEAgMBAAAAAAAAAAAAAQIDAAQFEQYhEjFBUf/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEQCEAPwCzeKY/IZjKR5CSNVuEjaNZY0CsVJB0SOx5elUpHwuMsrW3xkUEEUaII0Cog6AA9ACpYoP/9k="
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      quality={85}
    />
  );
}
```

### Core Web Vitals Helpers

```typescript
// components/seo/WebVitalsReporter.tsx
'use client';

import { useReportWebVitals } from 'next/web-vitals';

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    // Send to analytics
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      id: metric.id,
      delta: metric.delta,
      rating: metric.rating,
    });

    // Use sendBeacon if available
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/vitals', body);
    } else {
      fetch('/api/analytics/vitals', {
        method: 'POST',
        body,
        keepalive: true,
      });
    }
  });

  return null;
}
```

### Preload Critical Resources

```typescript
// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Preload critical fonts */}
        <link
          rel="preload"
          href="/fonts/inter-var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />

        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* DNS prefetch for third-party scripts */}
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

---

## Pattern 6: SEO Component Library

### Complete SEO Head Component

```typescript
// components/seo/SEOHead.tsx
import { Metadata } from 'next';
import { OrganizationSchema } from './OrganizationSchema';
import { BreadcrumbSchema } from './BreadcrumbSchema';

interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  noIndex?: boolean;
  breadcrumbs?: Array<{ name: string; url: string }>;
}

export function generateSEOMetadata({
  title,
  description,
  canonical,
  ogImage = 'https://allone.ai/og-default.jpg',
  noIndex = false,
}: SEOHeadProps): Metadata {
  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

// Usage in page
// export const metadata = generateSEOMetadata({
//   title: 'AI Chatbots | Allone',
//   description: 'Build intelligent chatbots...',
//   canonical: 'https://allone.ai/services/chatbots',
// });
```

---

## Pattern 7: Internationalization SEO

```typescript
// app/[lang]/layout.tsx
import { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;

  const titles: Record<string, string> = {
    en: 'Allone | AI Automation Solutions',
    ru: 'Allone | Решения для автоматизации с ИИ',
    tr: 'Allone | Yapay Zeka Otomasyon Çözümleri',
  };

  return {
    title: titles[lang] ?? titles.en,
    alternates: {
      canonical: `https://allone.ai/${lang}`,
      languages: {
        en: 'https://allone.ai/en',
        ru: 'https://allone.ai/ru',
        tr: 'https://allone.ai/tr',
      },
    },
  };
}

export function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ru' }, { lang: 'tr' }];
}
```

---

## SEO Checklist

### Technical SEO
- [ ] Meta title (50-60 chars) and description (150-160 chars)
- [ ] Canonical URLs set
- [ ] Sitemap.xml generated
- [ ] Robots.txt configured
- [ ] HTTPS enabled
- [ ] Mobile responsive
- [ ] Core Web Vitals optimized

### Content SEO
- [ ] H1 on every page (only one)
- [ ] Alt text on images
- [ ] Internal linking
- [ ] Structured data (JSON-LD)
- [ ] Open Graph tags
- [ ] Twitter cards

### Performance
- [ ] Images optimized (WebP, lazy loading)
- [ ] Fonts preloaded
- [ ] CSS/JS minimized
- [ ] Server response < 200ms
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1
