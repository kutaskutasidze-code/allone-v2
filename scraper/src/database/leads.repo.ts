import { getSupabase, LeadData } from './client.js';
import { logger } from '../utils/logger.js';

export async function insertLead(lead: LeadData): Promise<{ success: boolean; isDuplicate: boolean; id?: string }> {
  const supabase = getSupabase();

  // Check for duplicates by website or email
  if (lead.website || lead.email) {
    const { data: existing } = await supabase
      .from('leads')
      .select('id')
      .or(`website.eq.${lead.website},email.eq.${lead.email}`)
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
      ...lead,
      status: 'new',
      value: 0,
      is_scraped: true,
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
