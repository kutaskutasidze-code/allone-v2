import { createSign } from "node:crypto";
import type { ChatMessage } from "./llm-types";

// Gemini — the PRIMARY brain for the customer-facing bot.
// Two entry points:
//   callGemini()           → free-text conversation turn
//   callGeminiStructured() → strict JSON via responseSchema (data extraction)
//
// TRANSPORTS, tried in order by the shared generate():
//   1. Vertex AI (service-account OAuth) — NOT rate-limited. Preferred.
//   2. AI Studio REST keys (up to 3, rotated) — free tier, 429s under load.
// claude-bridge stays a fallback in the route itself, behind both of these.
//
// Vertex was added after free-tier quota exhaustion silently dropped completed
// questionnaire intakes: the conversation ran on the bridge fallback while the
// extraction call — which had no fallback — died on a Gemini 429, so a finished
// chat produced no record. Vertex removes the quota ceiling from both calls.

const MODEL = "gemini-2.5-flash";
const VERTEX_LOCATION = process.env.GEMINI_VERTEX_LOCATION || "global";

export function geminiConfigured(): boolean {
  return vertexConfigured() || keys().length > 0;
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

function readText(data: GeminiResponse): string {
  return (
    data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("")
      .trim() ?? ""
  );
}

// ── Vertex service-account transport ──────────────────────────────────────
// The SA JSON is provided as env (raw JSON or base64). We mint a short-lived
// OAuth token by signing a JWT ourselves (no google-auth-library dependency)
// and cache it in module scope until shortly before expiry.

interface ServiceAccount {
  client_email: string;
  private_key: string;
  token_uri: string;
  project_id: string;
}

let cachedSa: ServiceAccount | null | undefined;
function serviceAccount(): ServiceAccount | null {
  if (cachedSa !== undefined) return cachedSa;
  const raw = process.env.GEMINI_VERTEX_SA_JSON;
  if (!raw) return (cachedSa = null);
  try {
    const json = raw.trim().startsWith("{")
      ? raw
      : Buffer.from(raw, "base64").toString("utf8");
    const sa = JSON.parse(json) as ServiceAccount;
    if (!sa.client_email || !sa.private_key || !sa.project_id) {
      console.error("[gemini] GEMINI_VERTEX_SA_JSON missing required fields");
      return (cachedSa = null);
    }
    return (cachedSa = sa);
  } catch (err) {
    console.error("[gemini] GEMINI_VERTEX_SA_JSON parse failed", err);
    return (cachedSa = null);
  }
}

export function vertexConfigured(): boolean {
  return serviceAccount() !== null;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

let cachedToken: { token: string; exp: number } | null = null;
async function vertexToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  // Reuse until 60s before expiry.
  if (cachedToken && cachedToken.exp - 60 > now) return cachedToken.token;

  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/cloud-platform",
      aud: sa.token_uri,
      iat: now,
      exp: now + 3600,
    }),
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claim}`);
  const sig = b64url(signer.sign(sa.private_key));
  const jwt = `${header}.${claim}.${sig}`;

  const res = await fetch(sa.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  const j = (await res.json()) as { access_token?: string; error?: string };
  if (!res.ok || !j.access_token) {
    throw new Error(`vertex token: ${res.status} ${j.error ?? ""}`);
  }
  cachedToken = { token: j.access_token, exp: now + 3600 };
  return j.access_token;
}

async function generateVertex(
  sa: ServiceAccount,
  payload: object,
): Promise<string> {
  const token = await vertexToken(sa);
  const host =
    VERTEX_LOCATION === "global"
      ? "aiplatform.googleapis.com"
      : `${VERTEX_LOCATION}-aiplatform.googleapis.com`;
  const url = `https://${host}/v1/projects/${sa.project_id}/locations/${VERTEX_LOCATION}/publishers/google/models/${MODEL}:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) {
    const detail = await res.text();
    // A 401 usually means our cached token is stale — drop it so the next
    // attempt re-mints.
    if (res.status === 401) cachedToken = null;
    throw new Error(`vertex HTTP ${res.status}: ${detail.slice(0, 160)}`);
  }
  return readText((await res.json()) as GeminiResponse);
}

// Low-level: POST a generateContent payload. Vertex first (no quota), then AI
// Studio keys (rotated on transient errors).
async function generate(payload: object): Promise<string> {
  let lastErr: Error | null = null;

  const sa = serviceAccount();
  if (sa) {
    try {
      return await generateVertex(sa, payload);
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err));
      // Fall through to AI Studio keys if any are configured.
    }
  }

  const allKeys = keys();
  if (allKeys.length === 0) {
    if (lastErr) throw lastErr;
    throw new Error(
      "Gemini not configured — set GEMINI_VERTEX_SA_JSON or GEMINI_API_KEY.",
    );
  }
  const body = JSON.stringify(payload);
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
      return readText((await res.json()) as GeminiResponse);
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err));
    }
  }
  throw lastErr ?? new Error("gemini: all transports failed");
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
      // gemini-2.5-flash is a reasoning model; thinking tokens draw from the
      // output budget and add latency. A warm one-question chat turn needs no
      // reasoning, and the extra latency compounds with the extraction call in
      // the same request. Turn it off for speed and predictability.
      thinkingConfig: { thinkingBudget: 0 },
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
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
      responseSchema: req.schema,
      // Extraction is mechanical: read the transcript, copy what was said into
      // fields. Reasoning adds latency and its variable length occasionally
      // exhausted the output budget, which failed the whole extraction. Off.
      thinkingConfig: { thinkingBudget: 0 },
    },
  });
  if (!text) throw new Error("gemini: empty structured response");
  return JSON.parse(text);
}
