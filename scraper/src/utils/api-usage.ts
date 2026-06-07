import { getSupabase } from '../database/client.js';

export async function getTodayUsage(api: string): Promise<number> {
  const supabase = getSupabase();
  const today = new Date().toISOString().slice(0, 10);
  // Fail closed: if we can't read usage, refuse to assume 0 — that would
  // bypass the daily cap and risk Google billing.
  const { data, error } = await supabase
    .from('api_usage')
    .select('count')
    .eq('api', api)
    .eq('date', today)
    .maybeSingle();
  if (error) throw error;
  return (data as { count: number } | null)?.count ?? 0;
}

export async function getMonthUsage(api: string): Promise<number> {
  const supabase = getSupabase();
  const now = new Date();
  const monthStart = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-01`;
  // Fail closed: if we can't read usage, refuse to assume 0 — that would
  // bypass the monthly free-tier cap and risk Google billing.
  const { data, error } = await supabase
    .from('api_usage')
    .select('count')
    .eq('api', api)
    .gte('date', monthStart);
  if (error) throw error;
  return ((data as { count: number }[] | null) ?? []).reduce(
    (sum, r) => sum + (r.count ?? 0),
    0,
  );
}

export async function incrementUsage(api: string): Promise<number> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('increment_api_usage', { p_api: api });
  if (error) throw error;
  return (data as number) ?? 0;
}
