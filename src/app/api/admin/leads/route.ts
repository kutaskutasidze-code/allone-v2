import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createLeadSchema, leadStatusSchema, INFOSHOP_DOMAIN, parsePhonePrefixes } from '@/lib/validations/leads';
import { logger } from '@/lib/logger';
import { requireRole } from '@/lib/sales-auth';
import { AuthError } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin', 'supervisor']);

    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.slice(0, 100) || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const offset = (page - 1) * limit;

    // Use service role to bypass RLS
    const admin = createAdminClient();
    let query = admin
      .from('leads')
      .select(`
        id, name, email, phone, company, city, country, website, facebook_url, industry, matched_service, status, value, source, source_url, notes, tags, relevance_score, created_at, updated_at,
        sales_user:sales_users!leads_sales_user_id_fkey(id, name, email)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== 'all') {
      if (leadStatusSchema.options.includes(status as never)) {
        query = query.eq('status', status);
      }
    }

    const service = searchParams.get('service');
    if (service && service !== 'all') {
      const validServices = ['chatbots', 'custom_ai', 'automation', 'website', 'consulting'];
      if (validServices.includes(service)) {
        query = query.eq('matched_service', service);
      }
    }

    const source = searchParams.get('source');
    if (source) {
      query = query.eq('source', source);
    }

    const infoshopLike = `%${INFOSHOP_DOMAIN}%`;
    const hasWebsite = searchParams.get('has_website');
    if (hasWebsite === 'yes') {
      query = query.not('website', 'is', null).not('website', 'ilike', infoshopLike);
    } else if (hasWebsite === 'no') {
      query = query.or(`website.is.null,website.ilike.${infoshopLike}`);
    }

    const hasSource = searchParams.get('has_source');
    if (hasSource === 'yes') {
      // "Has source" includes a valid source_url OR a facebook_url
      query = query.or(
        `and(source_url.not.is.null,source_url.not.ilike.${infoshopLike}),facebook_url.not.is.null`
      );
    } else if (hasSource === 'no') {
      // "No source" means no valid source_url AND no facebook_url
      query = query
        .is('facebook_url', null)
        .or(`source_url.is.null,source_url.ilike.${infoshopLike}`);
    }

    const includePrefixes = parsePhonePrefixes(searchParams.get('phone_prefix'));
    if (includePrefixes.length === 1) {
      query = query.ilike('phone', `${includePrefixes[0]}%`);
    } else if (includePrefixes.length > 1) {
      query = query.or(includePrefixes.map(p => `phone.ilike.${p}%`).join(','));
    }

    const excludePrefixes = parsePhonePrefixes(searchParams.get('exclude_phone_prefix'));
    if (excludePrefixes.length === 1) {
      query = query.or(`phone.is.null,phone.not.ilike.${excludePrefixes[0]}%`);
    } else if (excludePrefixes.length > 1) {
      const andClause = excludePrefixes.map(p => `phone.not.ilike.${p}%`).join(',');
      query = query.or(`phone.is.null,and(${andClause})`);
    }

    const industry = searchParams.get('industry');
    if (industry && industry !== 'all') {
      query = query.eq('industry', industry);
    }

    // Assignment filters for the admin pool / per-rep views.
    const assignment = searchParams.get('assignment');
    if (assignment === 'unassigned') {
      query = query.is('sales_user_id', null);
    } else if (assignment === 'assigned') {
      query = query.not('sales_user_id', 'is', null);
    }

    const assignedTo = searchParams.get('assigned_to');
    if (assignedTo) {
      query = query.eq('sales_user_id', assignedTo);
    }

    if (search) {
      const sanitized = search.replace(/[%_,()]/g, '');
      if (sanitized.length > 0) {
        query = query.or(`name.ilike.%${sanitized}%,email.ilike.%${sanitized}%,company.ilike.%${sanitized}%,phone.ilike.%${sanitized}%,city.ilike.%${sanitized}%`);
      }
    }

    const { data: leads, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch leads', { error: error.message });
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }

    const total = count || 0;
    return NextResponse.json({
      data: leads,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    logger.error('Leads API error', { error: String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin', 'supervisor']);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createLeadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 });
    }

    const v = parsed.data;
    const admin = createAdminClient();

    const { data, error } = await admin
      .from('leads')
      .insert({
        name: v.name,
        email: v.email,
        phone: v.phone,
        company: v.company,
        city: v.city,
        country: v.country,
        website: v.website,
        matched_service: v.matched_service,
        notes: v.notes,
        source: v.source || 'manual',
        status: v.status,
        value: v.value,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create lead', { error: error.message });
      return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    logger.error('Lead create error', { error: String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
