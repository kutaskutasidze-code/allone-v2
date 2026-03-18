import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
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

    let query = supabase
      .from('leads')
      .select(`
        id, name, email, phone, company, city, country, website, matched_service, status, value, source, source_url, notes, created_at, updated_at,
        sales_user:sales_users(id, name, email)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== 'all') {
      const validStatuses = ['new', 'contacted', 'qualified', 'won', 'lost'];
      if (validStatuses.includes(status)) {
        query = query.eq('status', status);
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

    return NextResponse.json({
      data: leads,
      meta: { total: count || 0, page, limit },
    });
  } catch (error) {
    logger.error('Leads API error', { error: String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
