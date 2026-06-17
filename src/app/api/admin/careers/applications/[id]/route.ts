import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/sales-auth';
import { success, error, validationError, authErrorResponse } from '@/lib/api-response';
import { applicationStatusUpdateSchema } from '@/lib/validations/careers';
import { logger } from '@/lib/logger';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH — update an application's status.
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole(['admin', 'supervisor']);
    const { id } = await params;
    const body = await request.json();
    const result = applicationStatusUpdateSchema.safeParse(body);
    if (!result.success) return validationError(result.error);

    const supabase = createAdminClient();
    const { data, error: dbError } = await supabase
      .from('job_applications')
      .update({ status: result.data.status })
      .eq('id', id)
      .select()
      .single();
    if (dbError) {
      logger.error('Failed to update application', { error: dbError.message, id });
      return error('Failed to update application');
    }
    return success(data);
  } catch (err) {
    return authErrorResponse(err);
  }
}
