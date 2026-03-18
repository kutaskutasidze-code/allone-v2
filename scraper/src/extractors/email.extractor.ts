import * as cheerio from 'cheerio';
import { getPage, delay } from '../utils/browser.js';
import { logger } from '../utils/logger.js';

// Email regex pattern
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Common contact page paths
const CONTACT_PATHS = [
  '/contact',
  '/contacts',
  '/contact-us',
  '/about',
  '/about-us',
  '/kontakt',
  '/kontakty',
  '/связаться',
  '/iletisim',
  '/haberlesme',
];

export interface ExtractedContact {
  emails: string[];
  phones: string[];
  socialLinks: {
    linkedin?: string;
    facebook?: string;
    instagram?: string;
  };
}

export async function extractContactInfo(websiteUrl: string): Promise<ExtractedContact> {
  const result: ExtractedContact = {
    emails: [],
    phones: [],
    socialLinks: {},
  };

  try {
    const page = await getPage();

    // Normalize URL
    const baseUrl = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;

    // Visit main page first
    try {
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      const mainContent = await page.content();
      extractFromHtml(mainContent, result);
    } catch (err) {
      logger.debug(`Failed to load main page: ${baseUrl}`);
    }

    // Try contact pages if no email found
    if (result.emails.length === 0) {
      for (const path of CONTACT_PATHS) {
        try {
          const contactUrl = new URL(path, baseUrl).toString();
          await page.goto(contactUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
          const contactContent = await page.content();
          extractFromHtml(contactContent, result);

          if (result.emails.length > 0) break;

          await delay(500);
        } catch {
          // Contact page doesn't exist, continue
        }
      }
    }

    await page.close();
  } catch (error) {
    logger.error(`Failed to extract contact from ${websiteUrl}: ${error}`);
  }

  // Deduplicate
  result.emails = [...new Set(result.emails)];
  result.phones = [...new Set(result.phones)];

  return result;
}

function extractFromHtml(html: string, result: ExtractedContact): void {
  const $ = cheerio.load(html);

  // Extract emails
  const text = $.text();
  const emailMatches = text.match(EMAIL_REGEX) || [];

  // Filter out common non-contact emails
  const filteredEmails = emailMatches.filter(email => {
    const lower = email.toLowerCase();
    return !lower.includes('example') &&
           !lower.includes('domain') &&
           !lower.includes('email') &&
           !lower.includes('test') &&
           !lower.includes('noreply') &&
           !lower.includes('no-reply');
  });

  result.emails.push(...filteredEmails);

  // Also check href attributes for mailto links
  $('a[href^="mailto:"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) {
      const email = href.replace('mailto:', '').split('?')[0];
      if (email && !result.emails.includes(email)) {
        result.emails.push(email);
      }
    }
  });

  // Extract phone numbers (common formats)
  const phoneRegex = /[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,3}[)]?[-\s\.]?[0-9]{3,4}[-\s\.]?[0-9]{3,4}/g;
  const phoneMatches = text.match(phoneRegex) || [];
  result.phones.push(...phoneMatches.filter(p => p.length >= 9));

  // Extract social links
  $('a[href*="linkedin.com"]').first().each((_, el) => {
    result.socialLinks.linkedin = $(el).attr('href');
  });

  $('a[href*="facebook.com"]').first().each((_, el) => {
    result.socialLinks.facebook = $(el).attr('href');
  });

  $('a[href*="instagram.com"]').first().each((_, el) => {
    result.socialLinks.instagram = $(el).attr('href');
  });
}
