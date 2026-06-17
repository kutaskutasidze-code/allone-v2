import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendApplicationNotification } from '@/lib/email';
import { success, error, validationError, rateLimited, methodNotAllowed } from '@/lib/api-response';
import { applicationSchema } from '@/lib/validations/careers';
import { checkCareersRateLimit, getClientIp } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

const MAX_CV_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  try {
    const rateLimit = await checkCareersRateLimit(request);
    if (!rateLimit.allowed) {
      logger.warn('Application rate limited', { ip });
      return rateLimited();
    }

    const form = await request.formData();

    // Honeypot — bots fill this hidden field.
    if (form.get('website_url')) {
      logger.info('Application honeypot triggered', { ip });
      return success({ message: 'Application received' });
    }

    const result = applicationSchema.safeParse({
      vacancy_id: form.get('vacancy_id'),
      name: form.get('name'),
      email: form.get('email'),
      phone: form.get('phone') ?? '',
      projects: form.get('projects') ?? '',
      note: form.get('note') ?? '',
    });
    if (!result.success) {
      return validationError(result.error);
    }
    const v = result.data;

    const cv = form.get('cv');
    if (!(cv instanceof File) || cv.size === 0) {
      return error('A CV file (PDF) is required.', 400);
    }
    if (cv.type !== 'application/pdf') {
      return error('CV must be a PDF file.', 400);
    }
    if (cv.size > MAX_CV_BYTES) {
      return error('CV must be 5 MB or smaller.', 400);
    }

    const supabase = createAdminClient();

    // Resolve the vacancy (must exist and be open) and snapshot its title.
    const { data: vacancy } = await supabase
      .from('vacancies')
      .select('id, slug, title, is_open')
      .eq('id', v.vacancy_id)
      .maybeSingle();
    if (!vacancy || !vacancy.is_open) {
      return error('This position is no longer open.', 400);
    }

    // Upload the CV to the private bucket.
    const cvPath = `${vacancy.slug}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.pdf`;
    const bytes = new Uint8Array(await cv.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from('applications')
      .upload(cvPath, bytes, { contentType: 'application/pdf', upsert: false });
    if (uploadError) {
      logger.error('CV upload failed', { error: uploadError.message, ip });
      return error('Could not upload your CV. Please try again.');
    }

    const { error: dbError } = await supabase.from('job_applications').insert({
      vacancy_id: vacancy.id,
      vacancy_title: vacancy.title,
      name: v.name,
      email: v.email,
      phone: v.phone || null,
      cv_path: cvPath,
      projects: v.projects || null,
      note: v.note || null,
      status: 'new',
    });
    if (dbError) {
      logger.error('Failed to save application', { error: dbError.message, ip });
      return error('Could not submit your application. Please try again.');
    }

    // Notify the team (non-fatal).
    try {
      await sendApplicationNotification({
        name: v.name,
        email: v.email,
        phone: v.phone,
        vacancyTitle: vacancy.title,
        projects: v.projects,
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
