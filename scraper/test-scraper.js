import 'dotenv/config';
import { TwoGisScraper } from './dist/scrapers/2gis.scraper.js';
import { getSupabase } from './dist/database/client.js';

async function test() {
  console.log('Testing 2GIS scraper...');

  const supabase = getSupabase();
  const { data: source } = await supabase
    .from('lead_sources')
    .select('*')
    .eq('name', '2GIS Kazakhstan')
    .single();

  if (!source) {
    console.log('No source found.');
    return;
  }

  console.log('Found source:', source.name);
  console.log('Initializing scraper...');

  const scraper = new TwoGisScraper(source);

  console.log('Scraping: restaurants in Almaty...');
  const result = await scraper.scrape('ресторан', 'Almaty', 'KZ');

  console.log('Results:', result.leads.length, 'leads found');
  if (result.leads.length > 0) {
    console.log('Sample leads:');
    result.leads.slice(0, 3).forEach(l => {
      console.log(`  - ${l.name} | ${l.phone || 'no phone'} | ${l.website || 'no website'}`);
    });
  }

  await scraper.close();
  console.log('✓ Scraper test complete!');
}

test().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
