import { getSupabase, LeadData } from './client.js';
import { logger } from '../utils/logger.js';
import { normalizeGeorgianPhone } from '../utils/phone.js';

export async function insertLead(lead: LeadData): Promise<{ success: boolean; isDuplicate: boolean; id?: string }> {
  const supabase = getSupabase();

  // Normalize phone before insert/dedup
  if (lead.phone && lead.country === 'GE') {
    const normalized = normalizeGeorgianPhone(lead.phone);
    if (normalized) {
      lead.phone = normalized;
    } else {
      lead.phone = undefined; // invalid Georgian number
    }
  }

  // Check for duplicates by source_url, phone, website, or email
  const orClauses: string[] = [];
  if (lead.source_url) orClauses.push(`source_url.eq.${lead.source_url}`);
  if (lead.phone) orClauses.push(`phone.eq.${lead.phone}`);
  if (lead.website) orClauses.push(`website.eq.${lead.website}`);
  if (lead.email) orClauses.push(`email.eq.${lead.email}`);

  if (orClauses.length > 0) {
    const { data: existing } = await supabase
      .from('leads')
      .select('id')
      .or(orClauses.join(','))
      .limit(1)
      .single();

    if (existing) {
      logger.debug(`Duplicate lead found: ${lead.name}`);
      return { success: false, isDuplicate: true };
    }
  }

  const { data, error } = await supabase
    .from('leads')
    .insert({
      name: lead.name,
      company: lead.company || null,
      company_name_local: lead.company_name_local || null,
      email: lead.email || null,
      phone: lead.phone || null,
      website: lead.website || null,
      industry: lead.industry || null,
      company_size: lead.company_size || null,
      description: lead.description || null,
      address: lead.address || null,
      city: lead.city || null,
      country: lead.country,
      linkedin_url: lead.linkedin_url || null,
      facebook_url: lead.facebook_url || null,
      instagram_url: lead.instagram_url || null,
      matched_service: lead.matched_service || null,
      relevance_score: lead.relevance_score || 0,
      tags: lead.tags || null,
      source_id: lead.source_id || null,
      source_url: lead.source_url || null,
      status: 'new',
      value: 0,
      is_scraped: true,
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    logger.error(`Failed to insert lead: ${error.message}`);
    return { success: false, isDuplicate: false };
  }

  logger.info(`Inserted new lead: ${lead.name}`);
  return { success: true, isDuplicate: false, id: data.id };
}

export async function bulkInsertLeads(leads: LeadData[]): Promise<{ inserted: number; duplicates: number }> {
  let inserted = 0;
  let duplicates = 0;

  for (const lead of leads) {
    const result = await insertLead(lead);
    if (result.success) inserted++;
    if (result.isDuplicate) duplicates++;
  }

  return { inserted, duplicates };
}

export async function getLeadsForEmail(campaignId: string, limit: number = 50): Promise<LeadData[]> {
  const supabase = getSupabase();

  // Get campaign targeting criteria
  const { data: campaign, error: campaignError } = await supabase
    .from('email_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();

  if (campaignError || !campaign) {
    logger.error(`Campaign not found: ${campaignId}`);
    return [];
  }

  // Build query for leads that match criteria and haven't been emailed
  let query = supabase
    .from('leads')
    .select('*')
    .eq('status', 'new')
    .is('email_sent_at', null)
    .not('email', 'is', null)
    .gte('relevance_score', campaign.min_relevance_score || 0)
    .order('relevance_score', { ascending: false })
    .limit(limit);

  // Apply service filter
  if (campaign.target_service) {
    query = query.eq('matched_service', campaign.target_service);
  }

  // Apply country filter
  if (campaign.target_countries && campaign.target_countries.length > 0) {
    query = query.in('country', campaign.target_countries);
  }

  const { data, error } = await query;

  if (error) {
    logger.error(`Failed to get leads for email: ${error.message}`);
    return [];
  }

  return data as LeadData[];
}

export async function markLeadEmailed(leadId: string): Promise<void> {
  const supabase = getSupabase();

  await supabase
    .from('leads')
    .update({
      email_sent_at: new Date().toISOString(),
      status: 'contacted',
    })
    .eq('id', leadId);
}

export async function updateLeadRelevance(leadId: string, score: number, service: string): Promise<void> {
  const supabase = getSupabase();

  await supabase
    .from('leads')
    .update({
      relevance_score: score,
      matched_service: service,
    })
    .eq('id', leadId);
}
