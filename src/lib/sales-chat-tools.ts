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
  {
    name: "export_sales_report",
    description:
      "Generate a sales report .xlsx with four sheets: Deals (every lead with owner + status + value), Summary (by-status totals + conversion rates), By Week (last 12 weeks of new/contacted/qualified/won counts), and Team & Calls (per-rep daily-target attainment). Returns a signed download URL the user can click. Use when the user says 'export', 'generate report', 'weekly numbers', 'how are we doing this week', etc. Honors the caller's role: salespeople get their own pipeline; admins/supervisors get all reps.",
    input_schema: {
      type: "object",
      properties: {
        weeks: {
          type: "number",
          description:
            "How many trailing weeks for the By Week sheet (default 12, max 52).",
        },
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
      case "export_sales_report":
        return await exportSalesReport(input, ctx);
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

// ── export_sales_report ──────────────────────────────────────────────
//
// Builds a four-sheet xlsx (Deals / Summary / By Week / Team & Calls),
// uploads it to Supabase Storage `documents/sales-reports/<id>.xlsx`,
// returns the signed URL. Admins + supervisors get the full pipeline;
// salespeople get only their own rows.

interface RawLead {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  status: string;
  value: number | null;
  source: string | null;
  sales_user_id: string | null;
  created_at: string;
  status_changed_at: string | null;
  callback_at: string | null;
}

interface SalesUserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  daily_target: number | null;
}

async function exportSalesReport(
  input: Record<string, unknown>,
  ctx: { supabase: SupabaseClient; salesUserId: string },
): Promise<ToolResult> {
  const weeks = Math.max(1, Math.min(52, Number(input.weeks) || 12));

  const meRes = await ctx.supabase
    .from("sales_users")
    .select("id, name, email, role, daily_target")
    .eq("id", ctx.salesUserId)
    .maybeSingle();
  const me = meRes.data as SalesUserRow | null;
  if (!me) {
    return {
      tool: "export_sales_report",
      ok: false,
      error: "Caller is not in sales_users",
    };
  }

  const isPrivileged = me.role === "admin" || me.role === "supervisor";

  // Pull leads (scoped) + sales users (always need all for the Team sheet
  // when privileged; otherwise just the caller).
  let leadsQuery = ctx.supabase
    .from("leads")
    .select(
      "id, name, company, email, status, value, source, sales_user_id, created_at, status_changed_at, callback_at",
    )
    .order("created_at", { ascending: false })
    .limit(10000);
  if (!isPrivileged) leadsQuery = leadsQuery.eq("sales_user_id", me.id);
  const { data: rawLeads, error: leadsErr } = await leadsQuery;
  if (leadsErr) {
    return {
      tool: "export_sales_report",
      ok: false,
      error: `leads query failed: ${leadsErr.message}`,
    };
  }
  const leads = (rawLeads as RawLead[] | null) ?? [];

  const { data: users } = await ctx.supabase
    .from("sales_users")
    .select("id, name, email, role, daily_target");
  const team = (users as SalesUserRow[] | null) ?? [];
  const userById = new Map(team.map((u) => [u.id, u]));

  // Dynamic import — exceljs is heavy and we don't want it pulled into
  // every chat invocation.
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "Allone Sales";
  wb.created = new Date();

  // ── Sheet 1: Deals ─────────────────────────────────────────────────
  const dealsSheet = wb.addWorksheet("Deals", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  dealsSheet.columns = [
    { header: "Lead", key: "name", width: 28 },
    { header: "Company", key: "company", width: 24 },
    { header: "Email", key: "email", width: 30 },
    { header: "Owner", key: "owner", width: 22 },
    { header: "Status", key: "status", width: 14 },
    { header: "Value", key: "value", width: 12 },
    { header: "Source", key: "source", width: 16 },
    { header: "Created", key: "created", width: 18 },
    { header: "Status changed", key: "moved", width: 18 },
  ];
  for (const l of leads) {
    const owner = l.sales_user_id ? userById.get(l.sales_user_id) : null;
    dealsSheet.addRow({
      name: l.name,
      company: l.company ?? "",
      email: l.email ?? "",
      owner: owner?.name ?? owner?.email ?? "(unassigned)",
      status: l.status,
      value: l.value ?? 0,
      source: l.source ?? "",
      created: new Date(l.created_at),
      moved: l.status_changed_at ? new Date(l.status_changed_at) : null,
    });
  }
  dealsSheet.getRow(1).font = { bold: true };
  dealsSheet.getColumn("value").numFmt = "$#,##0";
  dealsSheet.getColumn("created").numFmt = "yyyy-mm-dd hh:mm";
  dealsSheet.getColumn("moved").numFmt = "yyyy-mm-dd hh:mm";

  // ── Sheet 2: Summary ──────────────────────────────────────────────
  const summary = wb.addWorksheet("Summary");
  const statusOrder = [
    "new",
    "contacted",
    "callback",
    "qualified",
    "won",
    "lost",
    "not_interested",
    "unavailable",
  ];
  const byStatus = new Map<string, { count: number; value: number }>();
  for (const s of statusOrder) byStatus.set(s, { count: 0, value: 0 });
  for (const l of leads) {
    const cur = byStatus.get(l.status) ?? { count: 0, value: 0 };
    cur.count += 1;
    cur.value += l.value ?? 0;
    byStatus.set(l.status, cur);
  }
  const total = leads.length;
  const wonCount = byStatus.get("won")?.count ?? 0;
  const contactedCount = byStatus.get("contacted")?.count ?? 0;
  const qualifiedCount = byStatus.get("qualified")?.count ?? 0;
  summary.columns = [
    { header: "Status", key: "status", width: 20 },
    { header: "Count", key: "count", width: 10 },
    { header: "Total Value", key: "value", width: 14 },
    { header: "% of pipeline", key: "pct", width: 16 },
  ];
  for (const s of statusOrder) {
    const row = byStatus.get(s)!;
    summary.addRow({
      status: s,
      count: row.count,
      value: row.value,
      pct: total > 0 ? row.count / total : 0,
    });
  }
  summary.addRow({});
  summary.addRow({ status: "Total leads", count: total });
  summary.addRow({
    status: "Conversion (contacted→won)",
    pct: contactedCount > 0 ? wonCount / contactedCount : 0,
  });
  summary.addRow({
    status: "Qualification rate",
    pct: total > 0 ? qualifiedCount / total : 0,
  });
  summary.getRow(1).font = { bold: true };
  summary.getColumn("value").numFmt = "$#,##0";
  summary.getColumn("pct").numFmt = "0.0%";

  // ── Sheet 3: By Week ──────────────────────────────────────────────
  const byWeek = wb.addWorksheet("By Week");
  byWeek.columns = [
    { header: "Week starting", key: "start", width: 16 },
    { header: "New", key: "n", width: 8 },
    { header: "Contacted", key: "c", width: 12 },
    { header: "Qualified", key: "q", width: 12 },
    { header: "Won", key: "w", width: 8 },
    { header: "Won Value", key: "wv", width: 14 },
  ];
  const buckets = new Map<
    string,
    { n: number; c: number; q: number; w: number; wv: number }
  >();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Monday of this week
  const monday = new Date(today);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  for (let i = 0; i < weeks; i++) {
    const start = new Date(monday);
    start.setDate(start.getDate() - i * 7);
    buckets.set(start.toISOString().slice(0, 10), {
      n: 0,
      c: 0,
      q: 0,
      w: 0,
      wv: 0,
    });
  }
  for (const l of leads) {
    const created = new Date(l.created_at);
    const wkStart = new Date(created);
    wkStart.setHours(0, 0, 0, 0);
    wkStart.setDate(wkStart.getDate() - ((wkStart.getDay() + 6) % 7));
    const key = wkStart.toISOString().slice(0, 10);
    const b = buckets.get(key);
    if (!b) continue;
    b.n += 1;
    if (
      l.status === "contacted" ||
      l.status === "qualified" ||
      l.status === "won"
    )
      b.c += 1;
    if (l.status === "qualified" || l.status === "won") b.q += 1;
    if (l.status === "won") {
      b.w += 1;
      b.wv += l.value ?? 0;
    }
  }
  const weekKeys = [...buckets.keys()].sort();
  for (const k of weekKeys) {
    const b = buckets.get(k)!;
    byWeek.addRow({ start: k, n: b.n, c: b.c, q: b.q, w: b.w, wv: b.wv });
  }
  byWeek.getRow(1).font = { bold: true };
  byWeek.getColumn("wv").numFmt = "$#,##0";

  // ── Sheet 4: Team & Calls ─────────────────────────────────────────
  const teamSheet = wb.addWorksheet("Team & Calls");
  teamSheet.columns = [
    { header: "Rep", key: "rep", width: 28 },
    { header: "Role", key: "role", width: 12 },
    { header: "Daily target", key: "target", width: 12 },
    { header: "Assigned (total)", key: "assigned", width: 16 },
    { header: "Contacted+", key: "touched", width: 12 },
    { header: "Qualified", key: "q", width: 10 },
    { header: "Won", key: "w", width: 8 },
    { header: "Won value", key: "wv", width: 14 },
    { header: "Conversion", key: "conv", width: 12 },
  ];
  for (const u of team) {
    if (!isPrivileged && u.id !== me.id) continue;
    const own = leads.filter((l) => l.sales_user_id === u.id);
    const assigned = own.length;
    const touched = own.filter((l) => l.status !== "new").length;
    const q = own.filter(
      (l) => l.status === "qualified" || l.status === "won",
    ).length;
    const w = own.filter((l) => l.status === "won").length;
    const wv = own
      .filter((l) => l.status === "won")
      .reduce((sum, l) => sum + (l.value ?? 0), 0);
    teamSheet.addRow({
      rep: u.name || u.email,
      role: u.role,
      target: u.daily_target ?? 80,
      assigned,
      touched,
      q,
      w,
      wv,
      conv: touched > 0 ? w / touched : 0,
    });
  }
  teamSheet.getRow(1).font = { bold: true };
  teamSheet.getColumn("wv").numFmt = "$#,##0";
  teamSheet.getColumn("conv").numFmt = "0.0%";

  // ── Upload + signed URL ────────────────────────────────────────────
  const buf = (await wb.xlsx.writeBuffer()) as ArrayBuffer;
  const id = crypto.randomUUID();
  const reportDate = new Date().toISOString().slice(0, 10);
  const ownerSlug = (me.name || me.email || "report")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
  const path = `sales-reports/${reportDate}-${ownerSlug}-${id}.xlsx`;
  const uploadRes = await ctx.supabase.storage
    .from("documents")
    .upload(path, new Uint8Array(buf), {
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      cacheControl: "3600",
      upsert: false,
    });
  if (uploadRes.error) {
    return {
      tool: "export_sales_report",
      ok: false,
      error: `storage upload failed: ${uploadRes.error.message}`,
    };
  }
  const signed = await ctx.supabase.storage
    .from("documents")
    .createSignedUrl(path, 60 * 60); // 1h
  if (signed.error || !signed.data?.signedUrl) {
    return {
      tool: "export_sales_report",
      ok: false,
      error: signed.error?.message || "signing URL failed",
    };
  }
  return {
    tool: "export_sales_report",
    ok: true,
    data: {
      url: signed.data.signedUrl,
      filename: path.split("/").pop(),
      leads: total,
      reps: isPrivileged ? team.length : 1,
      weeks,
    },
  };
}
