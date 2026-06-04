import type { SupabaseClient } from '@supabase/supabase-js';
import {
  PIPELINE_STAGES,
  type PipelineStatus,
  type PipelineStageData,
} from '@/lib/forecasting';
import { fetchAllRows } from '@/lib/supabase/paginate';

/**
 * Builds the pipeline summary: one read of the working-pipeline leads (the ~24k
 * `new` leads are never selected), tallied per stage in JS into a count + total
 * value. Paged so the per-stage totals aren't truncated by PostgREST's
 * 1000-row response cap.
 *
 * @param admin a service-role Supabase client (RLS-bypassing)
 * @param opts.salesUserId scope to a single rep's leads (sales portal)
 */
export async function buildPipeline(
  admin: SupabaseClient,
  opts: { salesUserId?: string } = {},
): Promise<{ stages: PipelineStageData[] }> {
  const rows = await fetchAllRows<{ value: number | null; status: PipelineStatus }>(
    (from, to) => {
      let q = admin
        .from('leads')
        .select('value, status')
        .in('status', [...PIPELINE_STAGES])
        .range(from, to);
      if (opts.salesUserId) q = q.eq('sales_user_id', opts.salesUserId);
      return q;
    },
  );

  const stages: PipelineStageData[] = PIPELINE_STAGES.map((status) => {
    const stageRows = rows.filter((r) => r.status === status);
    const totalValue = stageRows.reduce(
      (sum, r) => sum + Number(r.value || 0),
      0,
    );
    return { status, count: stageRows.length, totalValue };
  });

  return { stages };
}
