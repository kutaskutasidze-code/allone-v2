/**
 * POST /api/ecosystem/automation
 * Create a new automation workflow via b0t
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { b0tClient, B0T_TEMPLATES } from '@/lib/b0t/client';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, template_id, config, ai_description } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    let workflow;

    // Create workflow based on input method
    if (ai_description) {
      // Use AI to build workflow from natural language
      workflow = await b0tClient.buildFromDescription(ai_description);
    } else if (template_id && B0T_TEMPLATES[template_id as keyof typeof B0T_TEMPLATES]) {
      // Create from template
      workflow = await b0tClient.createFromTemplate(
        template_id as keyof typeof B0T_TEMPLATES,
        name,
        config
      );
    } else {
      // Create custom workflow
      workflow = await b0tClient.createWorkflow({
        name,
        description,
        config,
      });
    }

    // Store in user_products table
    const { data: product, error: dbError } = await supabase
      .from('user_products')
      .insert({
        user_id: user.id,
        name,
        description: description || workflow.description,
        type: 'automation',
        deployment_id: workflow.id,
        webhook_url: b0tClient.getWebhookUrl(workflow.id),
        config: {
          b0t_workflow_id: workflow.id,
          template_id,
          ...config,
        },
        status: 'active',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Failed to save product:', dbError);
      return NextResponse.json({ error: 'Failed to save automation' }, { status: 500 });
    }

    // Track usage
    await supabase.rpc('record_usage', {
      p_user_id: user.id,
      p_product_id: product.id,
      p_event_type: 'api_call',
      p_quantity: 1,
      p_metadata: { action: 'create_automation' },
    });

    return NextResponse.json({
      product,
      workflow,
      webhook_url: product.webhook_url,
    }, { status: 201 });

  } catch (error) {
    console.error('Create automation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create automation' },
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

    const { data: automations, error } = await supabase
      .from('user_products')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'automation')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch automations' }, { status: 500 });
    }

    // Fetch workflow stats from b0t for each automation
    const enrichedAutomations = await Promise.all(
      (automations || []).map(async (automation) => {
        try {
          if (automation.config?.b0t_workflow_id) {
            const workflow = await b0tClient.getWorkflow(automation.config.b0t_workflow_id);
            return {
              ...automation,
              workflow_stats: {
                run_count: workflow.runCount,
                last_run: workflow.lastRun,
                last_run_status: workflow.lastRunStatus,
              },
            };
          }
        } catch {
          // Workflow might not exist in b0t
        }
        return automation;
      })
    );

    return NextResponse.json({ automations: enrichedAutomations });
  } catch (error) {
    console.error('List automations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
