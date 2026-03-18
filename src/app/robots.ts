import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/sales/'],
      },
      {
        userAgent: 'GPTBot',
        allow: ['/', '/llms.txt', '/llms-full.txt'],
        disallow: ['/admin/', '/api/', '/sales/', '/dashboard/'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: ['/', '/llms.txt', '/llms-full.txt'],
        disallow: ['/admin/', '/api/', '/sales/', '/dashboard/'],
      },
      {
        userAgent: 'Anthropic-ai',
        allow: ['/', '/llms.txt', '/llms-full.txt'],
        disallow: ['/admin/', '/api/', '/sales/', '/dashboard/'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: ['/', '/llms.txt', '/llms-full.txt'],
        disallow: ['/admin/', '/api/', '/sales/', '/dashboard/'],
      },
      {
        userAgent: 'Google-Extended',
        allow: ['/', '/llms.txt', '/llms-full.txt'],
        disallow: ['/admin/', '/api/', '/sales/', '/dashboard/'],
      },
    ],
    sitemap: 'https://allone.ge/sitemap.xml',
  };
}
