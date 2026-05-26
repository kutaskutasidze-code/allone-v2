import { getPage, delay } from '../utils/browser.js';
import { logger } from '../utils/logger.js';

export interface RegistryCompany {
  name: string;
  registrationDate: string;
  registrationNumber: string;
}

const REGISTRY_URL = 'https://enreg.reestri.gov.ge/_dea/main.php?m=new_index';

const SKIP_NAMES = ['საქართველოს ბანკი', 'თიბისი', 'ლიბერთი', 'ბაზისბანკი', 'კრედო', 'პროკრედიტ',
  'სახელმწიფო', 'სამინისტრო', 'მასტერქარდ', 'მაგთი', 'სილქნეტ', 'ჯეოსელ'];

export async function scrapeRegistry(dateFrom: string, dateTo: string): Promise<RegistryCompany[]> {
  logger.info(`Registry scrape: ${dateFrom} to ${dateTo}`);
  const page = await getPage();
  const companies: RegistryCompany[] = [];

  try {
    await page.goto(REGISTRY_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    // Click Application Search tab
    await page.evaluate(() => {
      const els = document.querySelectorAll('a, div, span, li');
      for (const el of els) {
        if (el.textContent?.trim() === 'განცხადების ძებნა') { (el as HTMLElement).click(); break; }
      }
    });
    await delay(1500);

    // Set date range
    await page.evaluate((from: string, to: string) => {
      (document.getElementById('s_app_from_date') as HTMLInputElement).value = from;
      (document.getElementById('s_app_to_date') as HTMLInputElement).value = to;
    }, dateFrom, dateTo);

    // Select service type = 1 (new entity registration) -- must use page.select()
    await page.select('select[name=s_app_tr_type]', '1');

    // Submit
    await page.evaluate(() => {
      const form = document.getElementById('s_search_app_form');
      const btn = form?.querySelector('button, input[type=submit]') as HTMLElement;
      if (btn) btn.click();
    });
    await delay(4000);

    // Check total count
    const totalText = await page.evaluate(() => {
      const match = document.body.innerText.match(/სულ\s+(\d+)/);
      return match ? match[1] : '0';
    });
    logger.info(`Registry: ${totalText} total new registrations in period`);

    let pageNum = 1;
    while (true) {
      const pageResults = await page.evaluate((skip: string[]) => {
        const results: Array<{ name: string; regDate: string; regNum: string }> = [];
        const text = document.body.innerText;
        const lines = text.split('\n').map(l => l.trim());

        let currentRegNum = '';
        let currentRegDate = '';

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          const regMatch = line.match(/^(B\d{8,})/);
          if (regMatch) {
            currentRegNum = regMatch[1];
            if (i + 1 < lines.length) {
              const dateMatch = lines[i + 1].match(/(\d{1,2}\s+\S+\s+\d{4})/);
              if (dateMatch) currentRegDate = dateMatch[1];
            }
            continue;
          }

          if (!line.startsWith('განმცხადებელი')) continue;
          const name = line.replace('განმცხადებელი', '').trim();
          if (!name || name.length < 2) continue;

          const nameLower = name.toLowerCase();
          if (skip.some(s => nameLower.includes(s.toLowerCase()))) continue;

          results.push({ name, regDate: currentRegDate, regNum: currentRegNum });
        }
        return results;
      }, SKIP_NAMES);

      for (const c of pageResults) {
        companies.push({ name: c.name, registrationDate: c.regDate, registrationNumber: c.regNum });
      }

      logger.info(`Registry page ${pageNum}: ${pageResults.length} entries (total: ${companies.length})`);

      // Pagination
      const hasNext = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'));
        for (const link of links) {
          const t = link.textContent?.trim();
          if (t === '>' || t === '»' || t === 'შემდეგი') { link.click(); return true; }
        }
        return false;
      });

      if (!hasNext) break;
      await delay(3000);
      pageNum++;
      if (pageNum > 100) break;
    }

    await page.close();
  } catch (err) {
    logger.error(`Registry scrape failed: ${err}`);
    try { await page.close(); } catch {}
  }

  // Deduplicate
  const seen = new Set<string>();
  const unique = companies.filter(c => {
    const key = c.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  logger.info(`Registry done: ${unique.length} unique new registrations from ${dateFrom} to ${dateTo}`);
  return unique;
}
