import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { salesUserIndustriesSchema } from '@/lib/validations/leads';

export const dynamic = 'force-dynamic';

const createSchema = z.object({
  email: z.string().email().transform(s => s.toLowerCase().trim()),
  name: z.string().min(1).max(255),
  role: z.enum(['salesperson', 'supervisor', 'admin']).default('salesperson'),
  daily_target: z.number().int().min(0).max(10000).default(80),
  industries: salesUserIndustriesSchema.default([]),
});

// Lightweight directory of sales users for the admin assign UI.
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('sales_users')
      .select('id, name, email, role, is_active, daily_target, industries')
      .order('name', { ascending: true });

    if (error) {
      logger.error('Failed to list sales users', { error: error.message });
      return NextResponse.json({ error: 'Failed to list sales users' }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (err) {
    logger.error('Unexpected error in GET /api/admin/sales-users', { error: String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create a new sales rep. Note: this only creates the sales_users row.
// The user still needs a corresponding Supabase Auth account to log in.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('sales_users')
      .insert(parsed.data)
      .select('id, name, email, role, is_active, daily_target, industries')
      .single();

    if (error) {
      // 23505 = unique_violation (email already exists)
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A rep with this email already exists' }, { status: 409 });
      }
      logger.error('Failed to create sales user', { error: error.message });
      return NextResponse.json({ error: 'Failed to create rep' }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    logger.error('Unexpected error in POST /api/admin/sales-users', { error: String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
