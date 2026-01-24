import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('bridge_config')
      .select('key, value')
      .in('key', ['bot_token', 'user_id']);

    const config: Record<string, string> = {};
    data?.forEach((row: { key: string; value: string }) => {
      config[row.key] = row.value;
    });

    return NextResponse.json({ config });
  } catch {
    return NextResponse.json({ config: {} });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { bot_token, user_id } = await request.json();

    if (!bot_token) {
      return NextResponse.json({ error: 'Bot token is required' }, { status: 400 });
    }

    const updates = [
      { key: 'bot_token', value: bot_token, updated_at: new Date().toISOString() },
    ];

    if (user_id) {
      updates.push({ key: 'user_id', value: user_id, updated_at: new Date().toISOString() });
    }

    const { error } = await supabase
      .from('bridge_config')
      .upsert(updates);

    if (error) {
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
