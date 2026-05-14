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

export async function incrementUsage(api: string): Promise<number> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('increment_api_usage', { p_api: api });
  if (error) throw error;
  return (data as number) ?? 0;
}
