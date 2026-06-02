// Side-chat backend for the BF-shell side panel + chat-native /sales home.
// Calls the Anthropic HTTP API directly (no SDK dep needed). Supports
// tool-use via the tools defined in lib/sales-chat-tools.ts so the chat can
// actually act (create leads, change status, trigger/get demo status, send
// drafts) instead of telling the user to click around.

import { NextRequest, NextResponse } from "next/server";
import { requireSalesAuth } from "@/lib/sales-auth";
import { AuthError } from "@/lib/auth";
import { fetchMetricEventsForUser } from "@/lib/sales-metric-events";
import { computeAllAims } from "@/lib/sales-aims";
import { TOOLS, executeTool, type ToolResult } from "@/lib/sales-chat-tools";
import { callClaudeCli, claudeCliAvailable } from "@/lib/claude-cli";

interface IncomingMessage {
  role: "user" | "assistant";
  content: string;
}

interface AnthropicBlock {
  type: "text" | "tool_use" | "tool_result";
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  tool_use_id?: string;
  content?: unknown;
}

interface AnthropicResponse {
  content?: AnthropicBlock[];
  stop_reason?: string;
  error?: { message?: string };
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string | AnthropicBlock[];
}

const MAX_TOOL_ITERATIONS = 4;

export async function POST(request: NextRequest) {
  try {
    const { supabase, salesUser } = await requireSalesAuth();
    const body = (await request.json()) as { messages?: IncomingMessage[] };
    const incoming = Array.isArray(body.messages) ? body.messages : [];

    const apiKey = process.env.ANTHROPIC_API_KEY ?? "";
    if (!apiKey && !claudeCliAvailable()) {
      return NextResponse.json({
        text: "Chat isn't configured — ANTHROPIC_API_KEY is missing on the deploy. Once it's set, ask me again and I'll have an answer.",
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
      `- When the user asks you to DO something (add a lead, change status, send a demo), CALL THE MATCHING TOOL. Don't just describe what they could click.`,
      `- After a tool call returns, summarize the result in one short sentence. Plain text only, no markdown headers / code blocks. Bullets OK.`,
      `- If a tool returns an error, surface the error verbatim and offer one next step.`,
      `- For lookups (list_leads, get_demo_status), prefer the tool over guessing.`,
    ].join("\n");

    // Seed conversation from incoming. Each user message is plain text.
    const conversation: ConversationMessage[] = incoming.map((m) => ({
      role: m.role,
      content: String(m.content ?? ""),
    }));

    // No API key but CLI is available — run text-only via subprocess.
    // Tool-use is off here because `claude -p` doesn't expose tools.
    if (!apiKey && claudeCliAvailable()) {
      try {
        const reply = await callClaudeCli({
          system:
            system +
            "\n\n[Note: tool execution is currently unavailable (running in CLI-only mode). Describe what the user could do but don't pretend to have run anything.]",
          messages: incoming.map((m) => ({ role: m.role, content: m.content })),
        });
        return NextResponse.json({ text: reply, provider: "claude-cli" });
      } catch (err) {
        return NextResponse.json({
          text: `Claude CLI fell through: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    }

    let lastAnthropicError: string | null = null;

    // Tool-use loop: call Anthropic; if it asks for tools, execute them and
    // feed the results back; otherwise return the text reply.
    for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          // Sonnet matches BF's chat quality. Haiku was making the
          // replies feel terse + missing nuance the user complained about.
          // If credit usage becomes a concern, swap to claude-sonnet-4-7
          // when it lands, or wire the Claude-CLI Hetzner bridge.
          model: "claude-sonnet-4-5-20250929",
          max_tokens: 1024,
          system,
          tools: TOOLS,
          messages: conversation,
        }),
      });
      const json = (await res.json()) as AnthropicResponse;
      if (!res.ok) {
        lastAnthropicError =
          json.error?.message ?? `Anthropic returned ${res.status}`;
        break;
      }

      const blocks = json.content ?? [];
      const toolUses = blocks.filter((b) => b.type === "tool_use");

      if (toolUses.length === 0) {
        const text = blocks
          .map((b) => (b.type === "text" && b.text ? b.text : ""))
          .join("")
          .trim();
        return NextResponse.json({ text });
      }

      // Persist the assistant's tool-use turn into the conversation.
      conversation.push({ role: "assistant", content: blocks });

      // Execute each tool and build a user message of tool_result blocks.
      const results: ToolResult[] = [];
      const toolResultBlocks: AnthropicBlock[] = [];
      for (const t of toolUses) {
        const r = await executeTool(
          { name: t.name!, input: t.input ?? {} },
          { supabase, salesUserId: salesUser.id },
        );
        results.push(r);
        toolResultBlocks.push({
          type: "tool_result",
          tool_use_id: t.id!,
          content: JSON.stringify(r),
        });
      }
      conversation.push({ role: "user", content: toolResultBlocks });
    }

    // Anthropic errored AND we have a local CLI — last-chance text reply.
    if (lastAnthropicError && claudeCliAvailable()) {
      try {
        const reply = await callClaudeCli({
          system:
            system +
            `\n\n[Anthropic API just errored: ${lastAnthropicError}. Tool execution is unavailable in this fallback mode — answer text-only and tell the user to retry once the API is back if they wanted a tool to run.]`,
          messages: incoming.map((m) => ({ role: m.role, content: m.content })),
        });
        return NextResponse.json({ text: reply, provider: "claude-cli" });
      } catch {
        /* fall through */
      }
    }

    return NextResponse.json({
      text: lastAnthropicError
        ? `Sales chat failed: ${lastAnthropicError}`
        : "I ran out of tool steps before finishing. Try asking in smaller pieces.",
    });
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
