import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendApplicationNotification } from '@/lib/email';
import { success, error, validationError, rateLimited, methodNotAllowed } from '@/lib/api-response';
import { applicationSchema, CV_EXT_RE } from '@/lib/validations/careers';
import { checkCareersRateLimit, getClientIp } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

// The CV was already uploaded to Storage (see /api/careers/cv-upload-url); the
// body just references it via cv_path.
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  try {
    const rateLimit = await checkCareersRateLimit(request);
    if (!rateLimit.allowed) {
      logger.warn('Application rate limited', { ip });
      return rateLimited();
    }

    const body = await request.json().catch(() => null);

    // Honeypot — bots fill this hidden field.
    if (body?.website_url) {
      logger.info('Application honeypot triggered', { ip });
      return success({ message: 'Application received' });
    }

    const result = applicationSchema.safeParse(body);
    if (!result.success) return validationError(result.error);
    const v = result.data;

    if (!CV_EXT_RE.test(v.cv_path)) return error('Unsupported CV file type.', 400);

    const supabase = createAdminClient();

    const { data: vacancy } = await supabase
      .from('vacancies')
      .select('id, slug, title, is_open')
      .eq('id', v.vacancy_id)
      .maybeSingle();
    if (!vacancy || !vacancy.is_open) return error('This position is no longer open.', 400);

    // The CV path must live in this vacancy's folder (it was issued server-side).
    if (!v.cv_path.startsWith(`${vacancy.slug}/`)) return error('Invalid CV reference.', 400);

    const { error: dbError } = await supabase.from('job_applications').insert({
      vacancy_id: vacancy.id,
      vacancy_title: vacancy.title,
      name: v.name,
      email: v.email,
      phone: v.phone || null,
      linkedin: v.linkedin || null,
      cv_path: v.cv_path,
      note: v.note || null,
      status: 'new',
    });
    if (dbError) {
      logger.error('Failed to save application', { error: dbError.message, ip });
      return error('Could not submit your application. Please try again.');
    }

    try {
      await sendApplicationNotification({
        name: v.name,
        email: v.email,
        phone: v.phone,
        linkedin: v.linkedin,
        vacancyTitle: vacancy.title,
        note: v.note,
        hasCv: true,
      });
    } catch (mailErr) {
      logger.error('Application email failed', { error: String(mailErr) });
    }

    return success({ message: 'Application received' });
  } catch (err) {
    logger.error('Application error', { error: String(err), ip });
    return error('Something went wrong. Please try again later.');
  }
}

export async function GET() {
  return methodNotAllowed();
}
