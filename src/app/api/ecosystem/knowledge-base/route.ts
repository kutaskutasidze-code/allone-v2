/**
 * POST /api/ecosystem/knowledge-base
 * Create and manage knowledge bases for RAG chatbots
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
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Check knowledge base limit
    const { count } = await supabase
      .from('knowledge_bases')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Get user's tier limit (default to free tier limit of 1)
    const { data: profile } = await supabase
      .from('profiles')
      .select('pricing_tier_id')
      .eq('id', user.id)
      .single();

    let maxKnowledgeBases = 1;
    if (profile?.pricing_tier_id) {
      const { data: tier } = await supabase
        .from('pricing_tiers')
        .select('max_knowledge_bases')
        .eq('id', profile.pricing_tier_id)
        .single();

      if (tier?.max_knowledge_bases && tier.max_knowledge_bases !== -1) {
        maxKnowledgeBases = tier.max_knowledge_bases;
      } else if (tier?.max_knowledge_bases === -1) {
        maxKnowledgeBases = Infinity;
      }
    }

    if ((count || 0) >= maxKnowledgeBases) {
      return NextResponse.json(
        { error: 'Knowledge base limit reached. Upgrade your plan to create more.' },
        { status: 403 }
      );
    }

    // Create knowledge base
    const knowledgeBase = await ragService.createKnowledgeBase({
      user_id: user.id,
      name,
      description,
    });

    return NextResponse.json({ knowledge_base: knowledgeBase }, { status: 201 });

  } catch (error) {
    console.error('Create knowledge base error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create knowledge base' },
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

    const knowledgeBases = await ragService.listKnowledgeBases(user.id);

    return NextResponse.json({ knowledge_bases: knowledgeBases });
  } catch (error) {
    console.error('List knowledge bases error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
