import { revalidatePath } from 'next/cache';
import { requireSalesAuth } from '@/lib/sales-auth';
import { AuthError } from '@/lib/auth';
import {
  success,
  successWithPagination,
  error,
  validationError,
  unauthorized,
  getPaginationParams,
  createPaginationMeta,
} from '@/lib/api-response';
import { createLeadSchema } from '@/lib/validations/leads';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  try {
    const { supabase, salesUser } = await requireSalesAuth();
    const { page, limit, offset } = getPaginationParams(request.url);
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');

    logger.db('select', 'leads', { userId: salesUser.id });

    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .eq('sales_user_id', salesUser.id)
      .order('created_at', { ascending: false });

    // Filter by status if provided
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Search by name, email, or company
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`);
    }

    const { data, error: dbError, count } = await query.range(offset, offset + limit - 1);

    if (dbError) {
      logger.error('Failed to fetch leads', { error: dbError.message, userId: salesUser.id });
      return error('Failed to fetch leads');
    }

    return successWithPagination(data || [], createPaginationMeta(page, limit, count));
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error('Unexpected error in GET /api/sales/leads', { error: String(err) });
    return error('Internal server error');
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, salesUser } = await requireSalesAuth();
    const body = await request.json();

    // Validate input
    const result = createLeadSchema.safeParse(body);
    if (!result.success) {
      return validationError(result.error);
    }

    const validated = result.data;

    logger.db('insert', 'leads', { userId: salesUser.id });

    const { data, error: dbError } = await supabase
      .from('leads')
      .insert({
        sales_user_id: salesUser.id,
        name: validated.name,
        email: validated.email,
        phone: validated.phone,
        company: validated.company,
        status: validated.status,
        value: validated.value,
        source: validated.source,
        notes: validated.notes,
      })
      .select()
      .single();

    if (dbError) {
      logger.error('Failed to create lead', { error: dbError.message, userId: salesUser.id });
      return error('Failed to create lead');
    }

    logger.audit('create', 'leads', data.id, salesUser.id, { name: validated.name });
    revalidatePath('/sales/leads');
    revalidatePath('/sales');

    return success(data, 201);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error('Unexpected error in POST /api/sales/leads', { error: String(err) });
    return error('Internal server error');
  }
}
