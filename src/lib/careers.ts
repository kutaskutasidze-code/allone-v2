import { createAdminClient } from '@/lib/supabase/admin';
import type { Vacancy } from '@/lib/validations/careers';

// Server-only data helpers for the public careers pages (service role).

export async function getOpenVacancies(): Promise<Vacancy[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('vacancies')
    .select('*')
    .eq('is_open', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  return (data as Vacancy[]) || [];
}

export async function getVacancyBySlug(slug: string): Promise<Vacancy | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('vacancies')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  return (data as Vacancy) || null;
}
