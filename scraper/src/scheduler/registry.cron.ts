import { logger } from '../utils/logger.js';
import { getSupabase, LeadData } from '../database/client.js';
import { insertLead } from '../database/leads.repo.js';
import { scrapeRegistry } from '../scrapers/registry.scraper.js';
import { normalizeGeorgianPhone } from '../utils/phone.js';
import { calculateRelevanceScore } from '../utils/scoring.js';
import { closeBrowser } from '../utils/browser.js';
import { config } from '../config.js';
import { getTodayUsage, getMonthUsage } from '../utils/api-usage.js';
import { searchText, API_USAGE_KEY } from '../utils/google-places.js';

interface GooglePlace {
  displayName?: { text?: string };
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  formattedAddress?: string;
  websiteUri?: string;
  types?: string[];
  googleMapsUri?: string;
}

interface LookupResult {
  place: GooglePlace | null;
  newCount: number | null;
}

async function lookupOnGooglePlaces(companyName: string): Promise<LookupResult> {
  const apiKey = config.googlePlaces.apiKey;
  if (!apiKey) return { place: null, newCount: null };

  try {
    const { data, newCount } = await searchText<{ places?: GooglePlace[] }>(
      apiKey,
      { textQuery: `${companyName} Georgia`, languageCode: 'en', maxResultCount: 1 },
      10000,
    );
    return { place: data.places?.[0] || null, newCount };
  } catch {
    return { place: null, newCount: null };
  }
}

function formatDateForRegistry(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

async function getLastProcessedDate(supabase: ReturnType<typeof getSupabase>): Promise<Date> {
  // Check the most recent registry scrape job
  const { data } = await supabase
    .from('scrape_jobs')
    .select('search_query, completed_at')
    .ilike('search_query', 'Registry:%')
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (data?.search_query) {
    // Parse "Registry: DD/MM/YYYY to DD/MM/YYYY"
    const match = data.search_query.match(/to (\d{2})\/(\d{2})\/(\d{4})/);
    if (match) {
      const [, dd, mm, yyyy] = match;
      return new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
    }
  }

  // Default: 3 months ago
  const d = new Date();
  d.setMonth(d.getMonth() - 3);
  return d;
}

async function runRegistryCron() {
  logger.info('Starting registry scraper cron...');
  const supabase = getSupabase();

  const lastDate = await getLastProcessedDate(supabase);
  const today = new Date();

  // Scrape in 7-day chunks to avoid overwhelming the registry
  const chunkDays = 7;
  let from = new Date(lastDate);
  from.setDate(from.getDate() + 1); // Start from day after last processed

  if (from >= today) {
    logger.info('Registry: already up to date, nothing to scrape');
    await closeBrowser();
    return;
  }

  let to = new Date(from);
  to.setDate(to.getDate() + chunkDays - 1);
  if (to > today) to = new Date(today);

  const dateFrom = formatDateForRegistry(from);
  const dateTo = formatDateForRegistry(to);

  // Create scrape job
  const { data: job } = await supabase
    .from('scrape_jobs')
    .insert({
      source_id: null,
      status: 'running',
      search_query: `Registry: ${dateFrom} to ${dateTo}`,
      country: 'GE',
      city: 'Tbilisi',
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  const jobId = job?.id;

  try {
    // Step 1: Scrape registry (free, no API cost)
    const companies = await scrapeRegistry(dateFrom, dateTo);
    logger.info(`Registry: found ${companies.length} new registrations from ${dateFrom} to ${dateTo}`);

    // Step 2: Look up each company on Google Places (costs 1 request each)
    const dailyBudget = config.googlePlaces.dailyBudgetRequests;
    const monthlyBudget = config.googlePlaces.monthlyBudgetRequests;
    let inserted = 0;
    let withPhone = 0;
    let duplicates = 0;
    let lookupsThisRun = 0;
    let usage = await getTodayUsage(API_USAGE_KEY);
    let monthUsage = await getMonthUsage(API_USAGE_KEY);

    for (const company of companies) {
      if (monthUsage >= monthlyBudget) {
        logger.info(`Registry: hit monthly Google Places free-tier cap (${monthUsage}/${monthlyBudget}). Stopping until next month.`);
        break;
      }
      if (usage >= dailyBudget) {
        logger.info(`Registry: hit daily Google Places budget (${usage}/${dailyBudget}). Remaining companies saved for next run.`);
        break;
      }

      // Clean company name for Google search
      let searchName = company.name;
      searchName = searchName.replace(/^შპს\s*/i, '').replace(/^სს\s*/i, '').replace(/^ი\/მ\s*/i, '');

      const { place, newCount } = await lookupOnGooglePlaces(searchName);
      if (newCount !== null) {
        usage = newCount;
        monthUsage++;
      }
      lookupsThisRun++;

      const rawPhone = place?.internationalPhoneNumber || place?.nationalPhoneNumber;
      const phone = rawPhone ? normalizeGeorgianPhone(rawPhone) : null;

      const tags: string[] = ['newly_registered'];
      if (!place?.websiteUri) tags.push('no_website');

      // Build source URL from registration number
      const sourceUrl = company.registrationNumber
        ? `https://enreg.reestri.gov.ge/main.php?m=new_index&s=find_legal_person&reg_code=${company.registrationNumber}`
        : (place?.googleMapsUri || undefined);

      // Use Google Places name if found (usually better formatted), fall back to registry name
      const displayName = place?.displayName?.text || company.name;

      // Only insert if Google Places found a match with phone
      // Individual names without a Google business listing are not useful leads
      if (!place || !phone) {
        logger.debug(`Registry: no Google match for "${company.name}", skipping`);
        continue;
      }

      const lead: LeadData = {
        name: displayName,
        company: company.name,
        phone,
        website: place.websiteUri || undefined,
        address: place.formattedAddress || undefined,
        city: 'Tbilisi',
        country: 'GE',
        source_url: sourceUrl,
        matched_service: !place.websiteUri ? 'website' : undefined,
        tags,
        description: `Registered: ${company.registrationDate}. Reg#: ${company.registrationNumber}`,
        is_scraped: true,
      };

      lead.relevance_score = calculateRelevanceScore(lead);

      const result = await insertLead(lead);
      if (result.success) {
        inserted++;
        if (phone) withPhone++;
      }
      if (result.isDuplicate) duplicates++;

      // Small delay between Google Places requests
      await new Promise(r => setTimeout(r, 200));
    }

    // Update job
    if (jobId) {
      await supabase
        .from('scrape_jobs')
        .update({
          status: 'completed',
          leads_found: companies.length,
          leads_new: inserted,
          leads_duplicate: duplicates,
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId);
    }

    logger.info(`Registry cron done: ${inserted} new leads (${withPhone} with phone), ${duplicates} duplicates, ${lookupsThisRun} Google lookups`);
  } catch (err) {
    logger.error(`Registry cron failed: ${err}`);
    if (jobId) {
      await supabase
        .from('scrape_jobs')
        .update({
          status: 'failed',
          error_message: String(err),
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId);
    }
  }

  await closeBrowser();
}

runRegistryCron().catch((err) => {
  logger.error(`Registry cron fatal: ${err}`);
  process.exit(1);
});
