import { revalidatePath } from 'next/cache';
import { invalidateCache } from '@/lib/cache';
import { requireAuth, AuthError } from '@/lib/auth';
import { success, error, validationError, unauthorized } from '@/lib/api-response';
import { updateAboutContentSchema } from '@/lib/validations';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const { supabase, userId } = await requireAuth();

    logger.db('select', 'about_content', { userId });

    const { data, error: dbError } = await supabase
      .from('about_content')
      .select('*')
      .limit(1)
      .single();

    if (dbError && dbError.code !== 'PGRST116') {
      logger.error('Failed to fetch about content', { error: dbError.message, userId });
      return error('Failed to fetch about content');
    }

    return success(data || null);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error('Unexpected error in GET /api/admin/about', { error: String(err) });
    return error('Internal server error');
  }
}

export async function PUT(request: Request) {
  try {
    const { supabase, userId } = await requireAuth();
    const body = await request.json();

    // Validate input
    const result = updateAboutContentSchema.safeParse(body);
    if (!result.success) {
      return validationError(result.error);
    }

    const validated = result.data;

    // Check if record exists
    const { data: existing } = await supabase
      .from('about_content')
      .select('id')
      .limit(1)
      .single();

    logger.db(existing ? 'update' : 'insert', 'about_content', { userId });

    if (existing) {
      // Update existing record
      const { data, error: dbError } = await supabase
        .from('about_content')
        .update({
          ...validated,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (dbError) {
        logger.error('Failed to update about content', { error: dbError.message, userId });
        return error('Failed to update about content');
      }

      logger.audit('update', 'about_content', existing.id, userId);
      invalidateCache('about_content');
      revalidatePath('/about');

      return success(data);
    } else {
      // Insert new record
      const { data, error: dbError } = await supabase
        .from('about_content')
        .insert(validated)
        .select()
        .single();

      if (dbError) {
        logger.error('Failed to create about content', { error: dbError.message, userId });
        return error('Failed to create about content');
      }

      logger.audit('create', 'about_content', data.id, userId);
      invalidateCache('about_content');
      revalidatePath('/about');

      return success(data, 201);
    }
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error('Unexpected error in PUT /api/admin/about', { error: String(err) });
    return error('Internal server error');
  }
}
