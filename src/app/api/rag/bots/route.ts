import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { flowiseClient, CreateRAGBotInput } from '@/lib/flowise/client';

// Get user's RAG bots
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
      .eq('type', 'rag_bot')
      .neq('status', 'deleted')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Get RAG bots error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create a new RAG bot
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
    const { name, description, welcomeMessage, systemPrompt, model } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Check limits
    const limits = subscription.limits || { rag_bots: 5 };
    const { count } = await adminClient
      .from('user_projects')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('type', 'rag_bot')
      .neq('status', 'deleted');

    if ((count || 0) >= (limits.rag_bots || 5)) {
      return NextResponse.json({
        error: `You've reached the limit of ${limits.rag_bots || 5} RAG bots`
      }, { status: 403 });
    }

    // Create chatflow in Flowise (if configured)
    let externalId: string | undefined;
    try {
      if (process.env.FLOWISE_API_URL) {
        const botInput: CreateRAGBotInput = {
          name,
          description,
          welcomeMessage: welcomeMessage || `Hello! I'm ${name}. How can I help you?`,
          systemPrompt,
          model: model || 'gpt-4o-mini',
        };
        const chatflow = await flowiseClient.createChatflow(botInput);
        externalId = chatflow.id;
      }
    } catch (flowiseError) {
      console.error('Flowise chatflow creation failed:', flowiseError);
      // Continue without external chatflow - can be configured later
    }

    // Create project record
    const { data: project, error } = await adminClient
      .from('user_projects')
      .insert({
        user_id: user.id,
        name,
        description,
        type: 'rag_bot',
        external_id: externalId,
        config: {
          welcome_message: welcomeMessage || `Hello! I'm ${name}. How can I help you?`,
          system_prompt: systemPrompt || `You are ${name}, a helpful AI assistant. Answer questions based on the provided context.`,
          model: model || 'gpt-4o-mini',
          documents: [],
        },
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Generate embed codes
    const embedCode = externalId
      ? flowiseClient.getEmbedCode(externalId)
      : flowiseClient.getEmbedCode(project.id);

    const iframeEmbed = externalId
      ? flowiseClient.getIframeEmbed(externalId)
      : flowiseClient.getIframeEmbed(project.id);

    return NextResponse.json({
      ...project,
      embed_code: embedCode,
      iframe_embed: iframeEmbed,
    });
  } catch (error) {
    console.error('Create RAG bot error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
