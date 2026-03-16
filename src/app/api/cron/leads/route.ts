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

// 3. LEAD SCRAPING — scrape Georgian locations only via 2GIS API
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
          country: 'GE',
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

  return { scraped: totalScraped, sources: sources.length, country: 'GE', errors: errors.length > 0 ? errors : undefined };
}

// 2GIS scraper — Georgia only, extracts phones + emails
async function scrape2GIS(source: { id: string; base_url: string; scrape_config: { cities?: string[] }; countries?: string[] }) {
  const apiKey = process.env.TWOGIS_API_KEY || 'rurbbn3446';
  // Always use Georgian cities regardless of source config
  const cities = GEORGIAN_CITIES;
  let found = 0;
  let newLeads = 0;

  const categories = [
    'IT companies', 'Marketing agencies', 'Hotels', 'Restaurants',
    'Medical clinics', 'Law firms', 'Real estate', 'Dental clinics',
    'Travel agencies', 'Insurance companies', 'Banks', 'Startups',
    'E-commerce', 'Logistics companies', 'Construction companies',
  ];

  for (const city of cities) {
    // Pick 2 random categories per city per run for variety
    const shuffled = categories.sort(() => Math.random() - 0.5);
    const selectedCategories = shuffled.slice(0, 2);

    for (const category of selectedCategories) {
      try {
        const searchUrl = `https://catalog.api.2gis.com/3.0/items?q=${encodeURIComponent(category)}&city=${encodeURIComponent(city)}&page_size=20&key=${apiKey}`;
        const res = await fetch(searchUrl, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) continue;

        const data = await res.json();
        const items = data?.result?.items || [];
        found += items.length;

        if (items.length === 0) continue;

        // Batch duplicate check
        const sourceUrls = items
          .filter((item: { id?: string }) => item.id)
          .map((item: { id: string }) => `https://2gis.ge/firm/${item.id}`);

        const { data: existingLeads } = await supabase
          .from('leads')
          .select('source_url')
          .in('source_url', sourceUrls);

        const existingUrls = new Set((existingLeads || []).map(l => l.source_url));

        // Batch insert new leads — only those with phone or email
        const newLeadRecords = [];
        for (const item of items) {
          if (!item.name || !item.id) continue;

          const sourceUrl = `https://2gis.ge/firm/${item.id}`;
          if (existingUrls.has(sourceUrl)) continue;

          // Extract all phones from contact groups
          const phones: string[] = [];
          const emails: string[] = [];
          for (const group of item.contact_groups || []) {
            for (const contact of group.contacts || []) {
              if (contact.type === 'phone' && contact.value) {
                phones.push(contact.value);
              } else if (contact.type === 'email' && contact.value) {
                emails.push(contact.value);
              }
            }
          }

          const phone = phones[0] || null;
          const email = emails[0] || null;

          // Skip leads with no contact info at all
          if (!phone && !email) continue;

          let matchedService = null;
          const rubricNames = (item.rubrics || []).map((r: { name?: string }) => (r.name || '').toLowerCase()).join(' ');
          if (rubricNames.includes('it') || rubricNames.includes('software')) {
            matchedService = 'custom_ai';
          } else if (rubricNames.includes('hotel') || rubricNames.includes('restaurant')) {
            matchedService = 'website';
          } else if (rubricNames.includes('medical') || rubricNames.includes('clinic') || rubricNames.includes('dental')) {
            matchedService = 'chatbots';
          } else if (rubricNames.includes('logist') || rubricNames.includes('warehouse') || rubricNames.includes('construction')) {
            matchedService = 'automation';
          } else if (rubricNames.includes('law') || rubricNames.includes('insurance') || rubricNames.includes('bank')) {
            matchedService = 'consulting';
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
            country: 'GE',
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
        // Timeout or network error — skip this city/category
      }
    }
  }

  return { found, new: newLeads };
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
