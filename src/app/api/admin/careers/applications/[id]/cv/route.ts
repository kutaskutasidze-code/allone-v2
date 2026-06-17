import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/sales-auth';
import { error, notFound, authErrorResponse } from '@/lib/api-response';
import { logger } from '@/lib/logger';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET — redirect to a short-lived signed URL for the applicant's CV.
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole(['admin', 'supervisor']);
    const { id } = await params;

    const supabase = createAdminClient();
    const { data: app } = await supabase
      .from('job_applications')
      .select('cv_path')
      .eq('id', id)
      .maybeSingle();
    if (!app?.cv_path) return notFound('CV');

    const { data, error: signErr } = await supabase.storage
      .from('applications')
      .createSignedUrl(app.cv_path, 60);
    if (signErr || !data?.signedUrl) {
      logger.error('Failed to sign CV url', { error: signErr?.message, id });
      return error('Could not generate CV link');
    }
    return NextResponse.redirect(data.signedUrl);
  } catch (err) {
    return authErrorResponse(err);
  }
}
