import { logger } from '../utils/logger.js';
import { getSupabase, LeadSource, ScrapeJob } from '../database/client.js';
import { bulkInsertLeads } from '../database/leads.repo.js';
import { TwoGisScraper } from '../scrapers/2gis.scraper.js';
import { GooglePlacesScraper } from '../scrapers/google-places.scraper.js';
import { extractContactInfo } from '../extractors/email.extractor.js';
import { categorizeCompany } from '../categorizer/rules.js';
import { closeBrowser } from '../utils/browser.js';
import { BaseScraper } from '../scrapers/base.scraper.js';
import { COUNTRIES, SEARCH_QUERIES, SEARCH_QUERIES_KA, TBILISI_EXTRA_QUERIES, type CountryCode, type ServiceType } from '../config.js';

function createScraper(source: LeadSource): BaseScraper | null {
  if (source.name.includes('2GIS')) return new TwoGisScraper(source);
  if (source.name.includes('Google Places')) return new GooglePlacesScraper(source);
  return null;
}

async function runScrapeCron() {
  logger.info('Starting scrape cron job...');

  const supabase = getSupabase();

  const { data: sources, error: sourcesError } = await supabase
    .from('lead_sources')
    .select('*')
    .eq('is_active', true);

  if (sourcesError || !sources) {
    logger.error(`Failed to fetch sources: ${sourcesError?.message}`);
    return;
  }

  logger.info(`Found ${sources.length} active sources`);

  for (const source of sources as LeadSource[]) {
    if (source.source_type !== 'maps') continue;

    const scraper = createScraper(source);
    if (!scraper) {
      logger.debug(`No scraper for source: ${source.name}`);
      continue;
    }

    const isGooglePlaces = source.name.includes('Google Places');

    for (const countryCode of source.countries as CountryCode[]) {
      const country = COUNTRIES[countryCode];
      if (!country) continue;

      for (const city of country.cities) {
        // Build query list: English queries + Georgian queries for Google Places
        const allQueries: { query: string; serviceType: string }[] = [];

        for (const [serviceType, queries] of Object.entries(SEARCH_QUERIES)) {
          const query = queries[Math.floor(Math.random() * queries.length)];
          allQueries.push({ query, serviceType });
        }

        // Add Georgian-language queries for Google Places
        if (isGooglePlaces && SEARCH_QUERIES_KA) {
          for (const [serviceType, queries] of Object.entries(SEARCH_QUERIES_KA)) {
            const query = queries[Math.floor(Math.random() * queries.length)];
            allQueries.push({ query, serviceType });
          }
        }

        // Tbilisi gets extra queries to cover more business types
        if (isGooglePlaces && city === 'Tbilisi' && TBILISI_EXTRA_QUERIES) {
          for (const [serviceType, queries] of Object.entries(TBILISI_EXTRA_QUERIES)) {
            for (const query of queries) {
              allQueries.push({ query, serviceType });
            }
          }
        }

        for (const { query, serviceType } of allQueries) {
          const { data: job, error: jobError } = await supabase
            .from('scrape_jobs')
            .insert({
              source_id: source.id,
              status: 'running',
              search_query: query,
              country: countryCode,
              city,
              started_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (jobError) {
            logger.error(`Failed to create job: ${jobError.message}`);
            continue;
          }

          const jobId = (job as ScrapeJob).id;

          try {
            logger.info(`Scraping ${source.name}: "${query}" in ${city}, ${countryCode}`);

            const result = await scraper.scrape(query, city, countryCode);

            // Enrich leads with contact info and categorization (skip for Google Places - already categorized)
            if (!isGooglePlaces) {
              for (const lead of result.leads) {
                const { service, score } = categorizeCompany(
                  lead.name,
                  lead.description || '',
                  lead.industry || ''
                );
                lead.matched_service = service || serviceType;
                lead.relevance_score = score;

                if (lead.website) {
                  try {
                    const contact = await extractContactInfo(lead.website);
                    if (contact.emails.length > 0) lead.email = contact.emails[0];
                    if (contact.phones.length > 0 && !lead.phone) lead.phone = contact.phones[0];
                    if (contact.socialLinks.linkedin) lead.linkedin_url = contact.socialLinks.linkedin;
                    if (contact.socialLinks.facebook) lead.facebook_url = contact.socialLinks.facebook;
                    if (contact.socialLinks.instagram) lead.instagram_url = contact.socialLinks.instagram;
                  } catch {
                    logger.debug(`Contact extraction failed for ${lead.website}`);
                  }
                }
              }
            }

            const { inserted, duplicates } = await bulkInsertLeads(result.leads);

            await supabase
              .from('scrape_jobs')
              .update({
                status: 'completed',
                leads_found: result.leads.length,
                leads_new: inserted,
                leads_duplicate: duplicates,
                leads_enriched: result.leads.filter(l => l.email).length,
                completed_at: new Date().toISOString(),
              })
              .eq('id', jobId);

            logger.info(`Job completed: ${inserted} new, ${duplicates} duplicates out of ${result.leads.length} found`);
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            logger.error(`Job failed: ${errorMsg}`);

            await supabase
              .from('scrape_jobs')
              .update({
                status: 'failed',
                error_message: errorMsg,
                completed_at: new Date().toISOString(),
              })
              .eq('id', jobId);
          }
        }
      }
    }

    await scraper.close();
  }

  await closeBrowser();
  logger.info('Scrape cron job completed');
}

runScrapeCron().catch((err) => {
  logger.error(`Scrape cron failed: ${err}`);
  process.exit(1);
});
