import puppeteer from 'puppeteer';

async function analyze() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  console.log('Navigating to 2GIS...');
  await page.goto('https://2gis.kz/almaty/search/ресторан', {
    waitUntil: 'networkidle2',
    timeout: 30000
  });

  await new Promise(r => setTimeout(r, 3000));

  // Find business listings by looking for /firm/ links
  const listings = await page.evaluate(() => {
    const items = [];
    const links = document.querySelectorAll('a[href*="/firm/"]');

    links.forEach(a => {
      const parent = a.closest('div');
      const grandparent = parent?.parentElement;
      const container = grandparent || parent;
      const allText = container?.textContent || '';

      items.push({
        name: a.textContent?.trim(),
        href: a.href,
        containerClass: container?.className?.split(' ')[0] || 'unknown',
        hasPhone: allText.includes('+7') || allText.includes('8 '),
        textPreview: allText.slice(0, 300)
      });
    });

    const seen = new Set();
    return items.filter(i => {
      if (!i.name || seen.has(i.name)) return false;
      seen.add(i.name);
      return true;
    }).slice(0, 10);
  });

  console.log('\n=== Found', listings.length, 'listings ===\n');
  listings.forEach((l, i) => {
    console.log(`${i+1}. ${l.name}`);
    console.log(`   Container class: ${l.containerClass}`);
    console.log(`   Has phone: ${l.hasPhone}`);
    console.log(`   Text: ${l.textPreview.slice(0, 100)}...`);
    console.log('');
  });

  // Get selector path
  const selectorPath = await page.evaluate(() => {
    const firstFirm = document.querySelector('a[href*="/firm/"]');
    if (!firstFirm) return null;

    let el = firstFirm;
    const path = [];
    while (el && el !== document.body && path.length < 8) {
      const classes = el.className?.split(' ').filter(c => c.startsWith('_')).slice(0, 2);
      if (classes?.length) {
        path.push(classes.join('.'));
      }
      el = el.parentElement;
    }
    return path;
  });

  console.log('=== Selector path (from link to container) ===');
  console.log(selectorPath);

  // Try to find list container
  const listContainer = await page.evaluate(() => {
    const links = document.querySelectorAll('a[href*="/firm/"]');
    if (links.length < 2) return null;

    // Find common parent of first two links
    const first = links[0];
    const second = links[1];

    let p1 = first.parentElement;
    while (p1) {
      if (p1.contains(second)) {
        return {
          tagName: p1.tagName,
          className: p1.className?.split(' ')[0],
          childCount: p1.children.length
        };
      }
      p1 = p1.parentElement;
    }
    return null;
  });

  console.log('\n=== List container ===');
  console.log(listContainer);

  await browser.close();
  console.log('\nDone!');
}

analyze().catch(console.error);
