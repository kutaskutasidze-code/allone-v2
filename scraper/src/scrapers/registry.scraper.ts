import { getPage, delay, closeBrowser } from '../utils/browser.js';
import { logger } from '../utils/logger.js';

export interface RegistryCompany {
  name: string;
  registrationDate: string;
  registrationNumber: string;
}

const REGISTRY_URL = 'https://enreg.reestri.gov.ge/main.php?m=new_index&s=find_legal_person';

/**
 * Scrape newly registered companies from the Georgian public registry.
 * Uses date range + service type filter (new registration only).
 */
export async function scrapeRegistry(dateFrom: string, dateTo: string): Promise<RegistryCompany[]> {
  logger.info(`Registry scrape: ${dateFrom} to ${dateTo}`);
  const page = await getPage();
  const companies: RegistryCompany[] = [];

  try {
    await page.goto(REGISTRY_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    // Click "განცხადების ძებნა" (Application Search) tab
    await page.evaluate(() => {
      const els = document.querySelectorAll('a, div, span, li');
      for (const el of els) {
        if (el.textContent?.trim() === 'განცხადების ძებნა') {
          (el as HTMLElement).click();
          break;
        }
      }
    });
    await delay(1500);

    // Set date range (DD/MM/YYYY format)
    await page.evaluate((from: string, to: string) => {
      const fromEl = document.getElementById('s_app_from_date') as HTMLInputElement;
      const toEl = document.getElementById('s_app_to_date') as HTMLInputElement;
      if (fromEl) fromEl.value = from;
      if (toEl) toEl.value = to;
    }, dateFrom, dateTo);

    // Select service type = 1 (new registration)
    await page.evaluate(() => {
      const select = document.querySelector('select[name="s_app_tr_type"]') as HTMLSelectElement;
      if (select) select.value = '1';
    });

    // Submit form
    await page.evaluate(() => {
      const form = document.getElementById('s_search_app_form');
      const btn = form?.querySelector('button, input[type=submit]') as HTMLElement;
      if (btn) btn.click();
      else form?.dispatchEvent(new Event('submit'));
    });
    await delay(4000);

    // Extract companies from current page and paginate
    let pageNum = 1;
    while (true) {
      const pageCompanies = await page.evaluate(() => {
        const results: Array<{ name: string; regDate: string; regNum: string }> = [];
        const text = document.body.innerText;
        const lines = text.split('\n').map(l => l.trim());

        let currentRegNum = '';
        let currentRegDate = '';

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          // Registration number and date pattern: B26XXXXXX + date
          const regMatch = line.match(/^(B\d{8,})/);
          if (regMatch) {
            currentRegNum = regMatch[1];
            // Date is usually on the same line or nearby
            const dateMatch = line.match(/(\d{2}\s+\S+\s+\d{4})/);
            if (dateMatch) currentRegDate = dateMatch[1];
          }

          // Company name after "განმცხადებელი" (applicant)
          if (line.startsWith('განმცხადებელი')) {
            const name = line.replace('განმცხადებელი', '').trim();
            if (name && name.length > 1) {
              // Filter: only companies (შპს, სს prefix) and individuals
              // Skip banks and government entities
              const nameLower = name.toLowerCase();
              if (!nameLower.includes('ბანკი') && !nameLower.includes('bank')) {
                results.push({
                  name,
                  regDate: currentRegDate,
                  regNum: currentRegNum,
                });
              }
            }
          }
        }
        return results;
      });

      for (const c of pageCompanies) {
        companies.push({
          name: c.name,
          registrationDate: c.regDate,
          registrationNumber: c.regNum,
        });
      }

      logger.info(`Registry page ${pageNum}: found ${pageCompanies.length} companies (total: ${companies.length})`);

      if (pageCompanies.length === 0) break;

      // Try to find and click "next page"
      const hasNext = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'));
        for (const link of links) {
          const text = link.textContent?.trim() || '';
          // Look for next page arrow or "შემდეგი" (next) or ">" or page number
          if (text === '>' || text === '»' || text === 'შემდეგი' || text === 'Next') {
            link.click();
            return true;
          }
        }
        // Also try numbered pagination
        const pageLinks = document.querySelectorAll('.pagination a, .pager a, [class*=page] a');
        for (const pl of pageLinks) {
          const num = parseInt(pl.textContent?.trim() || '0');
          if (num > 0) {
            // Find current page and click next
            const active = document.querySelector('.pagination .active, .pager .active, [class*=current]');
            const currentPage = parseInt(active?.textContent?.trim() || '1');
            if (num === currentPage + 1) {
              (pl as HTMLElement).click();
              return true;
            }
          }
        }
        return false;
      });

      if (!hasNext) break;

      await delay(3000);
      pageNum++;

      // Safety limit
      if (pageNum > 50) {
        logger.warn('Registry scraper: hit 50 page limit, stopping');
        break;
      }
    }

    await page.close();
  } catch (err) {
    logger.error(`Registry scrape failed: ${err}`);
    try { await page.close(); } catch {}
  }

  // Deduplicate by name
  const seen = new Set<string>();
  const unique = companies.filter(c => {
    const key = c.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  logger.info(`Registry scrape done: ${unique.length} unique companies from ${dateFrom} to ${dateTo}`);
  return unique;
}
