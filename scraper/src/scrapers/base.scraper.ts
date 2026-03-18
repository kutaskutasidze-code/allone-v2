import { Page } from 'puppeteer';
import { getPage, delay, closeBrowser } from '../utils/browser.js';
import { logger } from '../utils/logger.js';
import { LeadData, LeadSource } from '../database/client.js';
import { config } from '../config.js';

export interface ScrapeResult {
  leads: LeadData[];
  errors: string[];
  hasMore: boolean;
}

export abstract class BaseScraper {
  protected source: LeadSource;
  protected page: Page | null = null;

  constructor(source: LeadSource) {
    this.source = source;
  }

  abstract getName(): string;
  abstract scrape(query: string, city: string, country: string): Promise<ScrapeResult>;

  protected async getPage(): Promise<Page> {
    if (!this.page) {
      this.page = await getPage();
    }
    return this.page;
  }

  protected async delay(ms?: number): Promise<void> {
    await delay(ms || config.scraper.delayMs);
  }

  protected log(message: string, level: 'info' | 'debug' | 'error' = 'info'): void {
    logger[level](`[${this.getName()}] ${message}`);
  }

  async close(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }
  }

  protected normalizePhone(phone: string): string {
    return phone.replace(/[^0-9+]/g, '');
  }

  protected normalizeUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `https://${url}`;
  }
}
