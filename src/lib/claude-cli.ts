// Local Claude CLI subprocess invocation — gives us a subscription-billed
// text path in dev when the Anthropic API errors out or to avoid burning
// API credits while iterating. Ported from BF's app/lib/llm-fallback.ts
// (callClaudeCli) and trimmed to the single-turn text shape this CRM
// needs. NOT used for tool-use turns: the CLI's `-p` mode doesn't expose
// the tool_use loop, so those stay on the Anthropic SDK.
//
// Resolution order for the binary + config dir mirrors BF exactly so a
// single CLAUDE_CONFIG_DIR env entry routes both projects to the same
// subscription account.

import "server-only";
import { spawn } from "node:child_process";

import type { ChatMessage } from "./llm-types";

export interface ClaudeCliRequest {
  system: string;
  messages: ChatMessage[];
  /** Timeout for the subprocess in milliseconds (default 60s). */
  timeoutMs?: number;
}

export async function callClaudeCli(req: ClaudeCliRequest): Promise<string> {
  const transcript = req.messages
    .map((m) => `${m.role === "user" ? "USER" : "ASSISTANT"}: ${m.content}`)
    .join("\n\n");
  const prompt = `[System]\n${req.system}\n\n[Conversation so far]\n${transcript}\n\n[Now]\nReply as ASSISTANT. Follow the system instructions exactly. Output only the assistant's reply (no labels, no preamble).`;

  const bin =
    process.env["CLAUDE_CLI_PATH"] ||
    `${process.env["HOME"]}/.local/bin/claude`;
  const configDir =
    process.env["CLAUDE_CONFIG_DIR_FOR_FALLBACK"] ||
    process.env["CLAUDE_CONFIG_DIR"] ||
    `${process.env["HOME"]}/.claude-account1`;

  // No `--model` so the CLI uses the subscription's default and stays on
  // the subscription billing plane. Explicit `--model` forces API mode.
  const args = ["-p", "--output-format", "json"];

  // Scrub env vars that route the CLI subprocess away from subscription
  // auth: ANTHROPIC_API_KEY presence forces API mode; CLAUDECODE / CLAUDE_CODE_*
  // leak in when the dev server is launched from inside a Claude Code session
  // and can interfere with the subprocess's own auth handshake.
  const cleanEnv: NodeJS.ProcessEnv = { ...process.env };
  delete cleanEnv["ANTHROPIC_API_KEY"];
  for (const k of Object.keys(cleanEnv)) {
    if (k === "CLAUDECODE" || k.startsWith("CLAUDE_CODE_")) delete cleanEnv[k];
  }
  cleanEnv["CLAUDE_CONFIG_DIR"] = configDir;

  const timeoutMs = req.timeoutMs ?? 60_000;

  return new Promise<string>((resolve, reject) => {
    const child = spawn(bin, args, { env: cleanEnv });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`claude cli: timeout (${timeoutMs}ms)`));
    }, timeoutMs);
    child.stdout.on("data", (d) => {
      stdout += d.toString();
    });
    child.stderr.on("data", (d) => {
      stderr += d.toString();
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        return reject(
          new Error(
            `claude cli exit ${code}: ${stderr.slice(0, 200) || stdout.slice(0, 200)}`,
          ),
        );
      }
      try {
        const parsed = JSON.parse(stdout) as {
          is_error?: boolean;
          result?: string;
        };
        if (parsed.is_error)
          return reject(
            new Error(`claude cli error: ${parsed.result ?? "unknown"}`),
          );
        if (typeof parsed.result !== "string")
          return reject(new Error("claude cli: missing result field"));
        resolve(parsed.result);
      } catch {
        reject(new Error(`claude cli: bad json — ${stdout.slice(0, 200)}`));
      }
    });
    child.stdin.write(prompt);
    child.stdin.end();
  });
}

/** True iff the env has opted in to using the CLI as a fallback. The dev
 *  server defaults to on so iteration cost stays close to zero; production
 *  Vercel runs always have NODE_ENV=production and no /.local/bin on disk
 *  so the CLI path is silently skipped. */
export function claudeCliAvailable(): boolean {
  return (
    process.env["NODE_ENV"] !== "production" ||
    process.env["CLAUDE_CLI_FALLBACK"] === "1"
  );
}
