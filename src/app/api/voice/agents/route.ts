import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { voiceNoobClient, CreateAgentInput } from '@/lib/voice-noob/client';

// Get user's voice agents
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
      .eq('type', 'voice_agent')
      .neq('status', 'deleted')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Get voice agents error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create a new voice agent
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

    const body = await request.json();
    const { name, description, systemPrompt, voiceId, aiTier, tools } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Check limits
    const limits = subscription.limits || { voice_agents: 3 };
    const { count } = await adminClient
      .from('user_projects')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('type', 'voice_agent')
      .neq('status', 'deleted');

    if ((count || 0) >= (limits.voice_agents || 3)) {
      return NextResponse.json({
        error: `You've reached the limit of ${limits.voice_agents || 3} voice agents`
      }, { status: 403 });
    }

    // Create agent in voice-noob (if configured)
    let externalId: string | undefined;
    try {
      if (process.env.VOICE_NOOB_API_URL) {
        const agentInput: CreateAgentInput = {
          name,
          system_prompt: systemPrompt || `You are ${name}, a helpful AI assistant.`,
          voice_id: voiceId,
          ai_tier: aiTier,
          tools,
        };
        const voiceAgent = await voiceNoobClient.createAgent(agentInput);
        externalId = voiceAgent.id;
      }
    } catch (voiceError) {
      console.error('Voice-noob agent creation failed:', voiceError);
      // Continue without external agent - can be configured later
    }

    // Create project record
    const { data: project, error } = await adminClient
      .from('user_projects')
      .insert({
        user_id: user.id,
        name,
        description,
        type: 'voice_agent',
        external_id: externalId,
        config: {
          system_prompt: systemPrompt || `You are ${name}, a helpful AI assistant.`,
          voice_id: voiceId || 'alloy',
          ai_tier: aiTier || 'balanced',
          tools: tools || ['end_call'],
        },
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ...project,
      embed_code: voiceNoobClient.getEmbedCode(project.id),
    });
  } catch (error) {
    console.error('Create voice agent error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
