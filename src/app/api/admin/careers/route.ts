import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/sales-auth';
import { success, error, validationError, authErrorResponse } from '@/lib/api-response';
import { vacancySchema, slugify } from '@/lib/validations/careers';
import { logger } from '@/lib/logger';

// GET — list all vacancies (admin), with applicant counts.
export async function GET() {
  try {
    await requireRole(['admin', 'supervisor']);
    const supabase = createAdminClient();

    const { data: vacancies, error: vErr } = await supabase
      .from('vacancies')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });
    if (vErr) {
      logger.error('Failed to list vacancies', { error: vErr.message });
      return error('Failed to load vacancies');
    }

    const { data: apps } = await supabase.from('job_applications').select('vacancy_id');
    const counts: Record<string, number> = {};
    for (const a of apps || []) {
      if (a.vacancy_id) counts[a.vacancy_id] = (counts[a.vacancy_id] || 0) + 1;
    }

    const withCounts = (vacancies || []).map((v) => ({ ...v, applicant_count: counts[v.id] || 0 }));
    return success(withCounts);
  } catch (err) {
    return authErrorResponse(err);
  }
}

// POST — create a vacancy.
export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin', 'supervisor']);
    const body = await request.json();
    const result = vacancySchema.safeParse(body);
    if (!result.success) return validationError(result.error);
    const v = result.data;

    const supabase = createAdminClient();
    const baseSlug = (v.slug && v.slug.trim()) || slugify(v.title);

    const insert = (slug: string) =>
      supabase
        .from('vacancies')
        .insert({
          slug,
          title: v.title,
          department: v.department || null,
          employment_type: v.employment_type,
          location: v.location || null,
          summary: v.summary || null,
          description_md: v.description_md || null,
          is_open: v.is_open,
          sort_order: v.sort_order,
        })
        .select()
        .single();

    let { data, error: dbError } = await insert(baseSlug);
    if (dbError && dbError.code === '23505') {
      // slug collision — retry once with a short suffix
      ({ data, error: dbError } = await insert(`${baseSlug}-${Date.now().toString(36).slice(-4)}`));
    }
    if (dbError) {
      logger.error('Failed to create vacancy', { error: dbError.message });
      return error('Failed to create vacancy');
    }
    return success(data, 201);
  } catch (err) {
    return authErrorResponse(err);
  }
}
