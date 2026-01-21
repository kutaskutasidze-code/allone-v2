/**
 * POST /api/ecosystem/voice-agent
 * Create a new voice AI agent via voice-noob
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { voiceNoobClient } from '@/lib/voice-noob/client';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, system_prompt, voice_id, ai_tier, tools, assign_phone } = body;

    if (!name || !system_prompt) {
      return NextResponse.json(
        { error: 'Name and system_prompt are required' },
        { status: 400 }
      );
    }

    // Create agent in voice-noob
    const agent = await voiceNoobClient.createAgent({
      name,
      system_prompt,
      voice_id: voice_id || 'alloy',
      ai_tier: ai_tier || 'balanced',
      tools: tools || ['end_call'],
    });

    // Assign phone number if requested
    let phoneNumber: string | undefined;
    if (assign_phone) {
      try {
        const phoneResult = await voiceNoobClient.assignPhoneNumber(agent.id);
        phoneNumber = phoneResult.phone_number;
      } catch (phoneError) {
        console.error('Failed to assign phone number:', phoneError);
      }
    }

    // Store in user_products table
    const { data: product, error: dbError } = await supabase
      .from('user_products')
      .insert({
        user_id: user.id,
        name,
        description: `Voice AI agent: ${name}`,
        type: 'voice_agent',
        deployment_id: agent.id,
        system_prompt,
        agent_config: {
          voice_noob_id: agent.id,
          voice_id: agent.voice_id,
          ai_tier: agent.ai_tier,
          tools: agent.tools,
          phone_number: phoneNumber || agent.phone_number,
        },
        status: 'active',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Failed to save product:', dbError);
      // Try to cleanup voice-noob agent
      try {
        await voiceNoobClient.deleteAgent(agent.id);
      } catch {
        // Ignore cleanup error
      }
      return NextResponse.json({ error: 'Failed to save voice agent' }, { status: 500 });
    }

    // Track usage
    await supabase.rpc('record_usage', {
      p_user_id: user.id,
      p_product_id: product.id,
      p_event_type: 'api_call',
      p_quantity: 1,
      p_metadata: { action: 'create_voice_agent' },
    });

    return NextResponse.json({
      product,
      agent,
      phone_number: phoneNumber || agent.phone_number,
      embed_code: voiceNoobClient.getEmbedCode(agent.id),
    }, { status: 201 });

  } catch (error) {
    console.error('Create voice agent error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create voice agent' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: voiceAgents, error } = await supabase
      .from('user_products')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'voice_agent')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch voice agents' }, { status: 500 });
    }

    // Fetch stats from voice-noob for each agent
    const enrichedAgents = await Promise.all(
      (voiceAgents || []).map(async (agent) => {
        try {
          if (agent.agent_config?.voice_noob_id) {
            const stats = await voiceNoobClient.getAgentStats(agent.agent_config.voice_noob_id);
            return {
              ...agent,
              stats,
            };
          }
        } catch {
          // Agent might not exist in voice-noob
        }
        return agent;
      })
    );

    return NextResponse.json({ voice_agents: enrichedAgents });
  } catch (error) {
    console.error('List voice agents error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
