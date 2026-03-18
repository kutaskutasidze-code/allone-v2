import { execSync } from 'child_process';
import { unlinkSync } from 'fs';

const sites = [
  { name: 'datarooms', url: 'https://datarooms.be' },
  { name: 'fifty', url: 'https://fifty.ge' },
  { name: 'equivalenza', url: 'https://equivalenza-geo.vercel.app' },
  { name: 'chaos-concept', url: 'https://chaos-concept.vercel.app' },
  { name: 'hostwise', url: 'https://hostwise-gamma.vercel.app' },
  { name: 'kaotenders', url: 'https://kaotenders.vercel.app' },
  { name: 'innrburial', url: 'https://innrburial.com' },
  { name: 'nkdsouls', url: 'https://nkdsouls.vercel.app' },
  { name: 'sparkleclean', url: 'https://cleaning-site-henna.vercel.app' },
];

const OUTPUT_DIR = '/Users/macintoshi/projects/allone-website/public/images/work';
const WIDTH = 1440;
const HEIGHT = 900;

async function run() {
  // Dynamic import from global install
  const puppeteer = await import('/Users/macintoshi/Library/pnpm/global/5/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  for (const site of sites) {
    const page = await browser.newPage();
    await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 2 });

    try {
      console.log(`Capturing ${site.name} (${site.url})...`);
      await page.goto(site.url, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(r => setTimeout(r, 3000));

      const pngPath = `${OUTPUT_DIR}/${site.name}.png`;
      const webpPath = `${OUTPUT_DIR}/${site.name}.webp`;

      await page.screenshot({ path: pngPath, type: 'png' });

      // Convert to WebP — quality 82, max compression effort
      execSync(`cwebp -q 82 -m 6 "${pngPath}" -o "${webpPath}"`);
      unlinkSync(pngPath);

      const size = execSync(`ls -lh "${webpPath}" | awk '{print $5}'`).toString().trim();
      console.log(`  Done: ${site.name} (${size})`);
    } catch (err) {
      console.error(`  Error capturing ${site.name}:`, err.message);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  console.log('\nAll captures complete!');
}

run();
