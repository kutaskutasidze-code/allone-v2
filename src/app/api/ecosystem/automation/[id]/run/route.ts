/**
 * POST /api/ecosystem/automation/[id]/run
 * Execute an automation workflow
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { b0tClient } from '@/lib/b0t/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { trigger_data, priority } = body;

    // Get automation
    const { data: automation, error: fetchError } = await supabase
      .from('user_products')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('type', 'automation')
      .single();

    if (fetchError || !automation) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    if (automation.status !== 'active') {
      return NextResponse.json({ error: 'Automation is not active' }, { status: 400 });
    }

    if (!automation.config?.b0t_workflow_id) {
      return NextResponse.json({ error: 'Workflow not configured' }, { status: 400 });
    }

    // Execute workflow via b0t
    const result = await b0tClient.runWorkflow(automation.config.b0t_workflow_id, {
      triggerData: trigger_data,
      triggerType: 'manual',
      priority,
    });

    // Update execution stats
    await supabase
      .from('user_products')
      .update({
        total_executions: (automation.total_executions || 0) + 1,
        successful_executions: result.status === 'success'
          ? (automation.successful_executions || 0) + 1
          : automation.successful_executions || 0,
        last_active_at: new Date().toISOString(),
      })
      .eq('id', id);

    // Track usage
    await supabase.rpc('record_usage', {
      p_user_id: user.id,
      p_product_id: id,
      p_event_type: 'workflow_run',
      p_quantity: 1,
      p_metadata: { trigger: 'manual' },
    });

    return NextResponse.json({
      success: true,
      run: result,
    });
  } catch (error) {
    console.error('Run automation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to run automation' },
      { status: 500 }
    );
  }
}
