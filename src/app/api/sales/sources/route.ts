import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireSalesAuth } from '@/lib/sales-auth';

export async function GET() {
  try {
    await requireSalesAuth();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('lead_sources')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Sources GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch sources' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireSalesAuth();
    const supabase = await createClient();
    const body = await request.json();

    const { id, is_active } = body;

    const { data, error } = await supabase
      .from('lead_sources')
      .update({ is_active })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Sources PATCH error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update source' },
      { status: 500 }
    );
  }
}
