import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { parsePhonePrefixes } from '@/lib/validations/leads';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();
    const url = new URL(request.url);
    const sourceFilter = url.searchParams.get('source');
    const includePrefixes = parsePhonePrefixes(url.searchParams.get('phone_prefix'));
    const excludePrefixes = parsePhonePrefixes(url.searchParams.get('exclude_phone_prefix'));

    const PAGE = 1000;
    const counts = new Map<string, number>();
    for (let offset = 0; ; offset += PAGE) {
      let q = admin
        .from('leads')
        .select('industry')
        .not('industry', 'is', null);
      if (sourceFilter) q = q.eq('source', sourceFilter);
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
      const { data, error: dbError } = await q.range(offset, offset + PAGE - 1);

      if (dbError) {
        logger.error('Failed to fetch industries', { error: dbError.message });
        return NextResponse.json({ error: 'Failed to fetch industries' }, { status: 500 });
      }

      if (!data || data.length === 0) break;

      for (const row of data) {
        const industry = (row as { industry: string | null }).industry;
        if (!industry) continue;
        counts.set(industry, (counts.get(industry) || 0) + 1);
      }

      if (data.length < PAGE) break;
    }

    const result = Array.from(counts.entries())
      .map(([industry, count]) => ({ industry, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({ data: result });
  } catch (err) {
    logger.error('Unexpected error in GET /api/admin/leads/industries', { error: String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
