import type { SupabaseClient } from '@supabase/supabase-js';
import {
  PIPELINE_STAGES,
  type PipelineStatus,
  type PipelineStageData,
} from '@/lib/forecasting';
import { fetchAllRows } from '@/lib/supabase/paginate';

/**
 * Builds the pipeline summary: count + total value per working-pipeline stage
 * (the ~42k `new` leads are never included).
 *
 * Uses the pipeline_stage_agg RPC — a single GROUP BY in Postgres — instead of
 * paging every matching lead into Node to tally in JS. Falls back to the old
 * fetchAllRows() tally if the function isn't present yet.
 *
 * @param admin a service-role Supabase client (RLS-bypassing)
 * @param opts.salesUserId scope to a single rep's leads (sales portal); omit for
 *   the team-wide admin funnel
 */
export async function buildPipeline(
  admin: SupabaseClient,
  opts: { salesUserId?: string } = {},
): Promise<{ stages: PipelineStageData[] }> {
  const { data, error } = await admin.rpc('pipeline_stage_agg', {
    p_uid: opts.salesUserId ?? null,
  });

  if (error || !data) {
    return buildPipelineFanout(admin, opts);
  }

  const byStatus = new Map(
    (data as Array<{ status: PipelineStatus; cnt: number; total_value: number }>).map(
      (r) => [r.status, r],
    ),
  );

  const stages: PipelineStageData[] = PIPELINE_STAGES.map((status) => {
    const row = byStatus.get(status);
    return {
      status,
      count: Number(row?.cnt ?? 0),
      totalValue: Number(row?.total_value ?? 0),
    };
  });

  return { stages };
}

// Fallback: the original full-slice pull + JS tally. Paged so the per-stage
// totals aren't truncated by PostgREST's 1000-row response cap. Retained so the
// funnel keeps working before the pipeline_stage_agg migration is applied.
async function buildPipelineFanout(
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
