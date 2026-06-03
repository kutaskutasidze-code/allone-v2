import type { SupabaseClient } from '@supabase/supabase-js';
import {
  PIPELINE_STAGES,
  type PipelineStatus,
  type PipelineStageData,
} from '@/lib/forecasting';

/**
 * Builds the pipeline summary: one read of the working-pipeline leads (the ~24k
 * `new` leads are never selected), tallied per stage in JS into a count + total
 * value. Aggregates only — scales to any data volume.
 *
 * @param admin a service-role Supabase client (RLS-bypassing)
 * @param opts.salesUserId scope to a single rep's leads (sales portal)
 */
export async function buildPipeline(
  admin: SupabaseClient,
  opts: { salesUserId?: string } = {},
): Promise<{ stages: PipelineStageData[] }> {
  let query = admin
    .from('leads')
    .select('value, status')
    .in('status', [...PIPELINE_STAGES]);

  if (opts.salesUserId) query = query.eq('sales_user_id', opts.salesUserId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as { value: number | null; status: PipelineStatus }[];

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
