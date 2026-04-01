import { MetadataRoute } from 'next';

const serviceTypes = ['chatbot', 'custom-ai', 'workflow', 'website', 'consulting'];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://allone.ge';
  const lastUpdated = '2026-03-31';

  const staticPages = [
    {
      url: baseUrl,
      lastModified: lastUpdated,
      changeFrequency: 'weekly' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: lastUpdated,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/work`,
      lastModified: lastUpdated,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: lastUpdated,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/lab`,
      lastModified: lastUpdated,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
  ];

  const servicePages = serviceTypes.map((slug) => ({
    url: `${baseUrl}/services/${slug}`,
    lastModified: lastUpdated,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  return [...staticPages, ...servicePages];
}
