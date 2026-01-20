import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/products/[id]/deploy - Deploy/activate a product
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the product
    const { data: product, error: fetchError } = await supabase
      .from('user_products')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Update status to deploying
    await supabase
      .from('user_products')
      .update({ status: 'deploying' })
      .eq('id', id);

    let deploymentResult: {
      success: boolean;
      deployment_url?: string;
      webhook_url?: string;
      error?: string;
    } = { success: false };

    try {
      switch (product.type) {
        case 'automation':
          deploymentResult = await deployAutomation(product, supabase);
          break;
        case 'rag_bot':
          deploymentResult = await deployRagBot(product, user.id, supabase);
          break;
        case 'voice_agent':
          deploymentResult = await deployVoiceAgent(product, supabase);
          break;
        case 'webapp':
          deploymentResult = { success: false, error: 'Web app deployment coming soon' };
          break;
        default:
          deploymentResult = { success: false, error: 'Unknown product type' };
      }
    } catch (deployError) {
      console.error('Deployment error:', deployError);
      deploymentResult = {
        success: false,
        error: deployError instanceof Error ? deployError.message : 'Deployment failed'
      };
    }

    // Update product with deployment result
    const updateData: Record<string, unknown> = {
      status: deploymentResult.success ? 'active' : 'error',
      last_active_at: deploymentResult.success ? new Date().toISOString() : null,
    };

    if (deploymentResult.deployment_url) {
      updateData.deployment_url = deploymentResult.deployment_url;
    }
    if (deploymentResult.webhook_url) {
      updateData.webhook_url = deploymentResult.webhook_url;
    }
    if (!deploymentResult.success && deploymentResult.error) {
      updateData.config = {
        ...product.config,
        last_error: deploymentResult.error,
        error_at: new Date().toISOString()
      };
    }

    const { data: updatedProduct, error: updateError } = await supabase
      .from('user_products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating product after deploy:', updateError);
    }

    // Record usage
    await supabase.rpc('record_usage', {
      p_user_id: user.id,
      p_product_id: id,
      p_event_type: 'api_call',
      p_quantity: 1,
      p_metadata: { action: 'deploy', type: product.type, success: deploymentResult.success }
    });

    if (!deploymentResult.success) {
      return NextResponse.json({
        error: deploymentResult.error || 'Deployment failed',
        product: updatedProduct
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      product: updatedProduct,
      deployment_url: deploymentResult.deployment_url,
      webhook_url: deploymentResult.webhook_url
    });
  } catch (error) {
    console.error('Deploy API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Deploy automation to n8n
async function deployAutomation(
  product: Record<string, unknown>,
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never
) {
  const n8nApiUrl = process.env.N8N_API_URL;
  const n8nApiKey = process.env.N8N_API_KEY;

  if (!n8nApiUrl || !n8nApiKey) {
    // For now, generate a mock webhook URL
    // In production, this would create actual n8n workflow
    const webhookId = Math.random().toString(36).substring(7);
    return {
      success: true,
      webhook_url: `https://n8n.allone.ge/webhook/${webhookId}`,
      deployment_url: `https://n8n.allone.ge/workflow/${webhookId}`
    };
  }

  // Create workflow in n8n
  const config = product.config as Record<string, unknown> || {};
  const workflowData = config.workflow_json || generateDefaultWorkflow(product);

  const response = await fetch(`${n8nApiUrl}/api/v1/workflows`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-N8N-API-KEY': n8nApiKey
    },
    body: JSON.stringify(workflowData)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`n8n API error: ${error}`);
  }

  const workflow = await response.json();

  // Activate the workflow
  await fetch(`${n8nApiUrl}/api/v1/workflows/${workflow.id}/activate`, {
    method: 'POST',
    headers: { 'X-N8N-API-KEY': n8nApiKey }
  });

  return {
    success: true,
    webhook_url: `${n8nApiUrl}/webhook/${workflow.id}`,
    deployment_url: `${n8nApiUrl}/workflow/${workflow.id}`
  };
}

// Deploy RAG bot
async function deployRagBot(
  product: Record<string, unknown>,
  userId: string,
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never
) {
  // Create or get knowledge base
  let knowledgeBaseId = product.knowledge_base_id as string | null;

  if (!knowledgeBaseId) {
    const { data: kb, error } = await supabase
      .from('knowledge_bases')
      .insert({
        user_id: userId,
        name: `${product.name} Knowledge Base`,
        description: `Knowledge base for ${product.name}`
      })
      .select()
      .single();

    if (error) {
      throw new Error('Failed to create knowledge base');
    }

    knowledgeBaseId = kb.id;

    // Update product with knowledge base ID
    await supabase
      .from('user_products')
      .update({ knowledge_base_id: knowledgeBaseId })
      .eq('id', product.id as string);
  }

  // Generate embed widget URL
  const embedUrl = `https://allone.ge/embed/chat/${product.id}`;

  return {
    success: true,
    deployment_url: embedUrl,
    webhook_url: `https://allone.ge/api/chat/${product.id}`
  };
}

// Deploy voice agent
async function deployVoiceAgent(
  product: Record<string, unknown>,
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never
) {
  // For now, generate mock endpoints
  // In production, this would integrate with Vapi or similar
  const agentId = Math.random().toString(36).substring(7);

  return {
    success: true,
    deployment_url: `https://allone.ge/voice/${agentId}`,
    webhook_url: `https://allone.ge/api/voice/${agentId}/webhook`
  };
}

// Generate default n8n workflow structure
function generateDefaultWorkflow(product: Record<string, unknown>) {
  const config = product.config as Record<string, unknown> || {};
  const webhookPath = (config.webhook_path as string) || product.id as string;

  return {
    name: product.name as string,
    nodes: [
      {
        id: 'webhook-trigger',
        name: 'Webhook',
        type: 'n8n-nodes-base.webhook',
        typeVersion: 2,
        position: [250, 300],
        parameters: {
          path: webhookPath,
          responseMode: 'onReceived',
          options: {}
        }
      }
    ],
    connections: {},
    settings: {
      executionOrder: 'v1'
    }
  };
}
