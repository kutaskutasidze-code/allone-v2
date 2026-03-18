import puppeteer from 'puppeteer';

async function extract() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  console.log('Navigating to 2GIS...');
  await page.goto('https://2gis.kz/almaty/search/ресторан', {
    waitUntil: 'networkidle0',
    timeout: 60000
  });

  await new Promise(r => setTimeout(r, 5000));

  // Scroll a few times to load more
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => window.scrollBy(0, 500));
    await new Promise(r => setTimeout(r, 1000));
  }

  // Extract all firm links and their context
  const firms = await page.evaluate(() => {
    const results = [];
    const links = document.querySelectorAll('a[href*="/firm/"]');

    links.forEach(link => {
      const href = link.href;
      const firmId = href.match(/\/firm\/(\d+)/)?.[1];

      // Walk up to find the card container
      let container = link;
      for (let i = 0; i < 5; i++) {
        container = container.parentElement;
        if (!container) break;
      }

      // Try to find phone and other info near this link
      const containerText = container?.innerText || '';
      const phoneMatch = containerText.match(/\+7[\s\d\-\(\)]+/);

      results.push({
        name: link.innerText?.trim(),
        href: href,
        firmId: firmId,
        phone: phoneMatch?.[0]?.trim(),
        containerHTML: container?.outerHTML?.slice(0, 500),
        containerClasses: container?.className
      });
    });

    // Dedupe by firmId
    const seen = new Set();
    return results.filter(r => {
      if (!r.firmId || seen.has(r.firmId)) return false;
      seen.add(r.firmId);
      return true;
    });
  });

  console.log(`\n=== Found ${firms.length} unique firms ===\n`);

  firms.slice(0, 5).forEach((f, i) => {
    console.log(`${i+1}. ${f.name || 'No name'}`);
    console.log(`   ID: ${f.firmId}`);
    console.log(`   Phone: ${f.phone || 'Not found'}`);
    console.log(`   Container classes: ${f.containerClasses?.split(' ').slice(0, 3).join(' ')}`);
    console.log('');
  });

  // Also get the structure
  if (firms.length > 0) {
    console.log('=== Sample container HTML ===');
    console.log(firms[0].containerHTML?.slice(0, 400));
  }

  await browser.close();
}

extract().catch(console.error);
