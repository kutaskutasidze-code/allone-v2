import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let query = supabase
      .from('leads')
      .select(`
        *,
        sales_user:sales_users(id, name, email)
      `)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`);
    }

    const { data: leads, error } = await query;

    if (error) {
      logger.error('Failed to fetch leads', { error: error.message });
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }

    logger.debug('DB SELECT on leads (admin)', {
      action: 'database',
      resource: 'leads',
      count: leads?.length
    });

    return NextResponse.json({ data: leads });
  } catch (error) {
    logger.error('Leads API error', { error: String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
