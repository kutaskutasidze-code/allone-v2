import puppeteer from 'puppeteer';
import fs from 'fs';

async function debug() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  // Set a realistic viewport and user agent
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  console.log('Navigating to 2GIS...');
  await page.goto('https://2gis.kz/almaty/search/ресторан', {
    waitUntil: 'networkidle0',
    timeout: 60000
  });

  // Wait for dynamic content
  console.log('Waiting for content to load...');
  await new Promise(r => setTimeout(r, 5000));

  // Scroll to trigger lazy loading
  await page.evaluate(() => window.scrollBy(0, 500));
  await new Promise(r => setTimeout(r, 2000));

  // Take screenshot
  await page.screenshot({ path: '/tmp/2gis-debug.png', fullPage: false });
  console.log('Screenshot saved to /tmp/2gis-debug.png');

  // Get page content summary
  const content = await page.evaluate(() => {
    return {
      title: document.title,
      url: window.location.href,
      bodyText: document.body.innerText.slice(0, 500),
      hasCards: document.querySelectorAll('[class*="card"]').length,
      hasItems: document.querySelectorAll('[class*="item"]').length,
      hasList: document.querySelectorAll('[class*="list"]').length,
      allAnchors: document.querySelectorAll('a').length,
      firmLinks: document.querySelectorAll('a[href*="firm"]').length,
      orgLinks: document.querySelectorAll('a[href*="org"]').length
    };
  });

  console.log('\n=== Page Info ===');
  console.log('Title:', content.title);
  console.log('URL:', content.url);
  console.log('Cards:', content.hasCards);
  console.log('Items:', content.hasItems);
  console.log('Lists:', content.hasList);
  console.log('All anchors:', content.allAnchors);
  console.log('Firm links:', content.firmLinks);
  console.log('Org links:', content.orgLinks);
  console.log('\nBody text preview:', content.bodyText.slice(0, 300));

  await browser.close();
}

debug().catch(console.error);
