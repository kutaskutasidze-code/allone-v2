import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('pitch_content')
      .select('content')
      .eq('id', 1)
      .single();

    if (error || !data) {
      return NextResponse.json({ content: null });
    }

    return NextResponse.json({ content: data.content });
  } catch {
    return NextResponse.json({ content: null });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { content } = await request.json();

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('pitch_content')
      .upsert({ id: 1, content, updated_at: new Date().toISOString() });

    if (error) {
      console.error('Save error:', error);
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Content API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
