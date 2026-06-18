// Claude-bridge HTTP client.
//
// All chat traffic from this CRM (sales side-chat, cloner chat) routes
// through the `claude -p` subprocess running behind a tiny Express bridge
// on Hetzner (chat.allonelabs.com). The bridge uses the box's
// subscription-billed Claude session, so requests don't burn API credits.
//
// Because `claude -p` doesn't expose Anthropic's native tool_use loop,
// we run a text-marker tool protocol instead: the system prompt teaches
// the model to emit XML-ish markers when it wants to call a tool, this
// module parses them, executes via the registered handler, and feeds the
// tool_result back into the next turn as another marker.

import "server-only";

import type { ChatMessage } from "./llm-types";

// Read env at call time — Vercel's warm function instances cache module
// loads, so a const evaluated here would freeze whatever value was set
// when the container first booted. The first user attempt failed exactly
// this way: the empty-string defaults below got captured before the
// CLAUDE_BRIDGE_* vars were saved on the project.
function bridgeUrl(): string {
  return process.env.CLAUDE_BRIDGE_URL || "";
}
function bridgeToken(): string {
  return process.env.CLAUDE_BRIDGE_TOKEN || "";
}

export function bridgeConfigured(): boolean {
  return bridgeUrl().length > 0 && bridgeToken().length > 0;
}

// ── Plain text turn ────────────────────────────────────────────────────

// The bridge wraps a `claude -p` subprocess whose OAuth token auto-refreshes.
// During a refresh window some calls transiently fail with "Not logged in" /
// "Invalid authentication credentials" / a 5xx while others succeed. Retrying a
// beat later almost always lands on a healthy subprocess, so we never surface
// that flake to the (customer-facing) chat.
function isTransientBridgeError(msg: string): boolean {
  return /not logged in|invalid authentication|authentication_error|401|50\d|fetch failed|timed? ?out|terminated|ECONNRESET|socket/i.test(
    msg,
  );
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function callBridge(req: {
  system: string;
  messages: ChatMessage[];
}): Promise<string> {
  const url = bridgeUrl();
  const token = bridgeToken();
  if (!url || !token) {
    throw new Error(
      "Claude bridge not configured — set CLAUDE_BRIDGE_URL and CLAUDE_BRIDGE_TOKEN.",
    );
  }

  const attempts = 3;
  let lastErr: Error | null = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(`${url.replace(/\/$/, "")}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ system: req.system, messages: req.messages }),
        signal: AbortSignal.timeout(180_000),
      });
      const text = await res.text();
      let data: { text?: string; error?: string };
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`bridge: bad json — ${text.slice(0, 200)}`);
      }
      if (!res.ok || typeof data.text !== "string") {
        throw new Error(data.error || `bridge HTTP ${res.status}`);
      }
      return data.text;
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err));
      const last = i === attempts - 1;
      if (last || !isTransientBridgeError(lastErr.message)) throw lastErr;
      await sleep(1500 * (i + 1)); // 1.5s, 3s — ride out the token-refresh window
    }
  }
  throw lastErr ?? new Error("bridge: unknown error");
}

// ── Tool-aware turn (text-marker protocol) ────────────────────────────

export interface BridgeToolDef {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface BridgeToolResult {
  tool: string;
  ok: boolean;
  data?: unknown;
  error?: string;
}

export interface ToolLoopOptions {
  system: string;
  messages: ChatMessage[];
  tools: BridgeToolDef[];
  executeTool: (call: {
    name: string;
    input: Record<string, unknown>;
  }) => Promise<BridgeToolResult>;
  maxIterations?: number;
}

export interface ToolLoopResult {
  text: string;
  iterations: number;
  toolCalls: Array<{
    name: string;
    input: Record<string, unknown>;
    result: BridgeToolResult;
  }>;
}

// The model emits exactly this when it wants to call a tool. Everything
// after the closing tag (if any) is treated as in-line commentary and
// discarded for the next turn so the loop converges. Final text replies
// must NOT contain any <tool_call> tag.
const TOOL_CALL_RE = /<tool_call\s+name="([^"]+)">([\s\S]*?)<\/tool_call>/i;

function toolsBlock(tools: BridgeToolDef[]): string {
  const lines = tools.map((t) => {
    const required = t.input_schema.required?.length
      ? ` (required: ${t.input_schema.required.join(", ")})`
      : "";
    const props = Object.entries(t.input_schema.properties)
      .map(([k, v]) => {
        const desc =
          (v as { description?: string; type?: string }).description ?? "";
        const type = (v as { type?: string }).type ?? "any";
        return `    ${k} (${type}): ${desc}`;
      })
      .join("\n");
    return `- ${t.name}: ${t.description}${required}\n${props}`;
  });
  return [
    "TOOLS — call these when the user asks you to *do* something. To call a tool:",
    "",
    '  <tool_call name="tool_name">{"arg1":"value","arg2":2}</tool_call>',
    "",
    "Emit only the tool_call tag (and nothing else) in your reply. After it executes you will see a tool_result tag, then continue the conversation as normal. NEVER fabricate tool_result tags yourself.",
    "",
    "Available tools:",
    ...lines,
  ].join("\n");
}

export async function callBridgeWithTools(
  opts: ToolLoopOptions,
): Promise<ToolLoopResult> {
  const max = opts.maxIterations ?? 5;
  const baseSystem = `${opts.system}\n\n${toolsBlock(opts.tools)}`;
  const transcript: ChatMessage[] = opts.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));
  const calls: ToolLoopResult["toolCalls"] = [];

  for (let i = 0; i < max; i++) {
    const reply = await callBridge({
      system: baseSystem,
      messages: transcript,
    });
    const match = reply.match(TOOL_CALL_RE);
    if (!match) {
      return { text: reply.trim(), iterations: i + 1, toolCalls: calls };
    }
    const name = match[1]!;
    const rawInput = match[2]!.trim();
    let input: Record<string, unknown> = {};
    try {
      input = rawInput ? (JSON.parse(rawInput) as Record<string, unknown>) : {};
    } catch (e) {
      // Bad JSON from the model — feed the parse error back and let it
      // self-correct on the next turn instead of crashing the loop.
      transcript.push({ role: "assistant", content: reply });
      transcript.push({
        role: "user",
        content: `<tool_result tool="${name}" ok="false">${
          e instanceof Error ? e.message : "invalid JSON input"
        }</tool_result>`,
      });
      continue;
    }
    const result = await opts.executeTool({ name, input });
    calls.push({ name, input, result });
    transcript.push({ role: "assistant", content: reply });
    transcript.push({
      role: "user",
      content: `<tool_result tool="${name}" ok="${result.ok}">${
        result.ok
          ? JSON.stringify(result.data ?? {})
          : JSON.stringify({ error: result.error })
      }</tool_result>`,
    });
  }
  return {
    text: "I ran out of tool steps before finishing. Try asking in smaller pieces.",
    iterations: max,
    toolCalls: calls,
  };
}
