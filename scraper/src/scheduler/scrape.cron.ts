import { logger } from '../utils/logger.js';
import { getSupabase, LeadSource, ScrapeJob } from '../database/client.js';
import { bulkInsertLeads } from '../database/leads.repo.js';
import { TwoGisScraper } from '../scrapers/2gis.scraper.js';
import { extractContactInfo } from '../extractors/email.extractor.js';
import { categorizeCompany } from '../categorizer/rules.js';
import { closeBrowser } from '../utils/browser.js';
import { COUNTRIES, SEARCH_QUERIES, type CountryCode, type ServiceType } from '../config.js';

async function runScrapeCron() {
  logger.info('Starting scrape cron job...');

  const supabase = getSupabase();

  // Get active sources
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
    // Only process 2GIS for now (can add more scrapers later)
    if (source.source_type !== 'maps') continue;
    if (!source.name.includes('2GIS')) continue;

    const scraper = new TwoGisScraper(source);

    for (const countryCode of source.countries as CountryCode[]) {
      const country = COUNTRIES[countryCode];
      if (!country) continue;

      for (const city of country.cities) {
        for (const [serviceType, queries] of Object.entries(SEARCH_QUERIES)) {
          // Pick a random query for this run
          const query = queries[Math.floor(Math.random() * queries.length)];

          // Create scrape job
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
            logger.info(`Scraping ${source.name}: ${query} in ${city}, ${countryCode}`);

            const result = await scraper.scrape(query, city, countryCode);

            // Enrich leads with contact info and categorization
            for (const lead of result.leads) {
              // Categorize
              const { service, score } = categorizeCompany(
                lead.name,
                lead.description || '',
                lead.industry || ''
              );
              lead.matched_service = service || serviceType;
              lead.relevance_score = score;

              // Extract contact info if website available
              if (lead.website) {
                try {
                  const contact = await extractContactInfo(lead.website);
                  if (contact.emails.length > 0) {
                    lead.email = contact.emails[0];
                  }
                  if (contact.phones.length > 0 && !lead.phone) {
                    lead.phone = contact.phones[0];
                  }
                  if (contact.socialLinks.linkedin) {
                    lead.linkedin_url = contact.socialLinks.linkedin;
                  }
                  if (contact.socialLinks.facebook) {
                    lead.facebook_url = contact.socialLinks.facebook;
                  }
                  if (contact.socialLinks.instagram) {
                    lead.instagram_url = contact.socialLinks.instagram;
                  }
                } catch (err) {
                  logger.debug(`Contact extraction failed for ${lead.website}`);
                }
              }
            }

            // Insert leads
            const { inserted, duplicates } = await bulkInsertLeads(result.leads);

            // Update job status
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

            // Update source stats
            await supabase
              .from('lead_sources')
              .update({
                last_scraped_at: new Date().toISOString(),
                leads_count: supabase.rpc('increment', { x: inserted }),
              })
              .eq('id', source.id);

            logger.info(`Job completed: ${inserted} new leads, ${duplicates} duplicates`);

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

// Run immediately
runScrapeCron().catch((err) => {
  logger.error(`Scrape cron failed: ${err}`);
  process.exit(1);
});
