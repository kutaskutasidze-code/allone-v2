import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Get user's projects
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { data: projects, error } = await supabase
      .from('user_projects')
      .select('*')
      .eq('user_id', user.id)
      .neq('status', 'deleted')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create a new project
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check subscription
    const adminClient = createAdminClient();
    const { data: subscription } = await adminClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'past_due'])
      .single();

    if (!subscription) {
      return NextResponse.json({ error: 'Active subscription required' }, { status: 403 });
    }

    const { name, description, type } = await request.json();

    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 });
    }

    if (!['voice_agent', 'rag_bot', 'automation'].includes(type)) {
      return NextResponse.json({ error: 'Invalid project type' }, { status: 400 });
    }

    // Check limits
    const limits = subscription.limits || { voice_agents: 3, rag_bots: 5, automations: 10 };
    const limitKey = type === 'voice_agent' ? 'voice_agents' : type === 'rag_bot' ? 'rag_bots' : 'automations';
    const limit = limits[limitKey] || 0;

    const { count } = await adminClient
      .from('user_projects')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('type', type)
      .neq('status', 'deleted');

    if ((count || 0) >= limit) {
      return NextResponse.json({ error: `You've reached the limit of ${limit} ${type.replace('_', ' ')}s` }, { status: 403 });
    }

    // Create project
    const { data: project, error } = await adminClient
      .from('user_projects')
      .insert({
        user_id: user.id,
        name,
        description,
        type,
        config: {},
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Create project error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
