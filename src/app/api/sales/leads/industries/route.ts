import { requireSalesAuth } from '@/lib/sales-auth';
import { AuthError } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { success, error, unauthorized } from '@/lib/api-response';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireSalesAuth();
    const supabase = createAdminClient();
    const sourceFilter = new URL(request.url).searchParams.get('source');

    // PostgREST caps single-request rows (default 1000). Page through all
    // industry-bearing rows and aggregate in JS.
    const PAGE = 1000;
    const counts = new Map<string, number>();
    for (let offset = 0; ; offset += PAGE) {
      let q = supabase
        .from('leads')
        .select('industry')
        .not('industry', 'is', null);
      if (sourceFilter) q = q.eq('source', sourceFilter);
      const { data, error: dbError } = await q.range(offset, offset + PAGE - 1);

      if (dbError) {
        logger.error('Failed to fetch industries', { error: dbError.message });
        return error('Failed to fetch industries');
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

    return success(result);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error('Unexpected error in GET /api/sales/leads/industries', { error: String(err) });
    return error('Internal server error');
  }
}
