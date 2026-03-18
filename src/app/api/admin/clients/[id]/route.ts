import { revalidatePath } from 'next/cache';
import { invalidateCache } from '@/lib/cache';
import { requireAuth, AuthError } from '@/lib/auth';
import { success, error, validationError, unauthorized, notFound } from '@/lib/api-response';
import { updateClientSchema, idParamSchema } from '@/lib/validations';
import { logger } from '@/lib/logger';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { supabase, userId } = await requireAuth();
    const { id } = await params;

    // Validate ID
    const idResult = idParamSchema.safeParse({ id });
    if (!idResult.success) {
      return validationError(idResult.error);
    }

    logger.db('select', 'clients', { userId, resourceId: id });

    const { data, error: dbError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (dbError) {
      if (dbError.code === 'PGRST116') {
        return notFound('Client');
      }
      logger.error('Failed to fetch client', { error: dbError.message, userId, resourceId: id });
      return error('Failed to fetch client');
    }

    return success(data);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error('Unexpected error in GET /api/admin/clients/[id]', { error: String(err) });
    return error('Internal server error');
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { supabase, userId } = await requireAuth();
    const { id } = await params;

    // Validate ID
    const idResult = idParamSchema.safeParse({ id });
    if (!idResult.success) {
      return validationError(idResult.error);
    }

    const body = await request.json();

    // Validate input
    const result = updateClientSchema.safeParse(body);
    if (!result.success) {
      return validationError(result.error);
    }

    const validated = result.data;

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.logo_text !== undefined) updateData.logo_text = validated.logo_text;
    if (validated.logo_url !== undefined) updateData.logo_url = validated.logo_url;
    if (validated.is_published !== undefined) updateData.is_published = validated.is_published;
    if (validated.display_order !== undefined) updateData.display_order = validated.display_order;

    logger.db('update', 'clients', { userId, resourceId: id });

    const { data, error: dbError } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (dbError) {
      if (dbError.code === 'PGRST116') {
        return notFound('Client');
      }
      logger.error('Failed to update client', { error: dbError.message, userId, resourceId: id });
      return error('Failed to update client');
    }

    logger.audit('update', 'clients', id, userId);
    invalidateCache('clients');
    revalidatePath('/');

    return success(data);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error('Unexpected error in PUT /api/admin/clients/[id]', { error: String(err) });
    return error('Internal server error');
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { supabase, userId } = await requireAuth();
    const { id } = await params;

    // Validate ID
    const idResult = idParamSchema.safeParse({ id });
    if (!idResult.success) {
      return validationError(idResult.error);
    }

    logger.db('delete', 'clients', { userId, resourceId: id });

    const { error: dbError } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (dbError) {
      logger.error('Failed to delete client', { error: dbError.message, userId, resourceId: id });
      return error('Failed to delete client');
    }

    logger.audit('delete', 'clients', id, userId);
    invalidateCache('clients');
    revalidatePath('/');

    return success({ deleted: true });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error('Unexpected error in DELETE /api/admin/clients/[id]', { error: String(err) });
    return error('Internal server error');
  }
}
