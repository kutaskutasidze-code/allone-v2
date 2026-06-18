import type { ChatMessage } from "./llm-types";

// Gemini (AI Studio REST) — the PRIMARY brain for the customer-facing bot.
// Two entry points:
//   callGemini()           → free-text conversation turn
//   callGeminiStructured() → strict JSON via responseSchema (data extraction)
// claude-bridge stays a fallback in the route. Up to 3 keys are rotated through
// on transient failure (quota / 5xx) for resilience.

const MODEL = "gemini-2.5-flash";

export function geminiConfigured(): boolean {
  return keys().length > 0;
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

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

// Low-level: POST a generateContent payload, rotating keys on transient errors.
async function generate(payload: object): Promise<string> {
  const allKeys = keys();
  if (allKeys.length === 0) {
    throw new Error("Gemini not configured — set GEMINI_API_KEY.");
  }
  const body = JSON.stringify(payload);
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
        if (isTransient(res.status)) {
          lastErr = err; // quota/5xx → try the next key
          continue;
        }
        throw err; // 4xx (bad request / bad key) → bail
      }
      const data = (await res.json()) as GeminiResponse;
      return (
        data.candidates?.[0]?.content?.parts
          ?.map((p) => p.text ?? "")
          .join("")
          .trim() ?? ""
      );
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err));
    }
  }
  throw lastErr ?? new Error("gemini: all keys failed");
}

// A conversation turn — warm free text. Low temperature for steadier
// instruction-following (greet-once, one-question, clean Georgian).
export async function callGemini(req: {
  system: string;
  messages: ChatMessage[];
  temperature?: number;
}): Promise<string> {
  const contents = req.messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const text = await generate({
    system_instruction: { parts: [{ text: req.system }] },
    contents,
    generationConfig: {
      temperature: req.temperature ?? 0.4,
      maxOutputTokens: 2048,
    },
  });
  if (!text) throw new Error("gemini: empty response");
  return text;
}

// A structured-extraction turn — returns parsed JSON validated against `schema`
// (Gemini's responseSchema). Temperature 0 so it doesn't drift or fabricate.
export async function callGeminiStructured(req: {
  system: string;
  userText: string;
  schema: object;
}): Promise<unknown> {
  const text = await generate({
    system_instruction: { parts: [{ text: req.system }] },
    contents: [{ role: "user", parts: [{ text: req.userText }] }],
    generationConfig: {
      temperature: 0,
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
      responseSchema: req.schema,
    },
  });
  if (!text) throw new Error("gemini: empty structured response");
  return JSON.parse(text);
}
