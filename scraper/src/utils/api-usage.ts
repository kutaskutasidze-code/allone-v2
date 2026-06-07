import { getSupabase } from '../database/client.js';

// Sum api_usage counts for `api` since `sinceDate` (YYYY-MM-DD, inclusive).
// Fail closed: if we can't read usage, throw rather than assume 0 — that would
// bypass the daily/monthly caps and risk Google billing.
async function getUsageSince(api: string, sinceDate: string): Promise<number> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('api_usage')
    .select('count')
    .eq('api', api)
    .gte('date', sinceDate);
  if (error) throw error;
  return ((data as { count: number }[] | null) ?? []).reduce(
    (sum, r) => sum + (r.count ?? 0),
    0,
  );
}

const utcToday = () => new Date().toISOString().slice(0, 10);
const utcMonthStart = () => utcToday().slice(0, 7) + '-01';

export const getTodayUsage = (api: string) => getUsageSince(api, utcToday());
export const getMonthUsage = (api: string) => getUsageSince(api, utcMonthStart());

export async function incrementUsage(api: string): Promise<number> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('increment_api_usage', { p_api: api });
  if (error) throw error;
  return (data as number) ?? 0;
}
