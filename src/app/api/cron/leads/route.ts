import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Vercel cron secret verification
function verifyCron(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${process.env.CRON_SECRET}`) return true;
  // Allow manual trigger with API key
  if (request.headers.get('x-claude-api-key') === process.env.CLAUDE_REPORT_API_KEY) return true;
  return false;
}

// 1. EMAIL DIGEST — new leads from last hour
async function sendDigest() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data: newLeads, error } = await supabase
    .from('leads')
    .select('id, name, email, company, source, status, notes, created_at')
    .gte('created_at', oneHourAgo)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Digest query failed: ${error.message}`);
  if (!newLeads || newLeads.length === 0) return { digest: 'No new leads in last hour' };

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { digest: `${newLeads.length} new leads but no RESEND_API_KEY` };

  const leadsHtml = newLeads.map(lead => `
    <tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${lead.name}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${lead.email || '-'}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${lead.company || '-'}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${lead.source || '-'}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${lead.status}</td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #0f172a; padding: 24px 32px; border-radius: 12px 12px 0 0;">
        <h2 style="margin: 0; color: white;">Hourly Lead Report</h2>
        <p style="margin: 4px 0 0; color: #94a3b8; font-size: 14px;">${newLeads.length} new lead${newLeads.length > 1 ? 's' : ''} in the last hour</p>
      </div>
      <div style="background: white; padding: 24px 32px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background: #f8fafc;">
              <th style="padding: 8px 12px; text-align: left; font-weight: 600;">Name</th>
              <th style="padding: 8px 12px; text-align: left; font-weight: 600;">Email</th>
              <th style="padding: 8px 12px; text-align: left; font-weight: 600;">Company</th>
              <th style="padding: 8px 12px; text-align: left; font-weight: 600;">Source</th>
              <th style="padding: 8px 12px; text-align: left; font-weight: 600;">Status</th>
            </tr>
          </thead>
          <tbody>${leadsHtml}</tbody>
        </table>
      </div>
    </div>
  `;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from: process.env.SMTP_FROM || 'ALLONE Website <onboarding@resend.dev>',
      to: [process.env.CONTACT_EMAIL || 'kutaskutasidze@gmail.com'],
      subject: `[Allone] ${newLeads.length} new lead${newLeads.length > 1 ? 's' : ''} — Hourly Report`,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Digest email failed: ${res.status} ${err}`);
  }

  return { digest: `Sent digest with ${newLeads.length} leads` };
}

// 2. STALE LEADS CHECK — flag leads untouched for 48+ hours
async function checkStaleLeads() {
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  // Count stale leads (status=new, created > 48h ago, no sales user)
  const { data: staleLeads, error } = await supabase
    .from('leads')
    .select('id, name, email, created_at')
    .eq('status', 'new')
    .is('sales_user_id', null)
    .lte('created_at', twoDaysAgo);

  if (error) throw new Error(`Stale check failed: ${error.message}`);

  const staleCount = staleLeads?.length || 0;

  // If there are stale leads, send alert
  if (staleCount > 0 && process.env.RESEND_API_KEY) {
    const staleNames = staleLeads!.slice(0, 10).map(l => `${l.name} (${l.email || 'no email'})`).join(', ');

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify({
        from: process.env.SMTP_FROM || 'ALLONE Website <onboarding@resend.dev>',
        to: [process.env.CONTACT_EMAIL || 'kutaskutasidze@gmail.com'],
        subject: `[Allone] ${staleCount} stale leads need attention`,
        html: `<p><strong>${staleCount} leads</strong> have been sitting as "new" for 48+ hours with no sales rep assigned.</p><p>Top: ${staleNames}</p><p><a href="https://www.allone.ge/admin/leads">View in Admin</a></p>`,
      }),
    });
  }

  return { staleLeads: staleCount };
}

// 3. LEAD SCRAPING — scrape active sources for new leads
async function scrapeLeads() {
  // Get active sources
  const { data: sources, error } = await supabase
    .from('lead_sources')
    .select('*')
    .eq('is_active', true)
    .neq('source_type', 'manual');

  if (error) throw new Error(`Sources query failed: ${error.message}`);
  if (!sources || sources.length === 0) return { scraped: 0, message: 'No active sources' };

  let totalScraped = 0;

  for (const source of sources) {
    try {
      // Create scrape job record
      const { data: job } = await supabase
        .from('scrape_jobs')
        .insert({
          source_id: source.id,
          status: 'running',
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      let leadsFound = 0;
      let leadsNew = 0;

      // Scrape based on source type
      if (source.source_type === 'maps' && source.base_url.includes('2gis')) {
        const result = await scrape2GIS(source);
        leadsFound = result.found;
        leadsNew = result.new;
      }

      totalScraped += leadsNew;

      // Update job status
      if (job) {
        await supabase
          .from('scrape_jobs')
          .update({
            status: 'completed',
            leads_found: leadsFound,
            leads_new: leadsNew,
            completed_at: new Date().toISOString(),
          })
          .eq('id', job.id);
      }

      // Update source stats
      await supabase
        .from('lead_sources')
        .update({
          last_scraped_at: new Date().toISOString(),
          leads_count: (source.leads_count || 0) + leadsNew,
        })
        .eq('id', source.id);

    } catch (err) {
      console.error(`Scrape failed for ${source.name}:`, err);
    }
  }

  return { scraped: totalScraped, sources: sources.length };
}

// 2GIS API scraper
async function scrape2GIS(source: { base_url: string; scrape_config: { cities?: string[] } }) {
  const config = source.scrape_config || {};
  const cities = config.cities || [];
  let found = 0;
  let newLeads = 0;

  // 2GIS has a public search API
  const categories = ['IT companies', 'Marketing agencies', 'Hotels', 'Restaurants', 'Medical clinics'];

  for (const city of cities.slice(0, 2)) { // Limit to 2 cities per run (Vercel timeout)
    const category = categories[Math.floor(Math.random() * categories.length)];

    try {
      const searchUrl = `https://catalog.api.2gis.com/3.0/items?q=${encodeURIComponent(category)}&city=${encodeURIComponent(city)}&page_size=10&key=rurbbn3446`;

      const res = await fetch(searchUrl, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) continue;

      const data = await res.json();
      const items = data?.result?.items || [];
      found += items.length;

      for (const item of items) {
        if (!item.name) continue;

        // Check for duplicate by source_url
        const sourceUrl = `https://2gis.kz/firm/${item.id}`;
        const { data: existing } = await supabase
          .from('leads')
          .select('id')
          .eq('source_url', sourceUrl)
          .maybeSingle();

        if (existing) continue;

        // Extract contact info
        const phone = item.contact_groups?.[0]?.contacts?.[0]?.value || null;
        const email = item.contact_groups?.flatMap((g: { contacts?: { type?: string; value?: string }[] }) =>
          (g.contacts || []).filter((c: { type?: string }) => c.type === 'email')
        )?.[0]?.value || null;

        // Determine matched service based on category
        let matchedService = null;
        if (item.rubrics?.some((r: { name?: string }) => r.name?.toLowerCase().includes('it') || r.name?.toLowerCase().includes('software'))) {
          matchedService = 'custom_ai';
        } else if (item.rubrics?.some((r: { name?: string }) => r.name?.toLowerCase().includes('hotel') || r.name?.toLowerCase().includes('restaurant'))) {
          matchedService = 'website';
        } else if (item.rubrics?.some((r: { name?: string }) => r.name?.toLowerCase().includes('medical') || r.name?.toLowerCase().includes('clinic'))) {
          matchedService = 'chatbots';
        }

        await supabase.from('leads').insert({
          name: item.name,
          email,
          phone,
          company: item.name,
          source_id: source.base_url.includes('2gis.kz') ? undefined : undefined,
          source_url: sourceUrl,
          address: item.address_name || null,
          city,
          country: source.base_url.includes('.kz') ? 'KZ' : source.base_url.includes('.uz') ? 'UZ' : null,
          matched_service: matchedService,
          relevance_score: item.reviews?.rating ? Math.round(item.reviews.rating * 2) : 0,
          is_scraped: true,
          status: 'new',
        });

        newLeads++;
      }
    } catch {
      // Timeout or network error — skip this city
    }
  }

  return { found, new: newLeads };
}

export async function GET(request: NextRequest) {
  if (!verifyCron(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: Record<string, unknown> = { timestamp: new Date().toISOString() };

  // Run all 3 tasks
  try {
    results.scraping = await scrapeLeads();
  } catch (err) {
    results.scraping = { error: String(err) };
  }

  try {
    results.digest = await sendDigest();
  } catch (err) {
    results.digest = { error: String(err) };
  }

  try {
    results.staleCheck = await checkStaleLeads();
  } catch (err) {
    results.staleCheck = { error: String(err) };
  }

  return Response.json({ success: true, results });
}
