import { revalidatePath } from 'next/cache';
import { requireSalesAuth } from '@/lib/sales-auth';
import { AuthError } from '@/lib/auth';
import {
  success,
  error,
  validationError,
  unauthorized,
  notFound,
  forbidden,
} from '@/lib/api-response';
import { updateLeadSchema } from '@/lib/validations/leads';
import { idParamSchema } from '@/lib/validations';
import { logger } from '@/lib/logger';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { supabase, salesUser } = await requireSalesAuth();
    const { id } = await params;

    // Validate ID
    const idResult = idParamSchema.safeParse({ id });
    if (!idResult.success) {
      return validationError(idResult.error);
    }

    logger.db('select', 'leads', { userId: salesUser.id, resourceId: id });

    const { data, error: dbError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (dbError) {
      if (dbError.code === 'PGRST116') {
        return notFound('Lead');
      }
      logger.error('Failed to fetch lead', { error: dbError.message, userId: salesUser.id, resourceId: id });
      return error('Failed to fetch lead');
    }

    // Check ownership
    if (data.sales_user_id !== salesUser.id) {
      return forbidden();
    }

    return success(data);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error('Unexpected error in GET /api/sales/leads/[id]', { error: String(err) });
    return error('Internal server error');
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { supabase, salesUser } = await requireSalesAuth();
    const { id } = await params;
    const body = await request.json();

    // Validate ID
    const idResult = idParamSchema.safeParse({ id });
    if (!idResult.success) {
      return validationError(idResult.error);
    }

    // Validate input
    const result = updateLeadSchema.safeParse(body);
    if (!result.success) {
      return validationError(result.error);
    }

    // Check ownership first
    const { data: existingLead, error: fetchError } = await supabase
      .from('leads')
      .select('sales_user_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return notFound('Lead');
      }
      return error('Failed to fetch lead');
    }

    if (existingLead.sales_user_id !== salesUser.id) {
      return forbidden();
    }

    const validated = result.data;

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.email !== undefined) updateData.email = validated.email;
    if (validated.phone !== undefined) updateData.phone = validated.phone;
    if (validated.company !== undefined) updateData.company = validated.company;
    if (validated.status !== undefined) updateData.status = validated.status;
    if (validated.value !== undefined) updateData.value = validated.value;
    if (validated.source !== undefined) updateData.source = validated.source;
    if (validated.notes !== undefined) updateData.notes = validated.notes;

    logger.db('update', 'leads', { userId: salesUser.id, resourceId: id });

    const { data, error: dbError } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (dbError) {
      logger.error('Failed to update lead', { error: dbError.message, userId: salesUser.id, resourceId: id });
      return error('Failed to update lead');
    }

    logger.audit('update', 'leads', id, salesUser.id);
    revalidatePath('/sales/leads');
    revalidatePath('/sales');

    return success(data);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error('Unexpected error in PUT /api/sales/leads/[id]', { error: String(err) });
    return error('Internal server error');
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { supabase, salesUser } = await requireSalesAuth();
    const { id } = await params;

    // Validate ID
    const idResult = idParamSchema.safeParse({ id });
    if (!idResult.success) {
      return validationError(idResult.error);
    }

    // Check ownership first
    const { data: existingLead, error: fetchError } = await supabase
      .from('leads')
      .select('sales_user_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return notFound('Lead');
      }
      return error('Failed to fetch lead');
    }

    if (existingLead.sales_user_id !== salesUser.id) {
      return forbidden();
    }

    logger.db('delete', 'leads', { userId: salesUser.id, resourceId: id });

    const { error: dbError } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);

    if (dbError) {
      logger.error('Failed to delete lead', { error: dbError.message, userId: salesUser.id, resourceId: id });
      return error('Failed to delete lead');
    }

    logger.audit('delete', 'leads', id, salesUser.id);
    revalidatePath('/sales/leads');
    revalidatePath('/sales');

    return success({ message: 'Lead deleted successfully' });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error('Unexpected error in DELETE /api/sales/leads/[id]', { error: String(err) });
    return error('Internal server error');
  }
}
