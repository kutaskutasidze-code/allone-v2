import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function verifyCron(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`) return true;
  const apiKey = request.headers.get('x-claude-api-key');
  if (process.env.CLAUDE_REPORT_API_KEY && apiKey === process.env.CLAUDE_REPORT_API_KEY) return true;
  return false;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function sendResendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from: process.env.SMTP_FROM || 'ALLONE Website <onboarding@resend.dev>',
      to: [to],
      subject,
      html,
    }),
  });

  return res.ok;
}

// ========== CITY CONFIG ==========
// Tbilisi split into geographic quadrants for pagination, smaller cities as single zones
const SCRAPE_SCHEDULE: { city: string; bbox: string; label: string }[] = [
  // Tbilisi — 6 geographic slices (covers ~5,700 businesses)
  { city: 'Tbilisi', bbox: '41.68,44.70,41.72,44.80', label: 'Tbilisi SW' },
  { city: 'Tbilisi', bbox: '41.72,44.70,41.76,44.80', label: 'Tbilisi W' },
  { city: 'Tbilisi', bbox: '41.68,44.80,41.72,44.90', label: 'Tbilisi SE' },
  { city: 'Tbilisi', bbox: '41.72,44.80,41.76,44.90', label: 'Tbilisi E' },
  { city: 'Tbilisi', bbox: '41.76,44.70,41.82,44.80', label: 'Tbilisi NW' },
  { city: 'Tbilisi', bbox: '41.76,44.80,41.82,44.90', label: 'Tbilisi NE' },
  // Batumi — 2 slices (covers ~1,170 businesses)
  { city: 'Batumi', bbox: '41.62,41.60,41.66,41.68', label: 'Batumi S' },
  { city: 'Batumi', bbox: '41.66,41.60,41.70,41.68', label: 'Batumi N' },
  // Kutaisi — 1 slice (covers ~577 businesses)
  { city: 'Kutaisi', bbox: '42.22,42.65,42.30,42.75', label: 'Kutaisi' },
  // Rustavi — 1 slice (covers ~150 businesses)
  { city: 'Rustavi', bbox: '41.52,44.95,41.58,45.05', label: 'Rustavi' },
  // Zugdidi — 1 slice (covers ~200 businesses)
  { city: 'Zugdidi', bbox: '42.49,41.84,42.53,41.90', label: 'Zugdidi' },
];

// ========== 1. EMAIL DIGEST ==========
async function sendDigest() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: newLeads, error } = await supabase
    .from('leads')
    .select('id, name, email, phone, company, source, status, city, country, created_at')
    .gte('created_at', oneDayAgo)
    .eq('country', 'GE')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) throw new Error(`Digest query failed: ${error.message}`);
  if (!newLeads || newLeads.length === 0) return { sent: false, reason: 'No new Georgian leads in last 24 hours' };

  const leadsWithContact = newLeads.filter(l => l.email || l.phone);

  const leadsHtml = newLeads.map(lead => `
    <tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(lead.name || '')}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(lead.email || '-')}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(lead.phone || '-')}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(lead.company || '-')}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(lead.city || '-')}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(lead.status || '')}</td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 700px; margin: 0 auto;">
      <div style="background: #0f172a; padding: 24px 32px; border-radius: 12px 12px 0 0;">
        <h2 style="margin: 0; color: white;">Daily Lead Report — Georgia</h2>
        <p style="margin: 4px 0 0; color: #94a3b8; font-size: 14px;">${newLeads.length} new lead${newLeads.length > 1 ? 's' : ''} in the last 24 hours</p>
        <p style="margin: 4px 0 0; color: #94a3b8; font-size: 13px;">${leadsWithContact.length} with contact info (email or phone)</p>
      </div>
      <div style="background: white; padding: 24px 32px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background: #f8fafc;">
              <th style="padding: 8px 12px; text-align: left; font-weight: 600;">Name</th>
              <th style="padding: 8px 12px; text-align: left; font-weight: 600;">Email</th>
              <th style="padding: 8px 12px; text-align: left; font-weight: 600;">Phone</th>
              <th style="padding: 8px 12px; text-align: left; font-weight: 600;">Company</th>
              <th style="padding: 8px 12px; text-align: left; font-weight: 600;">City</th>
              <th style="padding: 8px 12px; text-align: left; font-weight: 600;">Status</th>
            </tr>
          </thead>
          <tbody>${leadsHtml}</tbody>
        </table>
      </div>
    </div>
  `;

  const contactEmail = process.env.CONTACT_EMAIL || 'kutaskutasidze@gmail.com';
  const sent = await sendResendEmail(
    contactEmail,
    `[Allone] ${newLeads.length} Georgian lead${newLeads.length > 1 ? 's' : ''} — Daily Report`,
    html,
  );

  return { sent, leads: newLeads.length, withContact: leadsWithContact.length };
}

// ========== 2. STALE LEADS CHECK ==========
async function checkStaleLeads() {
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  const { count, error } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'new')
    .eq('country', 'GE')
    .is('sales_user_id', null)
    .lte('created_at', twoDaysAgo);

  if (error) throw new Error(`Stale check failed: ${error.message}`);

  const staleCount = count || 0;

  if (staleCount > 0) {
    const contactEmail = process.env.CONTACT_EMAIL || 'kutaskutasidze@gmail.com';
    await sendResendEmail(
      contactEmail,
      `[Allone] ${staleCount} stale leads need attention`,
      `<p><strong>${staleCount} Georgian leads</strong> have been sitting as "new" for 48+ hours with no sales rep assigned.</p><p><a href="https://www.allone.ge/admin/leads">View in Admin</a></p>`,
    );
  }

  return { staleLeads: staleCount };
}

// ========== 3. MAIN SCRAPER — OSM + WIKIDATA ==========
async function scrapeLeads() {
  // Determine which zone to scrape based on current hour (rotates through all zones)
  const currentHour = new Date().getUTCHours();
  const zoneIndex = currentHour % SCRAPE_SCHEDULE.length;
  const zone = SCRAPE_SCHEDULE[zoneIndex];

  const { data: job } = await supabase
    .from('scrape_jobs')
    .insert({
      source_id: null,
      status: 'running',
      search_query: `OSM+Wikidata: ${zone.label}`,
      country: 'GE',
      city: zone.city,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  const jobId = job?.id;

  try {
    // Run OSM scraper and Wikidata scraper in parallel
    const [osmResult, wikiResult] = await Promise.allSettled([
      scrapeOSMZone(zone),
      scrapeWikidata(),
    ]);

    const osmData = osmResult.status === 'fulfilled' ? osmResult.value : { found: 0, new: 0 };
    const wikiData = wikiResult.status === 'fulfilled' ? wikiResult.value : { found: 0, new: 0 };
    const errors: string[] = [];
    if (osmResult.status === 'rejected') errors.push(`OSM: ${osmResult.reason}`);
    if (wikiResult.status === 'rejected') errors.push(`Wikidata: ${wikiResult.reason}`);

    const totalFound = osmData.found + wikiData.found;
    const totalNew = osmData.new + wikiData.new;

    if (jobId) {
      await supabase
        .from('scrape_jobs')
        .update({
          status: 'completed',
          leads_found: totalFound,
          leads_new: totalNew,
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId);
    }

    return {
      scraped: totalNew,
      found: totalFound,
      country: 'GE',
      zone: zone.label,
      osm: osmData,
      wikidata: wikiData,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (err) {
    if (jobId) {
      await supabase
        .from('scrape_jobs')
        .update({ status: 'failed', error_message: String(err), completed_at: new Date().toISOString() })
        .eq('id', jobId);
    }
    throw err;
  }
}

// ========== OSM OVERPASS — ALL businesses with contact info in a bbox zone ==========
async function scrapeOSMZone(zone: { city: string; bbox: string; label: string }) {
  const [s, w, n, e] = zone.bbox.split(',');

  // Query ALL nodes and ways with phone or email in this bounding box — no category filter
  const query = `[out:json][timeout:45];
