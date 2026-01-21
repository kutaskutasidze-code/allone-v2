/**
 * GET/PATCH/DELETE /api/ecosystem/automation/[id]
 * Manage individual automation workflows
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { b0tClient } from '@/lib/b0t/client';

export async function GET(
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

    const { data: automation, error } = await supabase
      .from('user_products')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('type', 'automation')
      .single();

    if (error || !automation) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    // Fetch workflow details from b0t
    let workflow = null;
    let runs: unknown[] = [];
    if (automation.config?.b0t_workflow_id) {
      try {
        workflow = await b0tClient.getWorkflow(automation.config.b0t_workflow_id);
        const runsResult = await b0tClient.getWorkflowRuns(automation.config.b0t_workflow_id, { limit: 10 });
        runs = runsResult.runs;
      } catch {
        // Workflow might not exist
      }
    }

    return NextResponse.json({
      automation,
      workflow,
      runs,
    });
  } catch (error) {
    console.error('Get automation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
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
    const body = await request.json();
    const { name, description, status, config } = body;

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from('user_products')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('type', 'automation')
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    // Update in b0t if workflow exists
    if (existing.config?.b0t_workflow_id) {
      try {
        await b0tClient.updateWorkflow(existing.config.b0t_workflow_id, {
          name,
          description,
          config,
        });
      } catch {
        // Continue even if b0t update fails
      }
    }

    // Update in database
    const updates: Record<string, unknown> = {};
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (status) updates.status = status;
    if (config) updates.config = { ...existing.config, ...config };

    const { data: automation, error: updateError } = await supabase
      .from('user_products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update automation' }, { status: 500 });
    }

    return NextResponse.json({ automation });
  } catch (error) {
    console.error('Update automation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from('user_products')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('type', 'automation')
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    // Delete from b0t
    if (existing.config?.b0t_workflow_id) {
      try {
        await b0tClient.deleteWorkflow(existing.config.b0t_workflow_id);
      } catch {
        // Continue even if b0t delete fails
      }
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('user_products')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete automation' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete automation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
