import { requireAuth, AuthError } from '@/lib/auth';
import { verifyClaudeApiKey, getServiceClient } from '@/lib/claude-auth';
import {
  success,
  successWithPagination,
  error,
  unauthorized,
  getPaginationParams,
  createPaginationMeta,
} from '@/lib/api-response';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  try {
    const { supabase, userId } = await requireAuth();
    const { page, limit, offset } = getPaginationParams(request.url);
    const { searchParams } = new URL(request.url);
    const verified = searchParams.get('verified');
    const action = searchParams.get('action');

    logger.db('select', 'claude_upgrades', { userId });

    let query = supabase
      .from('claude_upgrades')
      .select('*', { count: 'exact' });

    if (verified !== null) {
      query = query.eq('verified', verified === 'true');
    }
    if (action) {
      query = query.eq('action', action);
    }

    const { data, error: dbError, count } = await query
      .order('reported_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (dbError) {
      logger.error('Failed to fetch upgrades', { error: dbError.message, userId });
      return error('Failed to fetch upgrades');
    }

    return successWithPagination(data || [], createPaginationMeta(page, limit, count));
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error('Unexpected error in GET /api/admin/claude/upgrades', { error: String(err) });
    return error('Internal server error');
  }
}

export async function POST(request: Request) {
  try {
    // Check for Claude API key (for self-reporting)
    const isClaudeRequest = verifyClaudeApiKey(request);

    let supabase;
    let userId = 'claude-self-report';

    if (isClaudeRequest) {
      supabase = getServiceClient();
    } else {
      const auth = await requireAuth();
      supabase = auth.supabase;
      userId = auth.userId;
    }

    const body = await request.json();

    // Validate required fields
    if (!body.action || !body.description) {
      return error('action and description are required', 400);
    }

    // If capability info provided, look it up or create it
    let capabilityId = body.capability_id;
    let capabilityName = body.capability_name;
    let capabilityCategory = body.capability_category;

    if (body.capability && !capabilityId) {
      // Look up or create capability
      const { data: existing } = await supabase
        .from('claude_capabilities')
        .select('id, name, category')
        .eq('name', body.capability.name)
        .single();

      if (existing) {
        capabilityId = existing.id;
        capabilityName = existing.name;
        capabilityCategory = existing.category;
      } else {
        // Create new capability
        const { data: newCap } = await supabase
          .from('claude_capabilities')
          .insert({
            name: body.capability.name,
            category: body.capability.category,
            source: body.capability.source || null,
            status: body.capability.status || 'active',
          })
          .select()
          .single();

        if (newCap) {
          capabilityId = newCap.id;
          capabilityName = newCap.name;
          capabilityCategory = newCap.category;
        }
      }
    }

    logger.db('insert', 'claude_upgrades', { userId });

    const { data, error: dbError } = await supabase
      .from('claude_upgrades')
      .insert({
        capability_id: capabilityId || null,
        capability_name: capabilityName || body.capability?.name || null,
        capability_category: capabilityCategory || body.capability?.category || null,
        action: body.action,
        description: body.description,
        details: body.details || {},
        verified: false,
      })
      .select()
      .single();

    if (dbError) {
      logger.error('Failed to create upgrade', { error: dbError.message, userId });
      return error('Failed to create upgrade');
    }

    logger.audit('create', 'claude_upgrades', data.id, userId, { action: body.action });

    return success(data, 201);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error('Unexpected error in POST /api/admin/claude/upgrades', { error: String(err) });
    return error('Internal server error');
  }
}

export async function PATCH(request: Request) {
  try {
    const { supabase, userId } = await requireAuth();
    const body = await request.json();

    if (!body.id) {
      return error('id is required', 400);
    }

    logger.db('update', 'claude_upgrades', { userId, id: body.id });

    const updateData: Record<string, unknown> = {};
    if (typeof body.verified === 'boolean') {
      updateData.verified = body.verified;
    }
    if (body.verification_notes !== undefined) {
      updateData.verification_notes = body.verification_notes;
    }

    const { data, error: dbError } = await supabase
      .from('claude_upgrades')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single();

    if (dbError) {
      logger.error('Failed to update upgrade', { error: dbError.message, userId });
      return error('Failed to update upgrade');
    }

    logger.audit('update', 'claude_upgrades', body.id, userId, updateData);

    return success(data);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error('Unexpected error in PATCH /api/admin/claude/upgrades', { error: String(err) });
    return error('Internal server error');
  }
}
