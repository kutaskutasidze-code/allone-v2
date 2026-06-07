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
  googlePlaces: {
    apiKey: process.env.GOOGLE_PLACES_API_KEY || '',
    maxPagesPerSearch: parseInt(process.env.GOOGLE_PLACES_MAX_PAGES || '3', 10),
    // Text Search w/ phone+website = "Enterprise" SKU: only 1,000 free calls/mo.
    // Daily 32 spreads ~1,000 across the month; the monthly cap is the hard
    // guarantee we never cross the free tier (billed at $35/1k beyond it).
    dailyBudgetRequests: parseInt(process.env.GOOGLE_PLACES_DAILY_BUDGET || '32', 10),
    monthlyBudgetRequests: parseInt(process.env.GOOGLE_PLACES_MONTHLY_BUDGET || '1000', 10),
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
// Tbilisi first, gets all queries. Other cities get English queries only.
export const COUNTRIES = {
  GE: { name: 'Georgia', cities: ['Tbilisi', 'Batumi', 'Kutaisi'] },
} as const;

// Tbilisi gets extra search queries to use more of the budget
export const TBILISI_EXTRA_QUERIES: Record<string, string[]> = {
  chatbots: ['pharmacy', 'veterinary clinic', 'pet shop', 'electronics store'],
  custom_ai: ['laboratory', 'radiology center', 'blood bank'],
  automation: ['car dealership', 'auto parts', 'construction company', 'printing company'],
  website: ['beauty salon', 'spa', 'gym', 'fitness center', 'bakery', 'bar', 'nightclub', 'coworking space', 'photography studio'],
  consulting: ['accounting firm', 'notary', 'audit company'],
};

// Georgian-language search queries for better local coverage
export const SEARCH_QUERIES_KA: Record<string, string[]> = {
  chatbots: ['კლინიკა', 'აფთიაქი', 'ონლაინ მაღაზია', 'ინტერნეტ მაღაზია'],
  custom_ai: ['ბანკი', 'სადაზღვევო', 'ფინანსური კომპანია', 'ლაბორატორია'],
  automation: ['ლოჯისტიკა', 'საწყობი', 'ქარხანა', 'იმპორტი ექსპორტი'],
  website: ['სასტუმრო', 'რესტორანი', 'კაფე', 'ტურისტული სააგენტო', 'უძრავი ქონება', 'სტომატოლოგია'],
  consulting: ['კორპორაცია', 'ჰოლდინგი', 'საწარმო'],
};

export type CountryCode = keyof typeof COUNTRIES;
export type ServiceType = keyof typeof SEARCH_QUERIES;
