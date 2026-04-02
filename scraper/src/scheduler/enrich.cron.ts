import { logger } from '../utils/logger.js';
import { getSupabase } from '../database/client.js';
import { extractContactInfo } from '../extractors/email.extractor.js';
import { auditWebsite } from '../extractors/website.checker.js';
import { normalizeGeorgianPhone } from '../utils/phone.js';
import { calculateRelevanceScore } from '../utils/scoring.js';
import { closeBrowser } from '../utils/browser.js';

const BATCH_SIZE = 30;

async function runEnrichCron() {
  logger.info('Starting lead enrichment cron...');

  const supabase = getSupabase();

  // Phase 1: Enrich leads that have a website but no phone
  await enrichPhones(supabase);

  // Phase 2: Audit websites and add pitch reasons for leads that haven't been audited
  await auditWebsites(supabase);

  await closeBrowser();
  logger.info('Enrichment cron complete');
}

async function enrichPhones(supabase: ReturnType<typeof getSupabase>) {
  const { data: leads, error } = await supabase
    .from('leads')
    .select('id, name, website, email, address, matched_service, facebook_url, instagram_url, linkedin_url, tags')
    .eq('country', 'GE')
    .is('phone', null)
    .not('website', 'is', null)
    .eq('is_scraped', true)
    .order('relevance_score', { ascending: false })
    .limit(BATCH_SIZE);

  if (error) {
    logger.error(`Failed to fetch leads for phone enrichment: ${error.message}`);
    return;
  }

  if (!leads || leads.length === 0) {
    logger.info('No leads need phone enrichment');
    return;
  }

  logger.info(`Phone enrichment: ${leads.length} leads...`);
  let enriched = 0;

  for (const lead of leads) {
    // Skip if already attempted
    if (lead.tags?.includes('enrich_attempted')) continue;

    try {
      const contact = await extractContactInfo(lead.website!);

      let phone: string | null = null;
      for (const rawPhone of contact.phones) {
        const normalized = normalizeGeorgianPhone(rawPhone);
        if (normalized) { phone = normalized; break; }
      }

      if (!phone) {
        const tags = [...(lead.tags || []), 'enrich_attempted'];
        await supabase.from('leads').update({ tags }).eq('id', lead.id);
        continue;
      }

      // Check phone dedup
      const { data: existing } = await supabase
        .from('leads').select('id').eq('phone', phone).limit(1).single();
      if (existing) continue;

      const newScore = calculateRelevanceScore({
        phone,
        email: lead.email || contact.emails[0],
        website: lead.website || undefined,
        address: lead.address || undefined,
        facebook_url: lead.facebook_url || contact.socialLinks.facebook,
        instagram_url: lead.instagram_url || contact.socialLinks.instagram,
        linkedin_url: lead.linkedin_url || contact.socialLinks.linkedin,
        matched_service: lead.matched_service || undefined,
      });

      const updates: Record<string, unknown> = { phone, relevance_score: newScore };
      if (!lead.email && contact.emails.length > 0) updates.email = contact.emails[0];
      if (!lead.facebook_url && contact.socialLinks.facebook) updates.facebook_url = contact.socialLinks.facebook;
      if (!lead.instagram_url && contact.socialLinks.instagram) updates.instagram_url = contact.socialLinks.instagram;
      if (!lead.linkedin_url && contact.socialLinks.linkedin) updates.linkedin_url = contact.socialLinks.linkedin;

      await supabase.from('leads').update(updates).eq('id', lead.id);
      enriched++;
      logger.info(`Phone enriched: ${lead.name} -> ${phone}`);
    } catch (err) {
      logger.debug(`Phone enrichment failed for ${lead.name}: ${err}`);
    }
  }

  logger.info(`Phone enrichment done: ${enriched}/${leads.length}`);
}

async function auditWebsites(supabase: ReturnType<typeof getSupabase>) {
  // Find leads WITH a website that haven't been audited yet
  // "audited" = has any pitch reason tag other than no_website/new_business
  const { data: leads, error } = await supabase
    .from('leads')
    .select('id, name, website, tags, phone, email, address, matched_service, facebook_url, instagram_url, linkedin_url')
    .eq('country', 'GE')
    .eq('is_scraped', true)
    .not('website', 'is', null)
    .not('phone', 'is', null)
    .order('relevance_score', { ascending: false })
    .limit(BATCH_SIZE);

  if (error) {
    logger.error(`Failed to fetch leads for website audit: ${error.message}`);
    return;
  }

  if (!leads || leads.length === 0) {
    logger.info('No leads need website audit');
    return;
  }

  // Filter to only leads not yet audited
  const AUDIT_TAGS = ['no_https', 'not_mobile_friendly', 'no_chat_widget', 'no_online_booking', 'slow_website', 'basic_website_builder', 'website_broken', 'website_audited'];
  const unaudited = leads.filter(l => {
    const tags = l.tags || [];
    return !tags.some((t: string) => AUDIT_TAGS.includes(t));
  });

  if (unaudited.length === 0) {
    logger.info('All leads already audited');
    return;
  }

  logger.info(`Website audit: ${unaudited.length} leads...`);
  let audited = 0;

  for (const lead of unaudited) {
    try {
      const audit = await auditWebsite(lead.website!);

      // Merge pitch reasons with existing tags
      const existingTags = lead.tags || [];
      const newTags = [...new Set([...existingTags, ...audit.pitchReasons, 'website_audited'])];

      // Recalculate score with pitch reasons factored in
      const pitchBonus = audit.pitchReasons.length; // more issues = higher priority
      const baseScore = calculateRelevanceScore({
        phone: lead.phone || undefined,
        email: lead.email || undefined,
        website: lead.website || undefined,
        address: lead.address || undefined,
        facebook_url: lead.facebook_url || undefined,
        instagram_url: lead.instagram_url || undefined,
        linkedin_url: lead.linkedin_url || undefined,
        matched_service: lead.matched_service || undefined,
      });

      await supabase.from('leads').update({
        tags: newTags,
        relevance_score: Math.min(baseScore + pitchBonus, 25),
      }).eq('id', lead.id);

      audited++;
      const reasons = audit.pitchReasons.join(', ') || 'none';
      logger.info(`Audited ${lead.name}: ${reasons}`);
    } catch (err) {
      logger.debug(`Website audit failed for ${lead.name}: ${err}`);
    }
  }

  logger.info(`Website audit done: ${audited}/${unaudited.length}`);
}

runEnrichCron().catch((err) => {
  logger.error(`Enrich cron failed: ${err}`);
  process.exit(1);
});
