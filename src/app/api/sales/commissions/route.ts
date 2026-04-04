import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSalesAuth } from '@/lib/sales-auth';
import { AuthError } from '@/lib/auth';
import {
  calculateSalespersonCommission,
  calculateSupervisorCommission,
  getPeriod,
} from '@/lib/commissions';

export async function GET(request: NextRequest) {
  try {
    const { salesUser } = await requireSalesAuth();
    const period = getPeriod(request.nextUrl.searchParams.get('period') || 'month');
    const supabase = createAdminClient();

    const result = salesUser.role === 'supervisor'
      ? await calculateSupervisorCommission(supabase, salesUser.id, period)
      : await calculateSalespersonCommission(supabase, salesUser.id, period);

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
