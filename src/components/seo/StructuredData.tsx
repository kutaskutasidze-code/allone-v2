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
    areaServed: [
      {
        '@type': 'City',
        name: 'Tbilisi',
        containedInPlace: { '@type': 'Country', name: 'Georgia' },
      },
      {
        '@type': 'City',
        name: 'Brussels',
        containedInPlace: { '@type': 'Country', name: 'Belgium' },
      },
      {
        '@type': 'Place',
        name: 'Worldwide',
      },
    ],
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
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name: 'AI Chatbots', description: 'Custom conversational AI with 24/7 automated customer support across WhatsApp, Telegram, Instagram, and web' },
        },
        {
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name: 'Custom AI Solutions', description: 'Bespoke machine learning models, computer vision, and NLP pipelines' },
        },
        {
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name: 'Workflow Automation', description: 'End-to-end process automation with AI-powered decision making using n8n, Zapier, and custom pipelines' },
        },
        {
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name: 'Website Development', description: 'High-performance Next.js websites and web apps with SEO optimization and modern UI' },
        },
        {
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name: 'Strategy & Consulting', description: 'AI readiness assessment and implementation roadmaps for businesses' },
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

export function LocalBusinessSchema() {
  const locations = [
    {
      '@context': 'https://schema.org',
      '@type': 'ProfessionalService',
      name: 'ALLONE — AI Automation Agency',
      url: 'https://allone.ge',
      email: 'hello@allone.ge',
      description: 'AI automation agency offering custom chatbots, workflow automation, and web development services in Tbilisi, Georgia.',
      image: 'https://allone.ge/images/allone-logo.png',
      priceRange: '$$',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Tbilisi',
        addressCountry: 'GE',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 41.7151,
        longitude: 44.8271,
      },
      areaServed: ['Georgia', 'Europe', 'Worldwide'],
      knowsLanguage: ['en', 'ka'],
      serviceType: ['AI Chatbot Development', 'Workflow Automation', 'Web Development', 'AI Consulting'],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ProfessionalService',
      name: 'ALLONE — AI Automation Agency',
      url: 'https://allone.ge',
      email: 'hello@allone.ge',
      description: 'AI automation agency offering custom chatbots, workflow automation, and web development services in Brussels, Belgium.',
      image: 'https://allone.ge/images/allone-logo.png',
      priceRange: '$$',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Brussels',
        addressCountry: 'BE',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 50.8503,
        longitude: 4.3517,
      },
      areaServed: ['Belgium', 'Europe', 'Worldwide'],
      knowsLanguage: ['en', 'fr', 'nl'],
      serviceType: ['AI Chatbot Development', 'Workflow Automation', 'Web Development', 'AI Consulting'],
    },
  ];

  return (
    <>
      {locations.map((loc, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(loc) }}
        />
      ))}
    </>
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
    inLanguage: 'en',
    publisher: { '@type': 'Organization', name: 'ALLONE', url },
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
