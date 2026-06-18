import type { ChatMessage } from "./llm-types";

// Gemini (AI Studio REST) — the PRIMARY brain for the customer-facing bot.
// We keep claude-bridge (the subscription CLI) as a fallback in the route, but
// Gemini has no token-rotation flakiness, so it's tried first. Up to 3 keys are
// rotated through on transient failure (quota / 5xx / 429) for resilience.

const MODEL = "gemini-2.5-flash";

export function geminiConfigured(): boolean {
  return Boolean(
    process.env.GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY_2 ||
    process.env.GEMINI_API_KEY_3,
  );
}

function keys(): string[] {
  return [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
  ].filter((k): k is string => Boolean(k));
}

function isTransient(status: number): boolean {
  return status === 429 || status === 500 || status === 503 || status === 504;
}

export async function callGemini(req: {
  system: string;
  messages: ChatMessage[];
}): Promise<string> {
  const allKeys = keys();
  if (allKeys.length === 0) {
    throw new Error("Gemini not configured — set GEMINI_API_KEY.");
  }

  const contents = req.messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const body = JSON.stringify({
    system_instruction: { parts: [{ text: req.system }] },
    contents,
    generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
  });

  let lastErr: Error | null = null;
  for (const key of allKeys) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          signal: AbortSignal.timeout(60_000),
        },
      );
      if (!res.ok) {
        const detail = await res.text();
        const err = new Error(
          `gemini HTTP ${res.status}: ${detail.slice(0, 160)}`,
        );
        // On a quota/5xx, try the next key; on a 4xx (bad request/auth) bail.
        if (isTransient(res.status)) {
          lastErr = err;
          continue;
        }
        throw err;
      }
      const data = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const text = data.candidates?.[0]?.content?.parts
        ?.map((p) => p.text ?? "")
        .join("")
        .trim();
      if (!text) throw new Error("gemini: empty response");
      return text;
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err));
      // network/timeout — try the next key
    }
  }
  throw lastErr ?? new Error("gemini: all keys failed");
}
