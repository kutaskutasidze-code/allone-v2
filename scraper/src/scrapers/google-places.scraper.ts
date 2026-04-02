import { BaseScraper, ScrapeResult } from './base.scraper.js';
import { LeadData, LeadSource } from '../database/client.js';
import { getSupabase } from '../database/client.js';
import { config } from '../config.js';
import { normalizeGeorgianPhone } from '../utils/phone.js';
import { calculateRelevanceScore } from '../utils/scoring.js';
import { categorizeFromGoogleTypes } from '../categorizer/rules.js';
import { logger } from '../utils/logger.js';

interface GooglePlace {
  displayName?: { text?: string; languageCode?: string };
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  formattedAddress?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  types?: string[];
  googleMapsUri?: string;
}

interface GooglePlacesResponse {
  places?: GooglePlace[];
  nextPageToken?: string;
}

const FIELD_MASK = 'places.displayName,places.nationalPhoneNumber,places.internationalPhoneNumber,places.formattedAddress,places.websiteUri,places.rating,places.userRatingCount,places.types,places.googleMapsUri';

// Track requests in memory for this process run
let requestsThisRun = 0;

/**
 * Check how many Google Places requests have been made today.
 * Uses scrape_jobs table as a proxy: count jobs with source matching Google Places from today.
 * Returns remaining budget.
 */
async function getDailyRequestCount(): Promise<number> {
  const supabase = getSupabase();
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const { data } = await supabase
    .from('scrape_jobs')
    .select('leads_found')
    .ilike('search_query', '%Google Places%')
    .gte('started_at', todayStart.toISOString());

  // Each job roughly = 1 API request per page. Sum leads_found as a rough count.
  // But more accurately, we track via the metadata we'll store.
  return (data || []).length;
}

export class GooglePlacesScraper extends BaseScraper {
  private dailyLimit: number;

  constructor(source: LeadSource) {
    super(source);
    this.dailyLimit = config.googlePlaces.dailyBudgetRequests;
  }

  getName(): string {
    return 'Google Places';
  }

  async scrape(query: string, city: string, country: string): Promise<ScrapeResult> {
    const apiKey = config.googlePlaces.apiKey;
    if (!apiKey) {
      return { leads: [], errors: ['GOOGLE_PLACES_API_KEY not configured'], hasMore: false };
    }

    // Hard daily limit check
    const jobsToday = await getDailyRequestCount();
    const totalRequestsEstimate = jobsToday + requestsThisRun;
    if (totalRequestsEstimate >= this.dailyLimit) {
      this.log(`Daily request limit reached (${totalRequestsEstimate}/${this.dailyLimit}). Stopping.`, 'info');
      return { leads: [], errors: ['Daily request limit reached'], hasMore: false };
    }

    const leads: LeadData[] = [];
    const errors: string[] = [];
    let pageToken: string | undefined;
    let pages = 0;
    const maxPages = config.googlePlaces.maxPagesPerSearch;

    do {
      // Check limit before every request
      if (requestsThisRun + jobsToday >= this.dailyLimit) {
        this.log(`Daily limit hit mid-scrape. Stopping.`, 'info');
        break;
      }

      try {
        const result = await this.searchPlaces(query, city, country, apiKey, pageToken);
        requestsThisRun++;

        for (const place of result.places || []) {
          const lead = this.placeToLead(place, city, country);
          if (lead) leads.push(lead);
        }

        pageToken = result.nextPageToken;
        pages++;

        if (pageToken && pages < maxPages) {
          await this.delay(2000);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(msg);
        this.log(`Search error: ${msg}`, 'error');
        break;
      }
    } while (pageToken && pages < maxPages);

    this.log(`Found ${leads.length} leads for "${query}" in ${city} (${requestsThisRun} requests this run)`);
    return { leads, errors, hasMore: !!pageToken };
  }

  private async searchPlaces(
    query: string,
    city: string,
    country: string,
    apiKey: string,
    pageToken?: string
  ): Promise<GooglePlacesResponse> {
    const body: Record<string, unknown> = {
      textQuery: `${query} in ${city}, ${country}`,
      languageCode: 'en',
      maxResultCount: 20,
    };

    if (pageToken) {
      body.pageToken = pageToken;
    }

    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Google Places API ${res.status}: ${text}`);
    }

    return res.json();
  }

  // Business types that will never buy web dev, chatbots, or automation
  private static EXCLUDED_TYPES = new Set([
    'gas_station', 'atm', 'parking', 'church', 'mosque', 'cemetery',
    'embassy', 'government_office', 'local_government_office', 'post_office',
    'police', 'fire_station', 'library', 'school', 'primary_school',
    'secondary_school', 'bus_station', 'train_station', 'subway_station',
    'park', 'playground', 'stadium', 'museum', 'movie_theater',
    'car_wash', 'laundry', 'locksmith', 'electrician', 'plumber',
    'roofing_contractor', 'painter', 'convenience_store', 'liquor_store',
  ]);

  private placeToLead(place: GooglePlace, city: string, country: string): LeadData | null {
    const name = place.displayName?.text;
    if (!name) return null;

    // Skip business types that won't need our services
    const types = place.types || [];
    if (types.some(t => GooglePlacesScraper.EXCLUDED_TYPES.has(t))) return null;

    const rawPhone = place.internationalPhoneNumber || place.nationalPhoneNumber;
    const phone = rawPhone ? normalizeGeorgianPhone(rawPhone) : null;

    // Skip leads without phone (sales team needs to cold call)
    if (!phone) return null;

    const serviceMatch = categorizeFromGoogleTypes(types);

    // Generate pitch reasons based on what we know at scrape time
    const pitchReasons: string[] = [];
    if (!place.websiteUri) pitchReasons.push('no_website');
    if (!place.rating || place.rating === 0) pitchReasons.push('new_business');
    if (place.userRatingCount !== undefined && place.userRatingCount < 5 && place.rating) pitchReasons.push('new_business');

    // No website = always pitch website first, regardless of business type
    const service = !place.websiteUri ? 'website' : (serviceMatch.service || undefined);

    const lead: LeadData = {
      name,
      company: name,
      phone,
      website: place.websiteUri || undefined,
      address: place.formattedAddress || undefined,
      city,
      country,
      source_url: place.googleMapsUri || undefined,
      matched_service: service,
      tags: pitchReasons.length > 0 ? pitchReasons : undefined,
      is_scraped: true,
    };

    lead.relevance_score = calculateRelevanceScore({
      ...lead,
      rating: place.rating,
      userRatingCount: place.userRatingCount,
    });

    return lead;
  }

  async close(): Promise<void> {
    logger.info(`[Google Places] Total requests this run: ${requestsThisRun}`);
  }
}
