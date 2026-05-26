import { isGeorgianMobile } from './phone.js';

interface ScorableLeadData {
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  facebook_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  matched_service?: string;
  tags?: string[];
}

export function calculateRelevanceScore(lead: ScorableLeadData): number {
  let score = 0;

  if (lead.phone) score += 6;
  if (lead.phone && isGeorgianMobile(lead.phone)) score += 2;

  if (lead.email) score += 2;
  if (lead.website) score += 2;
  if (lead.address) score += 1;
  if (lead.facebook_url || lead.instagram_url) score += 1;
  if (lead.linkedin_url) score += 1;

  if (lead.matched_service && lead.matched_service !== 'website') score += 3;

  if (!lead.website && lead.phone) score += 2;

  if (lead.tags?.includes('newly_registered')) score += 5;

  return Math.min(score, 30);
}
