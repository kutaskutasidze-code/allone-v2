// Anthropic tool-use definitions for the sales side-chat + chat-native home.
// Each tool maps to an action that previously required the user to navigate
// to a specific UI route. The chat handler executes the tool against the
// per-request Supabase client (sales-user-scoped via RLS) and folds the
// result back into the conversation.

import type { SupabaseClient } from "@supabase/supabase-js";

export interface ToolInput {
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResult {
  tool: string;
  ok: boolean;
  data?: unknown;
  error?: string;
}

export const TOOLS = [
  {
    name: "create_lead",
    description:
      "Create a new lead in the user's pipeline. Use when the user says 'add a lead', 'log a lead', 'I just talked to X', etc. The pipeline auto-triggers a personalized demo after creation.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Lead's full name" },
        email: { type: "string", description: "Lead's email" },
        phone: { type: "string" },
        company: { type: "string" },
        source: {
          type: "string",
          description:
            "Where the lead came from (e.g. 'Website', 'Referral', 'LinkedIn', 'Cold Call')",
        },
        value: { type: "number", description: "Estimated deal value in USD" },
        notes: { type: "string" },
      },
      required: ["name"],
    },
  },
  {
    name: "list_leads",
    description:
      "List the user's leads filtered by status. Use when the user asks 'show me my qualified leads', 'who's contacted', etc.",
    input_schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["new", "contacted", "qualified", "won", "lost", "all"],
        },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "set_lead_status",
    description:
      "Move a lead between pipeline stages. Use when the user says 'mark X as qualified', 'we won the X deal', 'lost the Y lead'.",
    input_schema: {
      type: "object",
      properties: {
        lead_id: { type: "string", description: "UUID of the lead" },
        lead_name: {
          type: "string",
          description:
            "Or the lead's name — we'll look up the UUID if no lead_id given",
        },
        status: {
          type: "string",
          enum: ["new", "contacted", "qualified", "won", "lost"],
        },
      },
      required: ["status"],
    },
  },
  {
    name: "trigger_demo",
    description:
      "Generate a personalized demo for a specific lead. Use when the user says 'send X a demo', 'generate demo for Y'. Demos take ~5min to build; this kicks off the pipeline.",
    input_schema: {
      type: "object",
      properties: {
        lead_id: { type: "string" },
        lead_name: { type: "string" },
      },
    },
  },
  {
    name: "get_demo_status",
    description:
      "Check the status of a demo job — phase, progress, demo URL, audit score. Use when the user asks 'where's the X demo?', 'is Y's demo ready?'.",
    input_schema: {
      type: "object",
      properties: {
        lead_name: { type: "string" },
        demo_job_id: { type: "string" },
      },
    },
  },
  {
    name: "send_draft",
    description:
      "Send the drafted email for a demo to the lead. Only works when the demo is in draft_ready state.",
    input_schema: {
      type: "object",
      properties: {
        demo_job_id: { type: "string" },
        lead_name: { type: "string" },
      },
    },
  },
] as const;

