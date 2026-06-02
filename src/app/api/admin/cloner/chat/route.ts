// Cloner chat backend — Anthropic tool_use loop wired to the site-xray /
// xfly pipeline on Hetzner. Mirrors /api/sales/chat's structure so the
// same OverviewChat component on /admin/cloner posts here and gets the
// same tool-call → tool-result → text-reply flow.
//
// Auth: admin/supervisor only (sales reps shouldn't be issuing clone
// jobs that cost compute + Vercel deploys).
//
// Fallback: when the Anthropic API errors AND the turn used no tools,
// fall through to the Claude CLI subprocess (subscription-billed). The
// CLI doesn't support tool_use over -p, so any turn the model chose to
// call a tool stays on the API.

import { NextRequest, NextResponse } from "next/server";
import { requireSupervisorAuth } from "@/lib/sales-auth";
import { AuthError } from "@/lib/auth";
import {
  CLONER_TOOLS,
  CLONER_SYSTEM_PROMPT,
  executeClonerTool,
  type ToolResult,
} from "@/lib/cloner-chat-tools";
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
    await requireSupervisorAuth();
    const body = (await request.json()) as { messages?: IncomingMessage[] };
    const incoming = Array.isArray(body.messages) ? body.messages : [];
    const apiKey = process.env.ANTHROPIC_API_KEY ?? "";

    // If neither path is configured, surface that up-front instead of a
    // confusing 500.
    if (!apiKey && !claudeCliAvailable()) {
      return NextResponse.json({
        text: "Chat isn't configured — set ANTHROPIC_API_KEY on the deploy, or run in dev with the Claude CLI in PATH.",
      });
    }

    // CLI-only mode: no API key but local CLI available. Tool-use is off
    // since `claude -p` doesn't expose tools — useful for asking about
    // the cloner conceptually but won't fire jobs.
    if (!apiKey && claudeCliAvailable()) {
      try {
        const reply = await callClaudeCli({
          system:
            CLONER_SYSTEM_PROMPT +
            "\n\n[Note: tool execution is unavailable in CLI-only mode. Describe what you would do but tell the user to retry once the deploy has ANTHROPIC_API_KEY set if they want the job to actually run.]",
          messages: incoming.map((m) => ({ role: m.role, content: m.content })),
        });
        return NextResponse.json({ text: reply, provider: "claude-cli" });
      } catch (err) {
        return NextResponse.json({
          text: `Claude CLI fell through: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    }

    const conversation: ConversationMessage[] = incoming.map((m) => ({
      role: m.role,
      content: String(m.content ?? ""),
    }));

    let lastAnthropicError: string | null = null;

    for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5-20250929",
          max_tokens: 1024,
          system: CLONER_SYSTEM_PROMPT,
          tools: CLONER_TOOLS,
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
        return NextResponse.json({ text, provider: "anthropic" });
      }

      conversation.push({ role: "assistant", content: blocks });

      const results: ToolResult[] = [];
      const toolResultBlocks: AnthropicBlock[] = [];
      for (const t of toolUses) {
        const r = await executeClonerTool({
          name: t.name!,
          input: t.input ?? {},
        });
        results.push(r);
        toolResultBlocks.push({
          type: "tool_result",
          tool_use_id: t.id!,
          content: JSON.stringify(r),
        });
      }
      conversation.push({ role: "user", content: toolResultBlocks });
    }

    // The Anthropic path errored AND we have a CLI on the box: try the
    // text-only fallback so the user at least gets a thoughtful reply.
    if (lastAnthropicError && claudeCliAvailable()) {
      try {
        const reply = await callClaudeCli({
          system:
            CLONER_SYSTEM_PROMPT +
            `\n\n[Anthropic API just errored with: ${lastAnthropicError}. Falling back to text-only mode — describe what you would do but ask the user to retry once the API is back if they want the job to actually run.]`,
          messages: incoming.map((m) => ({ role: m.role, content: m.content })),
        });
        return NextResponse.json({ text: reply, provider: "claude-cli" });
      } catch {
        /* fall through */
      }
    }

    return NextResponse.json({
      text: lastAnthropicError
        ? `Cloner chat failed: ${lastAnthropicError}`
        : "I ran out of tool steps before finishing. Try asking in smaller pieces.",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
