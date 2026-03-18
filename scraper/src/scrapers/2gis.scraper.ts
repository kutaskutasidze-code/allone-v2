import { BaseScraper, ScrapeResult } from './base.scraper.js';
import { LeadData } from '../database/client.js';
import { config } from '../config.js';

export class TwoGisScraper extends BaseScraper {
  getName(): string {
    return '2GIS';
  }

  async scrape(query: string, city: string, country: string): Promise<ScrapeResult> {
    const leads: LeadData[] = [];
    const errors: string[] = [];

    try {
      const page = await this.getPage();

      // Set realistic viewport and user agent
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      // Determine the correct 2GIS domain based on country
      const domain = country === 'KZ' ? '2gis.kz' : country === 'UZ' ? '2gis.uz' : '2gis.ru';

      // Build search URL - 2GIS format: /city/search/query
      const citySlug = this.getCitySlug(city, country);
      const searchUrl = `https://${domain}/${citySlug}/search/${encodeURIComponent(query)}`;

      this.log(`Searching: ${searchUrl}`);

      await page.goto(searchUrl, { waitUntil: 'networkidle0', timeout: 60000 });
      await this.delay(5000); // Wait for dynamic content

      // Scroll to load more results
      for (let i = 0; i < 5; i++) {
        await page.evaluate(() => window.scrollBy(0, 500));
        await this.delay(1000);
      }

      // Extract businesses using the firm link pattern
      const businesses = await page.evaluate(() => {
        const results: Array<{
          name: string;
          firmId: string;
          phone?: string;
          address?: string;
          website?: string;
          category?: string;
          rating?: string;
        }> = [];

        // Find all links to firm pages
        const firmLinks = document.querySelectorAll('a[href*="/firm/"]');
        const seenIds = new Set<string>();

        firmLinks.forEach((link) => {
          const href = (link as HTMLAnchorElement).href;
          const firmIdMatch = href.match(/\/firm\/(\d+)/);
          if (!firmIdMatch) return;

          const firmId = firmIdMatch[1];
          if (seenIds.has(firmId)) return;
          seenIds.add(firmId);

          const name = link.textContent?.trim();
          if (!name || name.length < 2) return;

          // Walk up to find the card container (usually 5-7 levels up)
          let container: HTMLElement | null = link as HTMLElement;
          for (let i = 0; i < 7; i++) {
            container = container?.parentElement || null;
            if (!container) break;
          }

          const containerText = container?.innerText || '';

          // Extract phone number
          const phoneMatch = containerText.match(/\+7[\s\d\-\(\)]{10,}/);

          // Extract address (usually contains street names or district names)
          const addressLines = containerText.split('\n').filter(
            line => line.includes('ул.') || line.includes('пр.') ||
                    line.includes('мкр') || line.includes('просп') ||
                    /\d+[а-яА-Яa-zA-Z]?$/.test(line.trim())
          );

          // Extract rating
          const ratingMatch = containerText.match(/(\d[.,]\d)\s*★?/);

          // Look for website link
          let website = '';
          const websiteLink = container?.querySelector('a[target="_blank"]:not([href*="2gis"])') as HTMLAnchorElement;
          if (websiteLink?.href && !websiteLink.href.includes('2gis')) {
            website = websiteLink.href;
          }

          results.push({
            name,
            firmId,
            phone: phoneMatch?.[0]?.trim(),
            address: addressLines[0]?.trim(),
            website,
            rating: ratingMatch?.[1],
          });
        });

        return results;
      });

      this.log(`Found ${businesses.length} businesses`);

      // Convert to LeadData format
      for (const biz of businesses.slice(0, config.scraper.maxLeadsPerSearch)) {
        const lead: LeadData = {
          name: biz.name,
          company: biz.name,
          phone: biz.phone ? this.normalizePhone(biz.phone) : undefined,
          website: biz.website ? this.normalizeUrl(biz.website) : undefined,
          address: biz.address,
          city,
          country,
          source_id: this.source.id,
          source_url: `https://${country === 'KZ' ? '2gis.kz' : '2gis.uz'}/firm/${biz.firmId}`,
          is_scraped: true,
        };

        // Only add leads with at least a phone or website
        if (lead.phone || lead.website) {
          leads.push(lead);
        }
      }

      this.log(`Extracted ${leads.length} leads with contact info`);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.log(`Scrape error: ${errorMsg}`, 'error');
      errors.push(errorMsg);
    }

    return {
      leads,
      errors,
      hasMore: leads.length >= config.scraper.maxLeadsPerSearch,
    };
  }

  private getCitySlug(city: string, country: string): string {
    // Map city names to 2GIS URL slugs
    const cityMap: Record<string, string> = {
      // Kazakhstan
      'Almaty': 'almaty',
      'Astana': 'astana',
      'Shymkent': 'shymkent',
      'Aktobe': 'aktobe',
      'Karaganda': 'karaganda',
      'Atyrau': 'atyrau',
      // Uzbekistan
      'Tashkent': 'tashkent',
      'Samarkand': 'samarkand',
      'Bukhara': 'bukhara',
      'Namangan': 'namangan',
      // Russia (fallback)
      'Moscow': 'moscow',
      'Saint Petersburg': 'spb',
    };

    return cityMap[city] || city.toLowerCase().replace(/\s+/g, '');
  }
}
