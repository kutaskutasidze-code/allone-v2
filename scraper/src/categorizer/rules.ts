import type { ServiceType } from '../config.js';

interface CategoryRule {
  keywords: string[];
  industryMatch: string[];
  scoreBoost: number;
}

export const CATEGORIZATION_RULES: Record<ServiceType, CategoryRule> = {
  chatbots: {
    keywords: [
      'customer support', 'call center', 'contact center',
      'e-commerce', 'online store', 'marketplace',
      'customer service', 'help desk', 'support center',
      'retail', 'shop', 'store', 'shopping',
    ],
    industryMatch: ['retail', 'e-commerce', 'telecommunications', 'banking'],
    scoreBoost: 20,
  },
  custom_ai: {
    keywords: [
      'fintech', 'healthcare', 'medical', 'insurance',
      'bank', 'finance', 'clinic', 'hospital',
      'diagnostic', 'laboratory', 'pharmaceutical',
      'analytics', 'data', 'research',
    ],
    industryMatch: ['healthcare', 'finance', 'insurance', 'pharmaceutical'],
    scoreBoost: 25,
  },
  automation: {
    keywords: [
      'logistics', 'freight', 'shipping', 'warehouse',
      'manufacturing', 'factory', 'production',
      'import', 'export', 'trading', 'distribution',
      'supply chain', 'inventory', 'cargo',
    ],
    industryMatch: ['logistics', 'manufacturing', 'trading', 'wholesale'],
    scoreBoost: 20,
  },
  website: {
    keywords: [
      'hotel', 'restaurant', 'cafe', 'tourism',
      'travel agency', 'real estate', 'property',
      'law firm', 'legal', 'dental', 'beauty salon',
      'startup', 'small business', 'boutique',
    ],
    industryMatch: ['hospitality', 'tourism', 'real estate', 'legal'],
    scoreBoost: 15,
  },
  consulting: {
    keywords: [
      'enterprise', 'corporation', 'holding',
      'group of companies', 'conglomerate',
      'digital transformation', 'innovation',
      'multinational', 'international',
    ],
    industryMatch: ['enterprise', 'corporate'],
    scoreBoost: 30,
  },
};

export function categorizeCompany(
  name: string,
  description: string = '',
  industry: string = ''
): { service: ServiceType | null; score: number } {
  const text = `${name} ${description} ${industry}`.toLowerCase();

  let bestService: ServiceType | null = null;
  let bestScore = 0;

  for (const [service, rule] of Object.entries(CATEGORIZATION_RULES)) {
    let score = 0;

    // Check keywords
    for (const keyword of rule.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        score += 10;
      }
    }

    // Check industry match
    for (const ind of rule.industryMatch) {
      if (industry.toLowerCase().includes(ind.toLowerCase())) {
        score += rule.scoreBoost;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestService = service as ServiceType;
    }
  }

  // Normalize score to 0-100
  const normalizedScore = Math.min(100, bestScore);

  return { service: bestService, score: normalizedScore };
}
