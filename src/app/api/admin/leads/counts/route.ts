import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { LEAD_STATUSES, parsePhonePrefixes, INFOSHOP_DOMAIN } from '@/lib/validations/leads';
import { logger } from '@/lib/logger';
import { requireRole } from '@/lib/sales-auth';
import { AuthError } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Returns lead counts for the `all` bucket plus every status, applying the
// same phone-prefix filters as the leads endpoint. Lets the UI populate the
// status filter chips with a single request instead of 9 parallel ones.
export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin', 'supervisor']);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();
    const { searchParams } = new URL(request.url);
    const includePrefixes = parsePhonePrefixes(searchParams.get('phone_prefix'));
    const excludePrefixes = parsePhonePrefixes(searchParams.get('exclude_phone_prefix'));
    // Same narrowing filters as the leads list, so the chips match the list.
    const industry = searchParams.get('industry');
    const service = searchParams.get('service');
    const hasWebsite = searchParams.get('has_website');
    const hasSource = searchParams.get('has_source');
    const hasAnySource = searchParams.get('has_any_source');
    const search = (searchParams.get('search') || '').replace(/[%_,()]/g, '').slice(0, 100);
    const infoshopLike = `%${INFOSHOP_DOMAIN}%`;

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
      if (industry && industry !== 'all') q = q.eq('industry', industry);
      if (service && service !== 'all') q = q.eq('matched_service', service);
      if (hasWebsite === 'yes') q = q.not('website', 'is', null).not('website', 'ilike', infoshopLike);
      else if (hasWebsite === 'no') q = q.or(`website.is.null,website.ilike.${infoshopLike}`);
      if (hasSource === 'yes') q = q.or(`and(source_url.not.is.null,source_url.not.ilike.${infoshopLike}),facebook_url.not.is.null`);
      else if (hasSource === 'no') q = q.is('facebook_url', null).or(`source_url.is.null,source_url.ilike.${infoshopLike}`);
      if (hasAnySource === 'yes') q = q.or(`and(website.not.is.null,website.not.ilike.${infoshopLike}),facebook_url.not.is.null,and(source_url.not.is.null,source_url.not.ilike.${infoshopLike})`);
      else if (hasAnySource === 'no') q = q.or(`website.is.null,website.ilike.${infoshopLike}`).is('facebook_url', null).or(`source_url.is.null,source_url.ilike.${infoshopLike}`);
      if (search) q = q.or(`name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%,phone.ilike.%${search}%,city.ilike.%${search}%`);
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
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    logger.error('Unexpected error in GET /api/admin/leads/counts', { error: String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