(
  node["contact:phone"](${s},${w},${n},${e});
  node["phone"](${s},${w},${n},${e});
  node["contact:email"](${s},${w},${n},${e});
  node["email"](${s},${w},${n},${e});
  way["contact:phone"](${s},${w},${n},${e});
  way["phone"](${s},${w},${n},${e});
  way["contact:email"](${s},${w},${n},${e});
  way["email"](${s},${w},${n},${e});
);
out body 300;`;

  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    signal: AbortSignal.timeout(50000),
  });

  if (!res.ok) throw new Error(`Overpass returned ${res.status}`);

  const data = await res.json();
  const elements: OSMElement[] = data?.elements || [];

  if (elements.length === 0) return { found: 0, new: 0 };

  // Batch duplicate check
  const sourceUrls = elements.map(el => `https://www.openstreetmap.org/${el.type}/${el.id}`);

  // Check in batches of 100 (Supabase .in() limit)
  const existingUrls = new Set<string>();
  for (let i = 0; i < sourceUrls.length; i += 100) {
    const batch = sourceUrls.slice(i, i + 100);
    const { data: existing } = await supabase
      .from('leads')
      .select('source_url')
      .in('source_url', batch);
    for (const l of existing || []) existingUrls.add(l.source_url);
  }

  const newLeadRecords = [];
  for (const el of elements) {
    const t = el.tags || {};
    const sourceUrl = `https://www.openstreetmap.org/${el.type}/${el.id}`;
    if (existingUrls.has(sourceUrl)) continue;

    const name = t['name:en'] || t['name'] || null;
    if (!name) continue;

    const phone = t['contact:phone'] || t['phone'] || null;
    const email = t['contact:email'] || t['email'] || null;
    if (!phone && !email) continue;

    const website = t['contact:website'] || t['website'] || null;

    // Categorize based on OSM tags
    const allTags = Object.entries(t).map(([k, v]) => `${k}=${v}`.toLowerCase()).join(' ');
    let matchedService = 'website'; // default
    if (allTags.includes('office=it') || allTags.includes('software') || allTags.includes('computer')) {
      matchedService = 'custom_ai';
    } else if (allTags.includes('clinic') || allTags.includes('hospital') || allTags.includes('dentist') || allTags.includes('pharmacy') || allTags.includes('doctor')) {
      matchedService = 'chatbots';
    } else if (allTags.includes('bank') || allTags.includes('insurance') || allTags.includes('lawyer') || allTags.includes('financial') || allTags.includes('university')) {
      matchedService = 'consulting';
    } else if (allTags.includes('logistics') || allTags.includes('warehouse') || allTags.includes('factory') || allTags.includes('supermarket') || allTags.includes('fuel')) {
      matchedService = 'automation';
    }

    newLeadRecords.push({
      name,
      email,
      phone,
      company: name,
      website,
      source_url: sourceUrl,
      address: t['addr:street'] ? `${t['addr:street']} ${t['addr:housenumber'] || ''}`.trim() : null,
      city: zone.city,
      country: 'GE',
      matched_service: matchedService,
      relevance_score: 5,
      linkedin_url: t['contact:linkedin'] || null,
      facebook_url: t['contact:facebook'] || null,
      instagram_url: t['contact:instagram'] || null,
      is_scraped: true,
      status: 'new' as const,
    });
  }

  let newLeads = 0;
  // Insert in batches of 50
  for (let i = 0; i < newLeadRecords.length; i += 50) {
    const batch = newLeadRecords.slice(i, i + 50);
    const { error: insertError } = await supabase.from('leads').insert(batch);
    if (!insertError) newLeads += batch.length;
  }

  return { found: elements.length, new: newLeads };
}

