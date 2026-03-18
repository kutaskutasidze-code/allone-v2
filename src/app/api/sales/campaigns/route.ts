import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireSalesAuth } from '@/lib/sales-auth';

export async function GET(request: NextRequest) {
  try {
    await requireSalesAuth();
    const supabase = await createClient();

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const service = searchParams.get('service');

    let query = supabase
      .from('email_campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    }

    if (service) {
      query = query.eq('target_service', service);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Campaigns GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSalesAuth();
    const supabase = await createClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from('email_campaigns')
      .insert({
        name: body.name,
        subject: body.subject,
        body_template: body.body_template,
        target_service: body.target_service || null,
        target_countries: body.target_countries || [],
        min_relevance_score: body.min_relevance_score || 0,
        is_active: body.is_active ?? true,
        daily_limit: body.daily_limit || 50,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Campaigns POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create campaign' },
      { status: 500 }
    );
  }
}
