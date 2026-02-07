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

    const { type, config } = await request.json();

    if (!type || !config?.name) {
      return NextResponse.json({ error: 'Type and name are required' }, { status: 400 });
    }

    const validTypes = ['automation', 'rag_bot', 'voice_agent'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid product type' }, { status: 400 });
    }

    // For voice agents, try to create in voice-noob first
    if (type === 'voice_agent') {
      let voiceNoobAgent = null;
      let phoneNumber: string | undefined;
      let voiceNoobError: string | undefined;

      const systemPrompt = config.system_prompt || `You are ${config.name}, a helpful AI assistant. Be friendly, professional, and helpful to callers.`;

      try {
        voiceNoobAgent = await voiceNoobClient.createAgent({
          name: config.name,
          system_prompt: systemPrompt,
          voice_id: config.voice || 'alloy',
          ai_tier: config.pricing_tier || 'balanced',
          tools: config.enabled_tools || ['end_call'],
        });

        if (voiceNoobAgent?.id) {
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
      }

      const { data: product, error: dbError } = await supabase
        .from('user_products')
        .insert({
          user_id: user.id,
          name: config.name,
          description: config.description || `Voice AI agent: ${config.name}`,
          type: 'voice_agent',
          deployment_id: voiceNoobAgent?.id || null,
          system_prompt: systemPrompt,
          agent_config: {
            voice_noob_id: voiceNoobAgent?.id || null,
            voice: config.voice || 'alloy',
            pricing_tier: config.pricing_tier || 'balanced',
            enabled_tools: config.enabled_tools || ['end_call'],
            phone_number: phoneNumber || null,
            created_via: 'ai_studio',
          },
          status: voiceNoobAgent ? 'active' : 'draft',
        })
        .select()
        .single();

      if (dbError) {
        console.error('Failed to create product:', dbError);
        if (voiceNoobAgent?.id) {
          try { await voiceNoobClient.deleteAgent(voiceNoobAgent.id); } catch { /* ignore */ }
        }
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
      }

      return NextResponse.json({
        product,
        phone_number: phoneNumber,
        warning: voiceNoobError ? `Voice service issue: ${voiceNoobError}. Agent saved and will be activated once service is available.` : undefined,
      }, { status: 201 });
    }

    // For rag_bot and automation types, insert directly
    const { data: product, error: dbError } = await supabase
      .from('user_products')
      .insert({
        user_id: user.id,
        name: config.name,
        description: config.description || '',
        type,
        system_prompt: config.system_prompt || null,
        agent_config: {
          template: config.template || null,
          created_via: 'ai_studio',
        },
        status: 'active',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Failed to create product:', dbError);
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('user_products')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Failed to delete product:', error);
      return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
