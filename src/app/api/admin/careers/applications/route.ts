import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/sales-auth';
import { success, error, authErrorResponse } from '@/lib/api-response';
import { logger } from '@/lib/logger';

// GET — list applications, optionally filtered by vacancy and status.
export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin', 'supervisor']);
    const { searchParams } = new URL(request.url);
    const vacancyId = searchParams.get('vacancy_id');
    const status = searchParams.get('status');

    const supabase = createAdminClient();
    let query = supabase
      .from('job_applications')
      .select('*')
      .order('created_at', { ascending: false });
    if (vacancyId && vacancyId !== 'all') query = query.eq('vacancy_id', vacancyId);
    if (status && status !== 'all') query = query.eq('status', status);

    const { data, error: dbError } = await query;
    if (dbError) {
      logger.error('Failed to list applications', { error: dbError.message });
      return error('Failed to load applications');
    }
    return success(data || []);
  } catch (err) {
    return authErrorResponse(err);
  }
}
