import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { LEAD_STATUSES, parsePhonePrefixes } from '@/lib/validations/leads';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// Returns lead counts for the `all` bucket plus every status, applying the
// same phone-prefix filters as the leads endpoint. Lets the UI populate the
// status filter chips with a single request instead of 9 parallel ones.
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();
    const { searchParams } = new URL(request.url);
    const includePrefixes = parsePhonePrefixes(searchParams.get('phone_prefix'));
    const excludePrefixes = parsePhonePrefixes(searchParams.get('exclude_phone_prefix'));

    const baseQuery = (statusValue: string | null) => {
      let q = admin.from('leads').select('id', { count: 'exact', head: true });
      if (statusValue) q = q.eq('status', statusValue);
      if (includePrefixes.length === 1) {
        q = q.ilike('phone', `${includePrefixes[0]}%`);
      } else if (includePrefixes.length > 1) {
        q = q.or(includePrefixes.map(p => `phone.ilike.${p}%`).join(','));
      }
      if (excludePrefixes.length === 1) {
        q = q.or(`phone.is.null,phone.not.ilike.${excludePrefixes[0]}%`);
      } else if (excludePrefixes.length > 1) {
        const andClause = excludePrefixes.map(p => `phone.not.ilike.${p}%`).join(',');
        q = q.or(`phone.is.null,and(${andClause})`);
      }
      return q;
    };

    const statuses = LEAD_STATUSES.map(s => s.value);
    const results = await Promise.all([
      baseQuery(null),
      ...statuses.map(s => baseQuery(s)),
    ]);

    const counts: Record<string, number> = { all: results[0].count || 0 };
    statuses.forEach((s, i) => { counts[s] = results[i + 1].count || 0; });

    return NextResponse.json({ data: counts });
  } catch (err) {
    logger.error('Unexpected error in GET /api/admin/leads/counts', { error: String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
