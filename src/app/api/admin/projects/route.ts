import { revalidatePath } from 'next/cache';
import { invalidateCache } from '@/lib/cache';
import { requireAuth, AuthError } from '@/lib/auth';
import {
  success,
  successWithPagination,
  error,
  validationError,
  unauthorized,
  getPaginationParams,
  createPaginationMeta,
} from '@/lib/api-response';
import { createProjectSchema } from '@/lib/validations';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  try {
    const { supabase, userId } = await requireAuth();
    const { page, limit, offset } = getPaginationParams(request.url);

    logger.db('select', 'projects', { userId });

    const { data, error: dbError, count } = await supabase
      .from('projects')
      .select('*', { count: 'exact' })
      .order('display_order', { ascending: true })
      .range(offset, offset + limit - 1);

    if (dbError) {
      logger.error('Failed to fetch projects', { error: dbError.message, userId });
      return error('Failed to fetch projects');
    }

    return successWithPagination(data || [], createPaginationMeta(page, limit, count));
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error('Unexpected error in GET /api/admin/projects', { error: String(err) });
    return error('Internal server error');
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, userId } = await requireAuth();
    const body = await request.json();

    // Validate input
    const result = createProjectSchema.safeParse(body);
    if (!result.success) {
      return validationError(result.error);
    }

    const validated = result.data;

    // Get the highest display_order
    const { data: lastProject } = await supabase
      .from('projects')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const display_order = validated.display_order ?? (lastProject ? lastProject.display_order + 1 : 0);

    logger.db('insert', 'projects', { userId });

    const { data, error: dbError } = await supabase
      .from('projects')
      .insert({
        title: validated.title,
        description: validated.description,
        image_url: validated.image_url || null,
        category: validated.category,
        technologies: validated.technologies,
        is_published: validated.is_published,
        display_order,
      })
      .select()
      .single();

    if (dbError) {
      logger.error('Failed to create project', { error: dbError.message, userId });
      return error('Failed to create project');
    }

    logger.audit('create', 'projects', data.id, userId, { title: validated.title });
    invalidateCache('projects');
    revalidatePath('/projects');
    revalidatePath('/');

    return success(data, 201);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error('Unexpected error in POST /api/admin/projects', { error: String(err) });
    return error('Internal server error');
  }
}
