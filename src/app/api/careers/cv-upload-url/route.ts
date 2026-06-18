import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { success, error, rateLimited } from '@/lib/api-response';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { CV_EXT_RE } from '@/lib/validations/careers';
import { logger } from '@/lib/logger';

// Issues a one-time signed URL so the browser can upload the CV straight to the
// private Storage bucket (bypassing the API-route body-size limit).
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  try {
    const rl = await checkRateLimit(ip, { maxRequests: 12, windowSeconds: 600, prefix: 'careers-upload' });
    if (!rl.allowed) return rateLimited();

    const body = await request.json().catch(() => null);
    const vacancyId = body?.vacancy_id;
    const filename = body?.filename;
    if (typeof vacancyId !== 'string' || typeof filename !== 'string') {
      return error('Invalid request', 400);
    }
    const ext = filename.match(CV_EXT_RE)?.[0]?.toLowerCase();
    if (!ext) return error('Unsupported file type. Use a PDF or Word document.', 400);

    const supabase = createAdminClient();
    const { data: vacancy } = await supabase
      .from('vacancies')
      .select('slug, is_open')
      .eq('id', vacancyId)
      .maybeSingle();
    if (!vacancy || !vacancy.is_open) return error('This position is no longer open.', 400);

    const path = `${vacancy.slug}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}${ext}`;
    const { data, error: signErr } = await supabase.storage
      .from('applications')
      .createSignedUploadUrl(path);
    if (signErr || !data) {
      logger.error('createSignedUploadUrl failed', { error: signErr?.message, ip });
      return error('Could not start the upload. Please try again.');
    }
    return success({ path: data.path, token: data.token, signedUrl: data.signedUrl });
  } catch (err) {
    logger.error('cv-upload-url error', { error: String(err), ip });
    return error('Something went wrong. Please try again.');
  }
}
