/**
 * POST /api/ecosystem/rag-bot
 * Create RAG chatbots that use knowledge bases
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ragService } from '@/lib/rag/service';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, knowledge_base_id, system_prompt, welcome_message, config } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // If knowledge_base_id provided, verify ownership
    if (knowledge_base_id) {
      const kb = await ragService.getKnowledgeBase(knowledge_base_id);
      if (!kb || kb.user_id !== user.id) {
        return NextResponse.json({ error: 'Knowledge base not found' }, { status: 404 });
      }
    }

    // Create the RAG bot as a user_product
    const { data: product, error: dbError } = await supabase
      .from('user_products')
      .insert({
        user_id: user.id,
        name,
        description: description || `RAG Chatbot: ${name}`,
        type: 'rag_bot',
        knowledge_base_id,
        system_prompt: system_prompt || `You are ${name}, a helpful AI assistant. Answer questions based on the provided context. If you don't know the answer, say so.`,
        agent_config: {
          welcome_message: welcome_message || `Hello! I'm ${name}. How can I help you today?`,
          model: config?.model || 'gpt-4o-mini',
          temperature: config?.temperature || 0.7,
          max_tokens: config?.max_tokens || 1024,
          ...config,
        },
        status: knowledge_base_id ? 'active' : 'draft',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Failed to save RAG bot:', dbError);
      return NextResponse.json({ error: 'Failed to create RAG bot' }, { status: 500 });
    }

    // Track usage
    await supabase.rpc('record_usage', {
      p_user_id: user.id,
      p_product_id: product.id,
      p_event_type: 'api_call',
      p_quantity: 1,
      p_metadata: { action: 'create_rag_bot' },
    });

    return NextResponse.json({
      product,
      embed_code: ragService.getEmbedCode(product.id, {
        title: name,
      }),
      api_endpoint: `/api/ecosystem/rag-bot/${product.id}/chat`,
    }, { status: 201 });

  } catch (error) {
    console.error('Create RAG bot error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create RAG bot' },
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

    // Get RAG bots with their knowledge base info
    const { data: ragBots, error } = await supabase
      .from('user_products')
      .select(`
        *,
        knowledge_bases (
          id,
          name,
          document_count,
          total_chunks
        )
      `)
      .eq('user_id', user.id)
      .eq('type', 'rag_bot')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch RAG bots' }, { status: 500 });
    }

    return NextResponse.json({ rag_bots: ragBots || [] });
  } catch (error) {
    console.error('List RAG bots error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
