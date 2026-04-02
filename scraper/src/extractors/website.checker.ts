import * as cheerio from 'cheerio';
import { getPage } from '../utils/browser.js';
import { logger } from '../utils/logger.js';

export interface WebsiteAudit {
  exists: boolean;
  isHttps: boolean;
  isMobileResponsive: boolean;
  hasChat: boolean;
  hasOnlineBooking: boolean;
  hasSocialLinks: boolean;
  platform: string | null; // wordpress, wix, squarespace, custom
  loadTimeMs: number;
  pitchReasons: string[];
}

const CHAT_INDICATORS = [
  'tawk.to', 'intercom', 'drift', 'crisp', 'livechat', 'tidio',
  'zendesk', 'freshchat', 'hubspot', 'chatwoot', 'chat-widget',
  'fb-customerchat', 'whatsapp-widget', 'smartsupp',
];

const BOOKING_INDICATORS = [
  'calendly', 'acuity', 'booksy', 'fresha', 'setmore', 'simplybook',
  'book-now', 'book-appointment', 'online-booking', 'reservation',
  'დაჯავშნე', 'ჯავშანი', // Georgian: "book", "booking"
];

const PLATFORM_SIGNATURES: Record<string, string[]> = {
  wordpress: ['wp-content', 'wp-includes', 'wordpress'],
  wix: ['wix.com', 'wixsite', '_wix_browser_sess'],
  squarespace: ['squarespace.com', 'sqsp'],
  shopify: ['shopify', 'cdn.shopify'],
  webflow: ['webflow.io', 'wf-'],
  tilda: ['tilda.ws', 'tildacdn'],
};

export async function auditWebsite(websiteUrl: string): Promise<WebsiteAudit> {
  const audit: WebsiteAudit = {
    exists: false,
    isHttps: false,
    isMobileResponsive: false,
    hasChat: false,
    hasOnlineBooking: false,
    hasSocialLinks: false,
    platform: null,
    loadTimeMs: 0,
    pitchReasons: [],
  };

  try {
    const page = await getPage();
    const baseUrl = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;

    const startTime = Date.now();

    try {
      const response = await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      audit.loadTimeMs = Date.now() - startTime;
      audit.exists = response !== null && response.status() < 400;
    } catch {
      // Site doesn't load
      audit.pitchReasons.push('website_broken');
      await page.close();
      return audit;
    }

    if (!audit.exists) {
      audit.pitchReasons.push('website_broken');
      await page.close();
      return audit;
    }

    const finalUrl = page.url();
    audit.isHttps = finalUrl.startsWith('https://');

    const html = await page.content();
    const htmlLower = html.toLowerCase();
    const $ = cheerio.load(html);

    // Check mobile responsiveness (viewport meta tag)
    const viewport = $('meta[name="viewport"]').attr('content') || '';
    audit.isMobileResponsive = viewport.includes('width=device-width');

    // Check for chat widgets
    audit.hasChat = CHAT_INDICATORS.some(indicator => htmlLower.includes(indicator));

    // Check for online booking
    audit.hasOnlineBooking = BOOKING_INDICATORS.some(indicator => htmlLower.includes(indicator));

    // Check for social media links
    const hasFacebook = $('a[href*="facebook.com"]').length > 0;
    const hasInstagram = $('a[href*="instagram.com"]').length > 0;
    audit.hasSocialLinks = hasFacebook || hasInstagram;

    // Detect platform
    for (const [platform, signatures] of Object.entries(PLATFORM_SIGNATURES)) {
      if (signatures.some(sig => htmlLower.includes(sig))) {
        audit.platform = platform;
        break;
      }
    }

    // Generate pitch reasons
    if (!audit.isHttps) {
      audit.pitchReasons.push('no_https');
    }
    if (!audit.isMobileResponsive) {
      audit.pitchReasons.push('not_mobile_friendly');
    }
    if (!audit.hasChat) {
      audit.pitchReasons.push('no_chat_widget');
    }
    if (!audit.hasOnlineBooking) {
      audit.pitchReasons.push('no_online_booking');
    }
    if (!audit.hasSocialLinks) {
      audit.pitchReasons.push('no_social_links');
    }
    if (audit.loadTimeMs > 5000) {
      audit.pitchReasons.push('slow_website');
    }
    if (audit.platform === 'wix' || audit.platform === 'tilda') {
      audit.pitchReasons.push('basic_website_builder');
    }

    await page.close();
  } catch (error) {
    logger.debug(`Website audit failed for ${websiteUrl}: ${error}`);
    audit.pitchReasons.push('website_broken');
  }

  return audit;
}

/**
 * Map pitch reasons to human-readable openers for the sales team.
 */
export const PITCH_LABELS: Record<string, string> = {
  no_website: 'Has no website — needs one built',
  website_broken: 'Website is broken or down',
  no_https: 'Website not secure (no HTTPS)',
  not_mobile_friendly: 'Website not mobile-friendly',
  no_chat_widget: 'No chat widget — missing customer inquiries after hours',
  no_online_booking: 'No online booking — customers can\'t book easily',
  no_social_links: 'No social media presence on website',
  slow_website: 'Website loads slowly (5s+)',
  basic_website_builder: 'Built on Wix/Tilda — could upgrade to custom',
  new_business: 'Newly opened — likely needs digital setup',
};
