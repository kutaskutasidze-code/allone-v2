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

// 1. EMAIL DIGEST — new leads from last hour
async function sendDigest() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data: newLeads, error } = await supabase
    .from('leads')
    .select('id, name, email, company, source, status, created_at')
    .gte('created_at', oneHourAgo)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw new Error(`Digest query failed: ${error.message}`);
  if (!newLeads || newLeads.length === 0) return { sent: false, reason: 'No new leads in last hour' };

  const leadsHtml = newLeads.map(lead => `
    <tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(lead.name || '')}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(lead.email || '-')}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(lead.company || '-')}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(lead.source || '-')}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(lead.status || '')}</td>
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

  const contactEmail = process.env.CONTACT_EMAIL || 'kutaskutasidze@gmail.com';
  const sent = await sendResendEmail(
    contactEmail,
    `[Allone] ${newLeads.length} new lead${newLeads.length > 1 ? 's' : ''} — Hourly Report`,
    html,
  );

  return { sent, leads: newLeads.length };
}

// 2. STALE LEADS CHECK — flag leads untouched for 48+ hours
async function checkStaleLeads() {
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  const { count, error } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'new')
    .is('sales_user_id', null)
    .lte('created_at', twoDaysAgo);

  if (error) throw new Error(`Stale check failed: ${error.message}`);

  const staleCount = count || 0;

  if (staleCount > 0) {
    const contactEmail = process.env.CONTACT_EMAIL || 'kutaskutasidze@gmail.com';
    await sendResendEmail(
      contactEmail,
      `[Allone] ${staleCount} stale leads need attention`,
      `<p><strong>${staleCount} leads</strong> have been sitting as "new" for 48+ hours with no sales rep assigned.</p><p><a href="https://www.allone.ge/admin/leads">View in Admin</a></p>`,
    );
  }

  return { staleLeads: staleCount };
}

// 3. LEAD SCRAPING — scrape active sources for new leads
async function scrapeLeads() {
  const { data: sources, error } = await supabase
    .from('lead_sources')
    .select('*')
    .eq('is_active', true)
    .neq('source_type', 'manual');

  if (error) throw new Error(`Sources query failed: ${error.message}`);
  if (!sources || sources.length === 0) return { scraped: 0, message: 'No active sources' };

  let totalScraped = 0;
  const errors: string[] = [];

  for (const source of sources) {
    try {
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

      if (source.source_type === 'maps' && source.base_url.includes('2gis')) {
        const result = await scrape2GIS(source);
        leadsFound = result.found;
        leadsNew = result.new;
      }

      totalScraped += leadsNew;

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

      await supabase
        .from('lead_sources')
        .update({ last_scraped_at: new Date().toISOString() })
        .eq('id', source.id);

    } catch (err) {
      errors.push(`${source.name}: ${String(err)}`);
    }
  }

  return { scraped: totalScraped, sources: sources.length, errors: errors.length > 0 ? errors : undefined };
}

// 2GIS scraper — uses env key, batch duplicate check, proper source_id
async function scrape2GIS(source: { id: string; base_url: string; scrape_config: { cities?: string[] }; countries?: string[] }) {
  const apiKey = process.env.TWOGIS_API_KEY || 'rurbbn3446';
  const config = source.scrape_config || {};
  const cities = config.cities || [];
  let found = 0;
  let newLeads = 0;

  const categories = ['IT companies', 'Marketing agencies', 'Hotels', 'Restaurants', 'Medical clinics'];
  const country = source.countries?.[0] || (source.base_url.includes('.kz') ? 'KZ' : source.base_url.includes('.uz') ? 'UZ' : null);

  for (const city of cities.slice(0, 2)) {
    const category = categories[Math.floor(Math.random() * categories.length)];

    try {
      const searchUrl = `https://catalog.api.2gis.com/3.0/items?q=${encodeURIComponent(category)}&city=${encodeURIComponent(city)}&page_size=10&key=${apiKey}`;
      const res = await fetch(searchUrl, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) continue;

      const data = await res.json();
      const items = data?.result?.items || [];
      found += items.length;

      if (items.length === 0) continue;

      // Batch duplicate check — single query instead of N+1
      const sourceUrls = items
        .filter((item: { id?: string }) => item.id)
        .map((item: { id: string }) => `https://2gis.kz/firm/${item.id}`);

      const { data: existingLeads } = await supabase
        .from('leads')
        .select('source_url')
        .in('source_url', sourceUrls);

      const existingUrls = new Set((existingLeads || []).map(l => l.source_url));

      // Batch insert new leads
      const newLeadRecords = [];
      for (const item of items) {
        if (!item.name || !item.id) continue;

        const sourceUrl = `https://2gis.kz/firm/${item.id}`;
        if (existingUrls.has(sourceUrl)) continue;

        const phone = item.contact_groups?.[0]?.contacts?.[0]?.value || null;
        const email = item.contact_groups?.flatMap((g: { contacts?: { type?: string; value?: string }[] }) =>
          (g.contacts || []).filter((c: { type?: string }) => c.type === 'email')
        )?.[0]?.value || null;

        let matchedService = null;
        const rubricNames = (item.rubrics || []).map((r: { name?: string }) => (r.name || '').toLowerCase()).join(' ');
        if (rubricNames.includes('it') || rubricNames.includes('software')) {
          matchedService = 'custom_ai';
        } else if (rubricNames.includes('hotel') || rubricNames.includes('restaurant')) {
          matchedService = 'website';
        } else if (rubricNames.includes('medical') || rubricNames.includes('clinic')) {
          matchedService = 'chatbots';
        }

        const rating = item.reviews?.rating || 0;
        const relevanceScore = Math.min(Math.round(rating * 2), 10);

        newLeadRecords.push({
          name: item.name,
          email,
          phone,
          company: item.name,
          source_id: source.id,
          source_url: sourceUrl,
          address: item.address_name || null,
          city,
          country,
          matched_service: matchedService,
          relevance_score: relevanceScore,
          is_scraped: true,
          status: 'new' as const,
        });
      }

      if (newLeadRecords.length > 0) {
        const { error: insertError } = await supabase.from('leads').insert(newLeadRecords);
        if (!insertError) {
          newLeads += newLeadRecords.length;
        }
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
  let hasErrors = false;

  // Run all 3 tasks in parallel
  const [scrapingResult, digestResult, staleResult] = await Promise.allSettled([
    scrapeLeads(),
    sendDigest(),
    checkStaleLeads(),
  ]);

  if (scrapingResult.status === 'fulfilled') {
    results.scraping = scrapingResult.value;
  } else {
    results.scraping = { error: scrapingResult.reason?.message || String(scrapingResult.reason) };
    hasErrors = true;
  }

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

  return Response.json(
    { success: !hasErrors, results },
    { status: hasErrors ? 207 : 200 }
  );
}
