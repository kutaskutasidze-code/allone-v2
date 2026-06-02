// Side-chat backend for the BF-shell side panel + chat-native /sales home.
//
// All chat traffic routes through the Hetzner claude-bridge (subscription-
// billed `claude -p` subprocess at chat.allonelabs.com). The Anthropic
// HTTP API is no longer wired here — we don't pay per token.
//
// Tool-use runs over a text-marker protocol implemented in
// lib/claude-bridge.ts: the system prompt teaches the model to emit
// <tool_call> tags, the loop executes them, and feeds <tool_result> back.
// Same tools we used before (TOOLS from sales-chat-tools), executed with
// the same per-user Supabase context.

import { NextRequest, NextResponse } from "next/server";
import { requireSalesAuth } from "@/lib/sales-auth";
import { AuthError } from "@/lib/auth";
import { fetchMetricEventsForUser } from "@/lib/sales-metric-events";
import { computeAllAims } from "@/lib/sales-aims";
import { TOOLS, executeTool } from "@/lib/sales-chat-tools";
import { callBridgeWithTools, bridgeConfigured } from "@/lib/claude-bridge";

interface IncomingMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, salesUser } = await requireSalesAuth();
    const body = (await request.json()) as { messages?: IncomingMessage[] };
    const incoming = Array.isArray(body.messages) ? body.messages : [];

    if (!bridgeConfigured()) {
      return NextResponse.json({
        text: "Chat isn't configured — set CLAUDE_BRIDGE_URL and CLAUDE_BRIDGE_TOKEN on the deploy to point at the Hetzner claude-bridge.",
      });
    }

    const now = new Date();
    const events = await fetchMetricEventsForUser(supabase, salesUser.id, now);
    const todayAims = computeAllAims(events, now, "day");
    const weekAims = computeAllAims(events, now, "week");
    const monthAims = computeAllAims(events, now, "month");

    const system = [
      `You are the Allone Sales assistant. You help ${salesUser.name} (role ${(salesUser as { role?: string }).role ?? "sales"}) move leads through the pipeline and produce personalized demos.`,
      `Date: ${new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tbilisi" })} (Asia/Tbilisi).`,
      ``,
      `Live numbers for this user (do not ask, just use them):`,
      formatAimsBrief(todayAims, weekAims, monthAims),
      ``,
      `Behavior:`,
      `- When asked "what should I do today?", reply with a 3-bullet plan grounded in the numbers above + any aim where progress < 50%.`,
      `- When the user asks you to DO something (add a lead, change status, send a demo, issue an offer/contract/invoice), CALL THE MATCHING TOOL. Don't just describe what they could click.`,
      `- After a tool returns, summarize the result in one short sentence. Plain text only, no markdown headers / code blocks. Bullets OK.`,
      `- If a tool returns an error, surface the error verbatim and offer one next step.`,
      `- For lookups (list_leads, get_demo_status), prefer the tool over guessing.`,
    ].join("\n");

    try {
      const result = await callBridgeWithTools({
        system,
        messages: incoming.map((m) => ({ role: m.role, content: m.content })),
        tools: TOOLS,
        executeTool: async (call) => {
          const r = await executeTool(call, {
            supabase,
            salesUserId: salesUser.id,
          });
          // Shape from sales-chat-tools.ToolResult already matches
          // BridgeToolResult — { tool, ok, data?, error? } — pass through.
          return r;
        },
      });
      return NextResponse.json({
        text: result.text,
        provider: "claude-cli",
        iterations: result.iterations,
      });
    } catch (err) {
      return NextResponse.json({
        text: `Sales chat failed: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}

function formatAimsBrief(
  day: ReturnType<typeof computeAllAims>,
  week: ReturnType<typeof computeAllAims>,
  month: ReturnType<typeof computeAllAims>,
): string {
  const fmt = (rows: ReturnType<typeof computeAllAims>, label: string) => {
    const lines = rows
      .map(
        (r) =>
          `  - ${r.metric}: aim ${r.aim}, actual ${r.actual} (${r.progress_pct}%)`,
      )
      .join("\n");
    return `${label}:\n${lines}`;
  };
  return [
    fmt(day, "Today"),
    fmt(week, "This week"),
    fmt(month, "This month"),
  ].join("\n\n");
}