export async function executeTool(
  call: ToolInput,
  ctx: { supabase: SupabaseClient; salesUserId: string },
): Promise<ToolResult> {
  const { name, input } = call;
  try {
    switch (name) {
      case "create_lead":
        return await createLead(input, ctx);
      case "list_leads":
        return await listLeads(input, ctx);
      case "set_lead_status":
        return await setLeadStatus(input, ctx);
      case "trigger_demo":
        return await triggerDemo(input, ctx);
      case "get_demo_status":
        return await getDemoStatus(input, ctx);
      case "send_draft":
        return await sendDraft(input, ctx);
      default:
        return { tool: name, ok: false, error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    return {
      tool: name,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function createLead(
  input: Record<string, unknown>,
  ctx: { supabase: SupabaseClient; salesUserId: string },
): Promise<ToolResult> {
  const { data, error } = await ctx.supabase
    .from("leads")
    .insert({
      sales_user_id: ctx.salesUserId,
      name: String(input.name),
      email: input.email ?? null,
      phone: input.phone ?? null,
      company: input.company ?? null,
      source: input.source ?? null,
      value: typeof input.value === "number" ? input.value : 0,
      notes: input.notes ?? null,
      status: "new",
    })
    .select("id, name, company, email, status")
    .single();
  if (error) return { tool: "create_lead", ok: false, error: error.message };
  // Auto-trigger demo via offer-generator (same code path as the form post).
  try {
    const { enqueueDemoJob } = await import("@/lib/demo-pipeline-trigger");
    enqueueDemoJob({ lead_id: data.id, sales_user_id: ctx.salesUserId }).catch(
      () => {},
    );
  } catch {}
  return { tool: "create_lead", ok: true, data };
}

async function listLeads(
  input: Record<string, unknown>,
  ctx: { supabase: SupabaseClient; salesUserId: string },
): Promise<ToolResult> {
  const status = input.status as string | undefined;
  const limit = (input.limit as number | undefined) ?? 10;
  let q = ctx.supabase
    .from("leads")
    .select("id, name, company, email, status, value, created_at")
    .eq("sales_user_id", ctx.salesUserId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (status && status !== "all") q = q.eq("status", status);
  const { data, error } = await q;
  if (error) return { tool: "list_leads", ok: false, error: error.message };
  return { tool: "list_leads", ok: true, data };
}

async function findLeadByName(
  name: string,
  ctx: { supabase: SupabaseClient; salesUserId: string },
): Promise<{ id: string; name: string; status: string } | null> {
  const { data } = await ctx.supabase
    .from("leads")
    .select("id, name, status")
    .eq("sales_user_id", ctx.salesUserId)
    .ilike("name", `%${name}%`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as { id: string; name: string; status: string } | null) ?? null;
}

async function setLeadStatus(
  input: Record<string, unknown>,
  ctx: { supabase: SupabaseClient; salesUserId: string },
): Promise<ToolResult> {
  let leadId = input.lead_id as string | undefined;
  if (!leadId && input.lead_name) {
    const lead = await findLeadByName(String(input.lead_name), ctx);
    if (!lead) {
      return {
        tool: "set_lead_status",
        ok: false,
        error: `No lead found matching "${input.lead_name}"`,
      };
    }
    leadId = lead.id;
  }
  if (!leadId) {
    return {
      tool: "set_lead_status",
      ok: false,
      error: "Need lead_id or lead_name",
    };
  }
  const { data, error } = await ctx.supabase
    .from("leads")
    .update({ status: String(input.status) })
    .eq("id", leadId)
    .eq("sales_user_id", ctx.salesUserId)
    .select("id, name, status")
    .single();
  if (error)
    return { tool: "set_lead_status", ok: false, error: error.message };
  return { tool: "set_lead_status", ok: true, data };
}

async function triggerDemo(
  input: Record<string, unknown>,
  ctx: { supabase: SupabaseClient; salesUserId: string },
): Promise<ToolResult> {
  let leadId = input.lead_id as string | undefined;
  if (!leadId && input.lead_name) {
    const lead = await findLeadByName(String(input.lead_name), ctx);
    if (!lead) {
      return {
        tool: "trigger_demo",
        ok: false,
        error: `No lead found matching "${input.lead_name}"`,
      };
    }
    leadId = lead.id;
  }
  if (!leadId)
    return {
      tool: "trigger_demo",
      ok: false,
      error: "Need lead_id or lead_name",
    };

  const { enqueueDemoJob } = await import("@/lib/demo-pipeline-trigger");
  const r = await enqueueDemoJob({
    lead_id: leadId,
    sales_user_id: ctx.salesUserId,
  });
  if (!r.ok) return { tool: "trigger_demo", ok: false, error: r.error };
  return {
    tool: "trigger_demo",
    ok: true,
    data: { demo_job_id: r.demo_job_id, status: "queued" },
  };
}

async function getDemoStatus(
  input: Record<string, unknown>,
  ctx: { supabase: SupabaseClient; salesUserId: string },
): Promise<ToolResult> {
  let demoJobId = input.demo_job_id as string | undefined;
  if (!demoJobId && input.lead_name) {
    const lead = await findLeadByName(String(input.lead_name), ctx);
    if (!lead) {
      return {
        tool: "get_demo_status",
        ok: false,
        error: `No lead found matching "${input.lead_name}"`,
      };
    }
    const { data } = await ctx.supabase
      .from("demo_jobs")
      .select("id")
      .eq("lead_id", lead.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    demoJobId = (data as { id?: string } | null)?.id;
  }
  if (!demoJobId) {
    return { tool: "get_demo_status", ok: false, error: "No demo found" };
  }
  const { data, error } = await ctx.supabase
    .from("demo_jobs")
    .select(
      "id, status, current_phase, progress, demo_url, audit_results, expires_at, engagement_count",
    )
    .eq("id", demoJobId)
    .single();
  if (error)
    return { tool: "get_demo_status", ok: false, error: error.message };
  return { tool: "get_demo_status", ok: true, data };
}

async function sendDraft(
  input: Record<string, unknown>,
  ctx: { supabase: SupabaseClient; salesUserId: string },
): Promise<ToolResult> {
  let demoJobId = input.demo_job_id as string | undefined;
  if (!demoJobId && input.lead_name) {
    const lead = await findLeadByName(String(input.lead_name), ctx);
    if (!lead) {
      return {
        tool: "send_draft",
        ok: false,
        error: `No lead found matching "${input.lead_name}"`,
      };
    }
    const { data } = await ctx.supabase
      .from("demo_jobs")
      .select("id, status")
      .eq("lead_id", lead.id)
      .eq("status", "draft_ready")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    demoJobId = (data as { id?: string } | null)?.id;
  }
  if (!demoJobId) {
    return {
      tool: "send_draft",
      ok: false,
      error: "No draft_ready demo found for that lead",
    };
  }
  const offerApi = process.env.OFFER_API_URL ?? "http://localhost:3100";
  const offerKey = process.env.OFFER_API_KEY ?? "";
  const res = await fetch(`${offerApi}/api/demos/${demoJobId}/draft/send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${offerKey}` },
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    return {
      tool: "send_draft",
      ok: false,
      error: json.error ?? `HTTP ${res.status}`,
    };
  }
  return {
    tool: "send_draft",
    ok: true,
    data: { demo_job_id: demoJobId, resend_id: json.data?.resend_id },
  };
}
