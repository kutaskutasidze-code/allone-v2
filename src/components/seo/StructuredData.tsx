'use client';

interface OrganizationSchemaProps {
  name?: string;
  url?: string;
  logo?: string;
  description?: string;
  email?: string;
  sameAs?: string[];
}

export function OrganizationSchema({
  name = 'ALLONE',
  url = 'https://allone.ge',
  logo = 'https://allone.ge/images/allone-logo.png',
  description = 'AI automation agency that converges all your systems into one intelligent layer. Custom AI solutions, workflow automation, intelligent chatbots, and modern website development for businesses worldwide.',
  email = 'hello@allone.ge',
  sameAs = [],
}: OrganizationSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    logo,
    description,
    email,
    foundingDate: '2025',
    sameAs,
    knowsAbout: [
      'Artificial Intelligence',
      'Machine Learning',
      'Workflow Automation',
      'Chatbot Development',
      'Natural Language Processing',
      'Web Development',
      'AI Consulting',
    ],
    areaServed: {
      '@type': 'GeoCircle',
      geoMidpoint: {
        '@type': 'GeoCoordinates',
        latitude: 41.7151,
        longitude: 44.8271,
      },
      geoRadius: '10000',
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        email,
        availableLanguage: ['English', 'Georgian'],
      },
    ],
    address: [
      {
        '@type': 'PostalAddress',
        addressLocality: 'Tbilisi',
        addressCountry: 'GE',
      },
      {
        '@type': 'PostalAddress',
        addressLocality: 'Brussels',
        addressCountry: 'BE',
      },
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'AI Automation Services',
      itemListElement: [
        {
          '@type': 'OfferCatalog',
          name: 'AI Chatbots',
          description: 'Custom conversational AI with 24/7 automated customer support',
        },
        {
          '@type': 'OfferCatalog',
          name: 'Custom AI Solutions',
          description: 'Bespoke machine learning models, computer vision, and NLP pipelines',
        },
        {
          '@type': 'OfferCatalog',
          name: 'Workflow Automation',
          description: 'End-to-end process automation with AI-powered decision making',
        },
        {
          '@type': 'OfferCatalog',
          name: 'Website Development',
          description: 'High-performance Next.js websites with AI-powered features',
        },
        {
          '@type': 'OfferCatalog',
          name: 'Strategy & Consulting',
          description: 'AI readiness assessment and implementation roadmaps',
        },
      ],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface ServiceSchemaProps {
  name: string;
  description: string;
  url?: string;
  provider?: string;
  serviceType?: string;
}

export function ServiceSchema({
  name,
  description,
  url,
  provider = 'ALLONE',
  serviceType = 'AI Automation',
}: ServiceSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    ...(url && { url }),
    provider: {
      '@type': 'Organization',
      name: provider,
      url: 'https://allone.ge',
    },
    serviceType,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface WebsiteSchemaProps {
  name?: string;
  url?: string;
  description?: string;
}

export function WebsiteSchema({
  name = 'ALLONE',
  url = 'https://allone.ge',
  description = 'AI Automation Solutions for Modern Enterprises',
}: WebsiteSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url,
    description,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${url}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface BreadcrumbSchemaProps {
  items: Array<{
    name: string;
    url: string;
  }>;
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
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

interface FAQSchemaProps {
  questions: Array<{
    question: string;
    answer: string;
  }>;
}

export function FAQSchema({ questions }: FAQSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
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
