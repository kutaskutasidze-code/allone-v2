import 'dotenv/config';

export const config = {
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY || '',
    fromEmail: process.env.RESEND_FROM_EMAIL || 'info@allone.ge',
    fromName: process.env.RESEND_FROM_NAME || 'Allone',
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY || '',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  scraper: {
    delayMs: parseInt(process.env.SCRAPE_DELAY_MS || '2000', 10),
    maxConcurrentBrowsers: parseInt(process.env.MAX_CONCURRENT_BROWSERS || '2', 10),
    maxLeadsPerSearch: parseInt(process.env.MAX_LEADS_PER_SEARCH || '100', 10),
  },
  email: {
    dailyLimit: parseInt(process.env.DAILY_EMAIL_LIMIT || '100', 10),
    minRelevanceScore: parseInt(process.env.MIN_RELEVANCE_SCORE || '50', 10),
  },
  logLevel: process.env.LOG_LEVEL || 'info',
};

// Search queries for each service type
export const SEARCH_QUERIES = {
  chatbots: [
    'customer support company',
    'call center',
    'e-commerce store',
    'online shop',
    'customer service outsourcing',
  ],
  custom_ai: [
    'fintech company',
    'healthcare clinic',
    'insurance company',
    'bank',
    'medical center',
    'diagnostic center',
  ],
  automation: [
    'logistics company',
    'manufacturing factory',
    'import export company',
    'freight forwarding',
    'warehouse',
    'distribution company',
    'supply chain',
  ],
  website: [
    'hotel',
    'restaurant',
    'startup',
    'travel agency',
    'real estate agency',
    'law firm',
    'dental clinic',
  ],
  consulting: [
    'enterprise company',
    'corporation',
    'holding company',
    'group of companies',
  ],
} as const;

// Target countries and cities — Georgia only
export const COUNTRIES = {
  GE: { name: 'Georgia', cities: ['Tbilisi', 'Batumi', 'Kutaisi', 'Rustavi', 'Zugdidi'] },
} as const;

export type CountryCode = keyof typeof COUNTRIES;
export type ServiceType = keyof typeof SEARCH_QUERIES;
