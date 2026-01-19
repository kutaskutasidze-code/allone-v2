import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { n8nClient, AUTOMATION_TEMPLATES } from '@/lib/n8n/client';

// Get user's automations
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
      .eq('type', 'automation')
      .neq('status', 'deleted')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Get automations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create a new automation
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
    const { name, description, templateId } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Check limits
    const limits = subscription.limits || { automations: 10 };
    const { count } = await adminClient
      .from('user_projects')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('type', 'automation')
      .neq('status', 'deleted');

    if ((count || 0) >= (limits.automations || 10)) {
      return NextResponse.json({
        error: `You've reached the limit of ${limits.automations || 10} automations`
      }, { status: 403 });
    }

    // Get template if specified
    let template = null;
    if (templateId) {
      template = AUTOMATION_TEMPLATES.find(t => t.id === templateId);
    }

    // Create workflow in n8n (if configured)
    let externalId: string | undefined;
    let webhookPath: string | undefined;
    try {
      if (process.env.N8N_API_URL) {
        const workflow = templateId
          ? await n8nClient.createFromTemplate(templateId, name)
          : await n8nClient.createWorkflow(name);
        externalId = workflow.id;

        // Extract webhook path if template has webhook trigger
        const webhookNode = workflow.nodes?.find(n => n.type === 'n8n-nodes-base.webhook');
        if (webhookNode) {
          webhookPath = (webhookNode.parameters as { path?: string })?.path;
        }
      }
    } catch (n8nError) {
      console.error('n8n workflow creation failed:', n8nError);
      // Continue without external workflow - can be configured later
    }

    // Create project record
    const { data: project, error } = await adminClient
      .from('user_projects')
      .insert({
        user_id: user.id,
        name,
        description: description || template?.description,
        type: 'automation',
        external_id: externalId,
        config: {
          template_id: templateId,
          template_name: template?.name,
          category: template?.category,
          webhook_path: webhookPath,
          nodes: template?.nodes || [],
          connections: template?.connections || {},
        },
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Generate embed/webhook info
    const webhookUrl = webhookPath && externalId
      ? n8nClient.getWebhookUrl(externalId, webhookPath)
      : null;

    const editorUrl = externalId
      ? n8nClient.getEditorUrl(externalId)
      : null;

    return NextResponse.json({
      ...project,
      webhook_url: webhookUrl,
      editor_url: editorUrl,
      embed_code: externalId ? n8nClient.getEmbedCode(externalId, webhookPath || undefined) : null,
    });
  } catch (error) {
    console.error('Create automation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
