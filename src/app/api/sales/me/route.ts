import { NextResponse } from 'next/server';
import { requireSalesAuth } from '@/lib/sales-auth';
import { AuthError } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Returns the current sales user's profile. Used by client components that
// need to know the rep's id / role (e.g. to show the supervisor "All team" chip).
export async function GET() {
  try {
    const { salesUser } = await requireSalesAuth();
    return NextResponse.json({
      data: {
        id: salesUser.id,
        name: salesUser.name,
        email: salesUser.email,
        role: salesUser.role || 'salesperson',
      },
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
