import { revalidatePath } from 'next/cache';
import { invalidateCache } from '@/lib/cache';
import { requireAuth, AuthError } from '@/lib/auth';
import { success, error, validationError, unauthorized } from '@/lib/api-response';
import { updateContactInfoSchema } from '@/lib/validations';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const { supabase, userId } = await requireAuth();

    logger.db('select', 'contact_info', { userId });

    const { data, error: dbError } = await supabase
      .from('contact_info')
      .select('*')
      .limit(1)
      .single();

    if (dbError && dbError.code !== 'PGRST116') {
      logger.error('Failed to fetch contact info', { error: dbError.message, userId });
      return error('Failed to fetch contact info');
    }

    return success(data || null);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error('Unexpected error in GET /api/admin/contact-info', { error: String(err) });
    return error('Internal server error');
  }
}

export async function PUT(request: Request) {
  try {
    const { supabase, userId } = await requireAuth();
    const body = await request.json();

    // Validate input
    const result = updateContactInfoSchema.safeParse(body);
    if (!result.success) {
      return validationError(result.error);
    }

    const validated = result.data;

    // Check if record exists
    const { data: existing } = await supabase
      .from('contact_info')
      .select('id')
      .limit(1)
      .single();

    logger.db(existing ? 'update' : 'insert', 'contact_info', { userId });

    if (existing) {
      // Update existing record
      const { data, error: dbError } = await supabase
        .from('contact_info')
        .update({
          email: validated.email,
          location: validated.location,
          phone: validated.phone || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (dbError) {
        logger.error('Failed to update contact info', { error: dbError.message, userId });
        return error('Failed to update contact info');
      }

      logger.audit('update', 'contact_info', existing.id, userId);
      invalidateCache('contact_info');
      revalidatePath('/contact');

      return success(data);
    } else {
      // Insert new record
      const { data, error: dbError } = await supabase
        .from('contact_info')
        .insert({
          email: validated.email,
          location: validated.location,
          phone: validated.phone || null,
        })
        .select()
        .single();

      if (dbError) {
        logger.error('Failed to create contact info', { error: dbError.message, userId });
        return error('Failed to create contact info');
      }

      logger.audit('create', 'contact_info', data.id, userId);
      invalidateCache('contact_info');
      revalidatePath('/contact');

      return success(data, 201);
    }
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error('Unexpected error in PUT /api/admin/contact-info', { error: String(err) });
    return error('Internal server error');
  }
}
