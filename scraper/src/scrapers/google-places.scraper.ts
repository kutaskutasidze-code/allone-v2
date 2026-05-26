import { BaseScraper, ScrapeResult } from './base.scraper.js';
import { LeadData, LeadSource } from '../database/client.js';
import { config } from '../config.js';
import { normalizeGeorgianPhone } from '../utils/phone.js';
import { calculateRelevanceScore } from '../utils/scoring.js';
import { categorizeFromGoogleTypes } from '../categorizer/rules.js';
import { logger } from '../utils/logger.js';
import { getTodayUsage } from '../utils/api-usage.js';
import { searchText, API_USAGE_KEY } from '../utils/google-places.js';

interface GooglePlace {
  displayName?: { text?: string; languageCode?: string };
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  formattedAddress?: string;
  websiteUri?: string;
  types?: string[];
  googleMapsUri?: string;
}

interface GooglePlacesResponse {
  places?: GooglePlace[];
  nextPageToken?: string;
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

    let usage = await getTodayUsage(API_USAGE_KEY);
    if (usage >= this.dailyLimit) {
      this.log(`Daily request limit reached (${usage}/${this.dailyLimit}). Stopping.`, 'info');
      return { leads: [], errors: ['Daily request limit reached'], hasMore: false };
    }

    const leads: LeadData[] = [];
    const errors: string[] = [];
    let pageToken: string | undefined;
    let pages = 0;
    const maxPages = config.googlePlaces.maxPagesPerSearch;

    do {
      if (usage >= this.dailyLimit) {
        this.log(`Daily limit hit mid-scrape (${usage}/${this.dailyLimit}). Stopping.`, 'info');
        break;
      }

      try {
        const body: Record<string, unknown> = {
          textQuery: `${query} in ${city}, ${country}`,
          languageCode: 'en',
          maxResultCount: 20,
        };
        if (pageToken) body.pageToken = pageToken;

        const { data: result, newCount } = await searchText<GooglePlacesResponse>(apiKey, body, 15000);
        usage = newCount;

        for (const place of result.places || []) {
          const lead = this.placeToLead(place, city, country);
          if (lead) leads.push(lead);
        }

        pageToken = result.nextPageToken;
        pages++;

        if (pageToken && pages < maxPages && usage < this.dailyLimit) {
          await this.delay(2000);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(msg);
        this.log(`Search error: ${msg}`, 'error');
        break;
      }
    } while (pageToken && pages < maxPages);

    this.log(`Found ${leads.length} leads for "${query}" in ${city} (${usage}/${this.dailyLimit} requests today)`);
    return { leads, errors, hasMore: !!pageToken };
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

    const pitchReasons: string[] = [];
    if (!place.websiteUri) pitchReasons.push('no_website');

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

    lead.relevance_score = calculateRelevanceScore(lead);

    return lead;
  }

  async close(): Promise<void> {
    const usage = await getTodayUsage(API_USAGE_KEY);
    logger.info(`[Google Places] Total requests today: ${usage}/${this.dailyLimit}`);
  }
}
