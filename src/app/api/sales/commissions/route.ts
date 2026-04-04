import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { requireSalesAuth } from '@/lib/sales-auth';
import { AuthError } from '@/lib/auth';
import {
  calculateSalespersonCommission,
  calculateSupervisorCommission,
  getPeriod,
} from '@/lib/commissions';

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(request: NextRequest) {
  try {
    const { salesUser } = await requireSalesAuth();
    const period = getPeriod(request.nextUrl.searchParams.get('period') || 'month');
    const supabase = getServiceClient();

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
