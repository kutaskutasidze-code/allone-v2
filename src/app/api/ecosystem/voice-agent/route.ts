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
    const { name, system_prompt, description, voice_id, ai_tier, tools, assign_phone } = body;

    // Handle both "system_prompt" and "systemPrompt" from AI Studio
    const finalSystemPrompt = system_prompt || body.systemPrompt;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Default system prompt if none provided
    const agentSystemPrompt = finalSystemPrompt || `You are ${name}, a helpful AI assistant. Be friendly, professional, and helpful to callers.`;

    // Try to create agent in voice-noob, but continue even if it fails
    let voiceNoobAgent = null;
    let phoneNumber: string | undefined;
    let voiceNoobError: string | undefined;

    try {
      voiceNoobAgent = await voiceNoobClient.createAgent({
        name,
        system_prompt: agentSystemPrompt,
        voice_id: voice_id || 'alloy',
        ai_tier: ai_tier || 'balanced',
        tools: tools || ['end_call'],
      });

      // Try to assign phone number if agent was created
      const shouldAssignPhone = assign_phone !== false;
      if (shouldAssignPhone && voiceNoobAgent?.id) {
        try {
          const phoneResult = await voiceNoobClient.assignPhoneNumber(voiceNoobAgent.id);
          phoneNumber = phoneResult.phone_number;
        } catch (phoneError) {
          console.error('Failed to assign phone number:', phoneError);
        }
      }
    } catch (voiceError) {
      console.error('Voice-noob API error:', voiceError);
      voiceNoobError = voiceError instanceof Error ? voiceError.message : 'Voice service unavailable';
      // Continue - we'll still create the product in Supabase
    }

    // Store in user_products table (even if voice-noob failed)
    const { data: product, error: dbError } = await supabase
      .from('user_products')
      .insert({
        user_id: user.id,
        name,
        description: description || `Voice AI agent: ${name}`,
        type: 'voice_agent',
        deployment_id: voiceNoobAgent?.id || null,
        system_prompt: agentSystemPrompt,
        agent_config: {
          voice_noob_id: voiceNoobAgent?.id || null,
          voice_id: voiceNoobAgent?.voice_id || voice_id || 'alloy',
          ai_tier: voiceNoobAgent?.ai_tier || ai_tier || 'balanced',
          tools: voiceNoobAgent?.tools || tools || ['end_call'],
          phone_number: phoneNumber || voiceNoobAgent?.phone_number || null,
          pending_setup: !voiceNoobAgent, // Flag if voice-noob setup is pending
        },
        status: voiceNoobAgent ? 'active' : 'draft',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Failed to save product:', dbError);
      // Try to cleanup voice-noob agent if it was created
      if (voiceNoobAgent?.id) {
        try {
          await voiceNoobClient.deleteAgent(voiceNoobAgent.id);
        } catch {
          // Ignore cleanup error
        }
      }
      return NextResponse.json({ error: 'Failed to save voice agent' }, { status: 500 });
    }

    // Track usage (don't fail if tracking fails)
    try {
      await supabase.rpc('record_usage', {
        p_user_id: user.id,
        p_product_id: product.id,
        p_event_type: 'api_call',
        p_quantity: 1,
        p_metadata: { action: 'create_voice_agent' },
      });
    } catch (usageError) {
      console.error('Usage tracking error:', usageError);
    }

    return NextResponse.json({
      product,
      agent: voiceNoobAgent,
      phone_number: phoneNumber || voiceNoobAgent?.phone_number,
      embed_code: voiceNoobAgent?.id ? voiceNoobClient.getEmbedCode(voiceNoobAgent.id) : null,
      warning: voiceNoobError ? `Voice service issue: ${voiceNoobError}. The agent is saved and will be activated once the voice service is available.` : undefined,
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
