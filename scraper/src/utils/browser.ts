import puppeteer, { Browser, Page } from 'puppeteer';
import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { config } from '../config.js';
import { logger } from './logger.js';

// Use stealth plugin to avoid detection
puppeteerExtra.use(StealthPlugin());

let browserInstance: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.connected) {
    logger.info('Launching new browser instance');
    browserInstance = await puppeteerExtra.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080',
      ],
    });
  }
  return browserInstance;
}

export async function getPage(): Promise<Page> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  // Set viewport and user agent
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );

  // Set reasonable timeout
  page.setDefaultTimeout(30000);

  return page;
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
    logger.info('Browser closed');
  }
}

export async function delay(ms: number = config.scraper.delayMs): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
