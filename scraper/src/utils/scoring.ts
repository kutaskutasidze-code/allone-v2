import { isGeorgianMobile } from './phone.js';

interface ScorableLeadData {
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  rating?: number;
  userRatingCount?: number;
  facebook_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  matched_service?: string;
  tags?: string[];
}

/**
 * Calculate relevance score for a lead. Weighted toward phone availability
 * since the sales team cold calls, and toward new businesses that are more
 * likely to need websites, chatbots, and automation. Max score: 25.
 */
export function calculateRelevanceScore(lead: ScorableLeadData): number {
  let score = 0;

  // Phone availability (critical for cold calling)
  if (lead.phone) score += 6;
  if (lead.phone && isGeorgianMobile(lead.phone)) score += 2;

  // Contact richness
  if (lead.email) score += 2;
  if (lead.website) score += 2;
  if (lead.address) score += 1;
  if (lead.facebook_url || lead.instagram_url) score += 1;
  if (lead.linkedin_url) score += 1;

  // Service match (non-default = better categorized)
  if (lead.matched_service && lead.matched_service !== 'website') score += 3;

  // New business signal: no rating or very few reviews = likely new
  // These companies are more likely to need websites, chatbots, automation
  if (!lead.rating || lead.rating === 0) {
    score += 4; // no rating = probably new, high priority
  } else if (lead.userRatingCount !== undefined && lead.userRatingCount < 10) {
    score += 3; // few reviews = relatively new
  } else if (lead.rating && lead.rating < 3.5) {
    score += 2; // low rating = struggling, may need online presence help
  } else if (lead.rating && lead.rating >= 4) {
    score += 1; // established but well-rated
  }

  // Enough reviews to suggest real business volume (not a solo freelancer)
  if (lead.userRatingCount !== undefined && lead.userRatingCount >= 10) score += 1;

  // No website = definitely needs one
  if (!lead.website && lead.phone) score += 2;

  // Newly registered company = highest priority
  if (lead.tags?.includes('newly_registered')) score += 5;

  return Math.min(score, 30);
}
