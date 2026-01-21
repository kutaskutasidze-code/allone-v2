/**
 * POST /api/ecosystem/rag-bot/[id]/chat
 * Chat with a RAG bot
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ragService } from '@/lib/rag/service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { message, session_id } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get the RAG bot
    const supabase = await createClient();
    const { data: bot, error: botError } = await supabase
      .from('user_products')
      .select('*')
      .eq('id', id)
      .eq('type', 'rag_bot')
      .single();

    if (botError || !bot) {
      return NextResponse.json({ error: 'RAG bot not found' }, { status: 404 });
    }

    if (bot.status !== 'active') {
      return NextResponse.json({ error: 'RAG bot is not active' }, { status: 400 });
    }

    if (!bot.knowledge_base_id) {
      return NextResponse.json(
        { error: 'RAG bot has no knowledge base configured' },
        { status: 400 }
      );
    }

    // Chat with the knowledge base
    const result = await ragService.chat({
      knowledge_base_id: bot.knowledge_base_id,
      message,
      session_id: session_id || `session_${Date.now()}`,
      system_prompt: bot.system_prompt,
      max_tokens: bot.agent_config?.max_tokens || 1024,
    });

    // Track usage (AI tokens)
    await supabase.rpc('record_usage', {
      p_user_id: bot.user_id,
      p_product_id: id,
      p_event_type: 'ai_tokens',
      p_quantity: result.tokens_used,
      p_metadata: { session_id },
    });

    // Update last active
    await supabase
      .from('user_products')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', id);

    return NextResponse.json({
      response: result.response,
      sources: result.sources.map(s => ({
        content: s.content.substring(0, 200) + '...',
        document: s.document_name,
        similarity: Math.round(s.similarity * 100) / 100,
      })),
    });

  } catch (error) {
    console.error('RAG chat error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process chat' },
      { status: 500 }
    );
  }
}

// GET endpoint for fetching chat history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const session_id = searchParams.get('session_id');

    if (!session_id) {
      return NextResponse.json({ error: 'session_id is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify bot exists
    const { data: bot } = await supabase
      .from('user_products')
      .select('id')
      .eq('id', id)
      .eq('type', 'rag_bot')
      .single();

    if (!bot) {
      return NextResponse.json({ error: 'RAG bot not found' }, { status: 404 });
    }

    // Fetch conversation history
    const { data: messages, error } = await supabase
      .from('rag_conversations')
      .select('role, content, created_at')
      .eq('project_id', id)
      .eq('session_id', session_id)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (error) {
    console.error('Get chat history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
