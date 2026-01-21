import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get profile from profiles table
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Profile fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      full_name: profile?.full_name || user.user_metadata?.full_name || '',
      company: profile?.company || '',
      avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || '',
      avatar_style: profile?.avatar_style || 'avataaars',
      avatar_seed: profile?.avatar_seed || user.email || user.id,
      custom_avatar_url: profile?.custom_avatar_url || null,
      created_at: user.created_at,
    });
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { full_name, company, avatar_style, avatar_seed, custom_avatar_url } = body;

    // Build update object - only include fields that were provided
    const profileUpdate: Record<string, unknown> = {
      id: user.id,
      updated_at: new Date().toISOString(),
    };

    if (full_name !== undefined) profileUpdate.full_name = full_name;
    if (company !== undefined) profileUpdate.company = company;
    if (avatar_style !== undefined) profileUpdate.avatar_style = avatar_style;
    if (avatar_seed !== undefined) profileUpdate.avatar_seed = avatar_seed;
    if (custom_avatar_url !== undefined) profileUpdate.custom_avatar_url = custom_avatar_url;

    // Update auth user metadata for full_name
    if (full_name !== undefined) {
      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: { full_name },
      });

      if (authUpdateError) {
        console.error('Auth update error:', authUpdateError);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
      }
    }

    // Upsert profile in profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(profileUpdate, {
        onConflict: 'id',
      });

    if (profileError) {
      console.error('Profile update error:', profileError);
      // Don't fail if profiles table doesn't exist
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated',
    });
  } catch (error) {
    console.error('Profile PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
