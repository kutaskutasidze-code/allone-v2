import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createLeadSchema, leadStatusSchema } from '@/lib/validations/leads';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
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
        id, name, email, phone, company, city, country, website, matched_service, status, value, source, source_url, notes, tags, created_at, updated_at,
        sales_user:sales_users(id, name, email)
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

    if (search) {
      const sanitized = search.replace(/[%_]/g, '');
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
    logger.error('Leads API error', { error: String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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
    logger.error('Lead create error', { error: String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