// ========== WIKIDATA — Georgian companies with phone/email (150 total, paginated) ==========
async function scrapeWikidata() {
  // Paginate through Wikidata: 50 per hour, offset based on hour
  const currentHour = new Date().getUTCHours();
  const offset = (currentHour % 3) * 50; // 0, 50, 100 — covers all 150 in 3 hours

  const sparql = `SELECT ?item ?itemLabel ?phone ?email ?website ?description WHERE {
  ?item wdt:P17 wd:Q230 .
  ?item wdt:P31/wdt:P279* wd:Q4830453 .
  OPTIONAL { ?item wdt:P1329 ?phone . }
  OPTIONAL { ?item wdt:P968 ?email . }
  OPTIONAL { ?item wdt:P856 ?website . }
  OPTIONAL { ?item schema:description ?description . FILTER(LANG(?description) = "en") }
  FILTER(BOUND(?phone) || BOUND(?email))
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en,ka" . }
} LIMIT 50 OFFSET ${offset}`;

  const res = await fetch('https://query.wikidata.org/sparql', {
    method: 'POST',
    body: `query=${encodeURIComponent(sparql)}`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'User-Agent': 'AlloneLeadScraper/1.0 (https://allone.ge)',
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new Error(`Wikidata returned ${res.status}`);

  const data = await res.json();
  interface WikidataBinding {
    item?: { value?: string };
    itemLabel?: { value?: string };
    phone?: { value?: string };
    email?: { value?: string };
    website?: { value?: string };
    description?: { value?: string };
  }
  const results: WikidataBinding[] = data?.results?.bindings || [];

  if (results.length === 0) return { found: 0, new: 0 };

  // Build source URLs for dedup
  const sourceUrls = results
    .filter(r => r.item?.value)
    .map(r => r.item!.value!);

  const { data: existing } = await supabase
    .from('leads')
    .select('source_url')
    .in('source_url', sourceUrls);

  const existingUrls = new Set((existing || []).map(l => l.source_url));

  const newLeadRecords = [];
  for (const r of results) {
    const sourceUrl = r.item?.value;
    if (!sourceUrl || existingUrls.has(sourceUrl)) continue;

    const name = r.itemLabel?.value;
    if (!name || name.startsWith('Q')) continue; // Skip unresolved Wikidata IDs

    const phone = r.phone?.value || null;
    const emailRaw = r.email?.value || null;
    const email = emailRaw?.replace('mailto:', '') || null;
    const website = r.website?.value || null;
    if (!phone && !email) continue;

    // Categorize from description
    const desc = (r.description?.value || '').toLowerCase();
    let matchedService = 'consulting'; // default for Wikidata (established companies)
    if (desc.includes('bank') || desc.includes('insurance') || desc.includes('financial')) {
      matchedService = 'consulting';
    } else if (desc.includes('hospital') || desc.includes('clinic') || desc.includes('pharma')) {
      matchedService = 'chatbots';
    } else if (desc.includes('hotel') || desc.includes('restaurant') || desc.includes('tourism')) {
      matchedService = 'website';
    } else if (desc.includes('software') || desc.includes('technology') || desc.includes('it ')) {
      matchedService = 'custom_ai';
    } else if (desc.includes('logist') || desc.includes('transport') || desc.includes('manufactur')) {
      matchedService = 'automation';
    }

    newLeadRecords.push({
      name,
      email,
      phone,
      company: name,
      website,
      source_url: sourceUrl,
      city: 'Tbilisi', // Most Wikidata Georgian companies are Tbilisi-based
      country: 'GE',
      matched_service: matchedService,
      relevance_score: 8, // Higher score — established companies
      is_scraped: true,
      status: 'new' as const,
    });
  }

  let newLeads = 0;
  if (newLeadRecords.length > 0) {
    const { error: insertError } = await supabase.from('leads').insert(newLeadRecords);
    if (!insertError) newLeads = newLeadRecords.length;
  }

  return { found: results.length, new: newLeads };
}

// ========== 4. CLEANUP ==========
async function cleanupNonGeorgianLeads() {
  const { count } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('is_scraped', true)
    .neq('country', 'GE');

  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('is_scraped', true)
    .neq('country', 'GE');

  if (error) throw new Error(`Cleanup failed: ${error.message}`);
  return { deleted: count || 0 };
}

// ========== TYPES ==========
interface OSMElement {
  type: string;
  id: number;
  tags?: Record<string, string>;
}

// ========== HANDLER ==========
export async function GET(request: NextRequest) {
  if (!verifyCron(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const task = url.searchParams.get('task');

  const results: Record<string, unknown> = { timestamp: new Date().toISOString(), task: task || 'scrape' };
  let hasErrors = false;

  if (task === 'digest') {
    const [digestResult, staleResult] = await Promise.allSettled([
      sendDigest(),
      checkStaleLeads(),
    ]);

    if (digestResult.status === 'fulfilled') {
      results.digest = digestResult.value;
    } else {
      results.digest = { error: digestResult.reason?.message || String(digestResult.reason) };
      hasErrors = true;
    }

    if (staleResult.status === 'fulfilled') {
      results.staleCheck = staleResult.value;
    } else {
      results.staleCheck = { error: staleResult.reason?.message || String(staleResult.reason) };
      hasErrors = true;
    }
  } else if (task === 'cleanup') {
    try {
      results.cleanup = await cleanupNonGeorgianLeads();
    } catch (err) {
      results.cleanup = { error: String(err) };
      hasErrors = true;
    }
  } else {
    try {
      results.scraping = await scrapeLeads();
    } catch (err) {
      results.scraping = { error: String(err) };
      hasErrors = true;
    }
  }

  return Response.json(
    { success: !hasErrors, results },
    { status: hasErrors ? 207 : 200 }
  );
}
