// Thin shim that lets the lead-detail action buttons call the same handlers
// the chat tools use. Reps can issue an offer / contract / invoice / draft
// from a button without having to know the chat magic words.
//
// POST { tool: string, input: object } — forwards to executeTool() under
// the caller's sales user. Allow-listed to the handful of write tools that
// make sense from a UI button (lead lookup + status changes have their
// own dedicated routes).

import { NextRequest, NextResponse } from "next/server";
import { requireSalesAuth } from "@/lib/sales-auth";
import { AuthError } from "@/lib/auth";
import { executeTool } from "@/lib/sales-chat-tools";

const ALLOWED = new Set([
  "issue_offer",
  "issue_contract",
  "issue_invoice",
  "send_draft",
  "trigger_demo",
  "export_sales_report",
]);

export async function POST(request: NextRequest) {
  try {
    const { supabase, salesUser } = await requireSalesAuth();
    const body = (await request.json()) as {
      tool?: string;
      input?: Record<string, unknown>;
    };
    const tool = body.tool;
    if (!tool || !ALLOWED.has(tool)) {
      return NextResponse.json(
        {
          ok: false,
          error: `tool '${tool}' is not allowed from this endpoint`,
        },
        { status: 400 },
      );
    }
    const result = await executeTool(
      { name: tool, input: body.input ?? {} },
      { supabase, salesUserId: salesUser.id },
    );
    const status = result.ok ? 200 : 400;
    return NextResponse.json(result, { status });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
