import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireSalesAuth } from '@/lib/sales-auth';

export async function GET(request: NextRequest) {
  try {
    await requireSalesAuth();
    const supabase = await createClient();

    const searchParams = request.nextUrl.searchParams;
    const service = searchParams.get('service');
    const language = searchParams.get('language');

    let query = supabase
      .from('email_templates')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (service) {
      query = query.eq('target_service', service);
    }

    if (language) {
      query = query.eq('language', language);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Templates GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch templates' },
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
      .from('email_templates')
      .insert({
        name: body.name,
        description: body.description || null,
        subject: body.subject,
        body: body.body,
        target_service: body.target_service || null,
        language: body.language || 'en',
        is_active: body.is_active ?? true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Templates POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create template' },
      { status: 500 }
    );
  }
}
