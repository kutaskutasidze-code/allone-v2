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

// Georgian cities for scraping
const GEORGIAN_CITIES = ['Tbilisi', 'Batumi', 'Kutaisi', 'Rustavi', 'Zugdidi'];

// 1. EMAIL DIGEST — Georgian leads from last 24 hours (sent once daily at 11 AM)
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

// 2. STALE LEADS CHECK — flag Georgian leads untouched for 48+ hours
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

// Business type filters for OSM Overpass queries — rotated each hour for variety
const OSM_BUSINESS_FILTERS = [
  // Group 1: Tech & Services
  { filter: '["office"~"it|company|consulting|insurance|financial|lawyer|estate_agent"]', service: 'custom_ai' },
  // Group 2: Hospitality
  { filter: '["tourism"~"hotel|hostel|guest_house|apartment"]', service: 'website' },
  // Group 3: Food & Drink
  { filter: '["amenity"~"restaurant|cafe|bar|fast_food"]', service: 'website' },
  // Group 4: Health
  { filter: '["amenity"~"clinic|hospital|dentist|pharmacy|doctors"]', service: 'chatbots' },
  // Group 5: Retail & Commerce
  { filter: '["shop"~"supermarket|clothes|beauty|car|furniture|electronics|hardware"]', service: 'automation' },
  // Group 6: Education & Finance
  { filter: '["amenity"~"bank|school|university|kindergarten|college"]', service: 'consulting' },
  // Group 7: Auto & Logistics
  { filter: '["shop"~"car_repair|car_parts|tyres"]["amenity"~"car_rental|fuel"]', service: 'automation' },
];

// 3. LEAD SCRAPING — scrape Georgian businesses via OpenStreetMap Overpass API (free, no key needed)
async function scrapeLeads() {
  const { data: job } = await supabase
    .from('scrape_jobs')
    .insert({
      source_id: null,
      status: 'running',
      search_query: 'OpenStreetMap Overpass — Georgian businesses',
      country: 'GE',
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  const jobId = job?.id;

  try {
    // Pick 2 random city + business type combos per run for variety
    const cityPicks = GEORGIAN_CITIES.sort(() => Math.random() - 0.5).slice(0, 2);
    const filterPicks = OSM_BUSINESS_FILTERS.sort(() => Math.random() - 0.5).slice(0, 2);

    let totalFound = 0;
    let totalNew = 0;
    const errors: string[] = [];

    for (const city of cityPicks) {
      for (const { filter, service } of filterPicks) {
        try {
          const result = await scrapeOSM(city, filter, service);
          totalFound += result.found;
          totalNew += result.new;
        } catch (err) {
          errors.push(`${city}/${service}: ${String(err)}`);
        }
      }
    }

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

    return { scraped: totalNew, found: totalFound, country: 'GE', cities: cityPicks, errors: errors.length > 0 ? errors : undefined };
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

// OpenStreetMap Overpass scraper — queries businesses with contact info in a Georgian city
async function scrapeOSM(city: string, osmFilter: string, defaultService: string) {
  // Build Overpass query: find nodes and ways with contact info in the given city
  // We query for businesses that have phone OR email
  const query = `[out:json][timeout:30];
area["name:en"="${city}"]->.searchArea;
(
  node${osmFilter}(area.searchArea);
  way${osmFilter}(area.searchArea);
);
out body 50;`;

  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    signal: AbortSignal.timeout(35000),
  });

  if (!res.ok) throw new Error(`Overpass API returned ${res.status}`);

  const data = await res.json();
  const elements = data?.elements || [];

  // Filter to only elements with phone or email
  interface OSMElement {
    type: string;
    id: number;
    tags?: Record<string, string>;
  }
  const withContact = elements.filter((el: OSMElement) => {
    const t = el.tags || {};
    return t['contact:phone'] || t['phone'] || t['contact:email'] || t['email'];
  });

  if (withContact.length === 0) return { found: elements.length, new: 0 };

  // Batch duplicate check using OSM source URLs
  const sourceUrls = withContact.map((el: OSMElement) => `https://www.openstreetmap.org/${el.type}/${el.id}`);

  const { data: existingLeads } = await supabase
    .from('leads')
    .select('source_url')
    .in('source_url', sourceUrls);

  const existingUrls = new Set((existingLeads || []).map(l => l.source_url));

  const newLeadRecords = [];
  for (const el of withContact as OSMElement[]) {
    const t = el.tags || {};
    const sourceUrl = `https://www.openstreetmap.org/${el.type}/${el.id}`;
    if (existingUrls.has(sourceUrl)) continue;

    const name = t['name:en'] || t['name'] || null;
    if (!name) continue;

    const phone = t['contact:phone'] || t['phone'] || null;
    const email = t['contact:email'] || t['email'] || null;
    const website = t['contact:website'] || t['website'] || null;

    // Categorize based on OSM tags
    let matchedService = defaultService;
    const allTags = Object.entries(t).map(([k, v]) => `${k}=${v}`.toLowerCase()).join(' ');
    if (allTags.includes('office=it') || allTags.includes('software')) {
      matchedService = 'custom_ai';
    } else if (allTags.includes('hotel') || allTags.includes('restaurant') || allTags.includes('cafe')) {
      matchedService = 'website';
    } else if (allTags.includes('clinic') || allTags.includes('hospital') || allTags.includes('dentist') || allTags.includes('pharmacy')) {
      matchedService = 'chatbots';
    } else if (allTags.includes('bank') || allTags.includes('insurance') || allTags.includes('lawyer')) {
      matchedService = 'consulting';
    }

    newLeadRecords.push({
      name,
      email,
      phone,
      company: name,
      website: website,
      source_url: sourceUrl,
      address: t['addr:street'] ? `${t['addr:street']} ${t['addr:housenumber'] || ''}`.trim() : null,
      city,
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
  if (newLeadRecords.length > 0) {
    const { error: insertError } = await supabase.from('leads').insert(newLeadRecords);
    if (!insertError) {
      newLeads = newLeadRecords.length;
    }
  }

  return { found: withContact.length, new: newLeads };
}

// 4. CLEANUP — remove non-Georgian scraped leads
async function cleanupNonGeorgianLeads() {
  // First count how many will be deleted
  const { count } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('is_scraped', true)
    .neq('country', 'GE');

  // Then delete them
  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('is_scraped', true)
    .neq('country', 'GE');

  if (error) throw new Error(`Cleanup failed: ${error.message}`);
  return { deleted: count || 0 };
}

export async function GET(request: NextRequest) {
  if (!verifyCron(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const task = url.searchParams.get('task'); // 'scrape' | 'digest' | 'cleanup' | null (all)

  const results: Record<string, unknown> = { timestamp: new Date().toISOString(), task: task || 'scrape' };
  let hasErrors = false;

  if (task === 'digest') {
    // Daily 11 AM — send digest + stale check only
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
    // One-time cleanup of non-Georgian leads
    try {
      results.cleanup = await cleanupNonGeorgianLeads();
    } catch (err) {
      results.cleanup = { error: String(err) };
      hasErrors = true;
    }
  } else {
    // Default (hourly) — scrape only, no email
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
