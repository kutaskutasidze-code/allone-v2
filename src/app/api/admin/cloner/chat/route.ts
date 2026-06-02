// Cloner chat backend — Hetzner-bridge only. Same text-marker tool
// protocol as /api/sales/chat, but with the cloner-specific system
// prompt and tool registry (clone_site, swap_template, deploy_clone, …).
// Anthropic API was ripped out per the "no API" decision; everything
// rides on the subscription-billed `claude -p` subprocess via
// chat.allonelabs.com.

import { NextRequest, NextResponse } from "next/server";
import { requireSupervisorAuth } from "@/lib/sales-auth";
import { AuthError } from "@/lib/auth";
import {
  CLONER_TOOLS,
  CLONER_SYSTEM_PROMPT,
  executeClonerTool,
} from "@/lib/cloner-chat-tools";
import { callBridgeWithTools, bridgeConfigured } from "@/lib/claude-bridge";

interface IncomingMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    await requireSupervisorAuth();
    const body = (await request.json()) as { messages?: IncomingMessage[] };
    const incoming = Array.isArray(body.messages) ? body.messages : [];

    if (!bridgeConfigured()) {
      return NextResponse.json({
        text: "Cloner chat isn't configured — set CLAUDE_BRIDGE_URL and CLAUDE_BRIDGE_TOKEN on the deploy to point at the Hetzner claude-bridge.",
      });
    }

    try {
      const result = await callBridgeWithTools({
        system: CLONER_SYSTEM_PROMPT,
        messages: incoming.map((m) => ({ role: m.role, content: m.content })),
        tools: CLONER_TOOLS,
        executeTool: async (call) => {
          const r = await executeClonerTool(call);
          // cloner-chat-tools.ToolResult already matches BridgeToolResult.
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
        text: `Cloner chat failed: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
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
