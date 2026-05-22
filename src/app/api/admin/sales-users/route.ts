import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// Lightweight directory of sales users for the admin assign UI.
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('sales_users')
      .select('id, name, email, role')
      .order('name', { ascending: true });

    if (error) {
      logger.error('Failed to list sales users', { error: error.message });
      return NextResponse.json({ error: 'Failed to list sales users' }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (err) {
    logger.error('Unexpected error in GET /api/admin/sales-users', { error: String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
