#!/usr/bin/env node
import puppeteer from 'puppeteer-core';

const url = process.argv[2] || 'http://localhost:3001/hero-experiment';
const output = process.argv[3] || '/tmp/screenshot.png';
const scrollPercent = parseFloat(process.argv[4] || '0');

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--no-sandbox', '--window-size=1440,900'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });

// Wait for canvas/animations to render
await new Promise(r => setTimeout(r, 2000));

// Scroll if requested
if (scrollPercent > 0) {
  const scrollHeight = await page.evaluate(() => document.body.scrollHeight - window.innerHeight);
  await page.evaluate((y) => window.scrollTo(0, y), scrollHeight * scrollPercent / 100);
  await new Promise(r => setTimeout(r, 500));
}

await page.screenshot({ path: output, fullPage: false });
console.log(`Screenshot saved to ${output}`);

await browser.close();
