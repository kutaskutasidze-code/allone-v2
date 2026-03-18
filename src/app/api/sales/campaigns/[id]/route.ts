import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireSalesAuth } from '@/lib/sales-auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireSalesAuth();
    const supabase = await createClient();
    const { id } = await context.params;

    const { data, error } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Campaign GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch campaign' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    await requireSalesAuth();
    const supabase = await createClient();
    const { id } = await context.params;
    const body = await request.json();

    const { data, error } = await supabase
      .from('email_campaigns')
      .update({
        name: body.name,
        subject: body.subject,
        body_template: body.body_template,
        target_service: body.target_service,
        target_countries: body.target_countries,
        min_relevance_score: body.min_relevance_score,
        is_active: body.is_active,
        daily_limit: body.daily_limit,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Campaign PUT error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update campaign' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    await requireSalesAuth();
    const supabase = await createClient();
    const { id } = await context.params;

    const { error } = await supabase
      .from('email_campaigns')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Campaign DELETE error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete campaign' },
      { status: 500 }
    );
  }
}
