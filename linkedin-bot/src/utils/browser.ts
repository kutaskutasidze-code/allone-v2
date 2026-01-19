import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import type { Browser, Page } from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { config } from '../config.js';
import { logger } from './logger.js';

// Add stealth plugin
puppeteerExtra.use(StealthPlugin());

let browser: Browser | null = null;
let page: Page | null = null;

const COOKIES_PATH = path.join(config.sessionPath, 'cookies.json');
const LOCAL_STORAGE_PATH = path.join(config.sessionPath, 'localStorage.json');

export async function initBrowser(): Promise<Page> {
  if (page) return page;

  // Ensure session directory exists
  if (!fs.existsSync(config.sessionPath)) {
    fs.mkdirSync(config.sessionPath, { recursive: true });
  }

  logger.info('Launching browser...');

  browser = await puppeteerExtra.launch({
    headless: config.headless,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-infobars',
      '--window-size=1920,1080',
    ],
    defaultViewport: { width: 1920, height: 1080 },
  });

  page = await browser.newPage();

  // Set realistic user agent
  await page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );

  // Set extra headers
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
  });

  // Load saved cookies if available
  await loadSession();

  return page;
}

export async function saveSession(): Promise<void> {
  if (!page) return;

  try {
    // Save cookies
    const cookies = await page.cookies();
    fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2));

    // Save localStorage
    const localStorage = await page.evaluate(() => {
      const data: Record<string, string> = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key) {
          data[key] = window.localStorage.getItem(key) || '';
        }
      }
      return data;
    });
    fs.writeFileSync(LOCAL_STORAGE_PATH, JSON.stringify(localStorage, null, 2));

    logger.info('Session saved');
  } catch (error) {
    logger.warn(`Failed to save session: ${error}`);
  }
}

async function loadSession(): Promise<void> {
  if (!page) return;

  try {
    // Load cookies
    if (fs.existsSync(COOKIES_PATH)) {
      const cookies = JSON.parse(fs.readFileSync(COOKIES_PATH, 'utf-8'));
      await page.setCookie(...cookies);
      logger.info('Loaded saved cookies');
    }

    // Navigate to LinkedIn first, then set localStorage
    await page.goto('https://www.linkedin.com', { waitUntil: 'networkidle2' });

    // Load localStorage
    if (fs.existsSync(LOCAL_STORAGE_PATH)) {
      const localStorage = JSON.parse(fs.readFileSync(LOCAL_STORAGE_PATH, 'utf-8'));
      await page.evaluate((data: Record<string, string>) => {
        for (const [key, value] of Object.entries(data)) {
          window.localStorage.setItem(key, value);
        }
      }, localStorage);
      logger.info('Loaded saved localStorage');
    }
  } catch (error) {
    logger.warn(`Failed to load session: ${error}`);
  }
}

export async function closeBrowser(): Promise<void> {
  if (page) {
    await saveSession();
  }

  if (browser) {
    await browser.close();
    browser = null;
    page = null;
    logger.info('Browser closed');
  }
}

export async function getPage(): Promise<Page> {
  if (!page) {
    return initBrowser();
  }
  return page;
}

export async function isLoggedIn(): Promise<boolean> {
  const p = await getPage();

  try {
    await p.goto('https://www.linkedin.com/feed/', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Check if we're on the feed or redirected to login
    const url = p.url();
    const loggedIn = url.includes('/feed') && !url.includes('login');

    if (loggedIn) {
      logger.info('Already logged in');
    }

    return loggedIn;
  } catch (error) {
    return false;
  }
}
