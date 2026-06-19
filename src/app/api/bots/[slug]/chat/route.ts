import { NextRequest, NextResponse } from "next/server";
import { getBotConfigBySlug } from "@/lib/bots/repo";
import { callBridge, bridgeConfigured } from "@/lib/claude-bridge";
import {
  callGemini,
  callGeminiStructured,
  geminiConfigured,
} from "@/lib/gemini";
import type { ChatMessage } from "@/lib/llm-types";
import type { BotQuestion } from "@/lib/bots/types";
import { selectSystemPrompts } from "./select-prompts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Conversational intake agent (Gemini primary, claude-bridge fallback).
//
// Two passes, kept separate so each does one job well:
//   1. CONVERSATION — the bot drives a warm chat to learn the business. When the
//      core topics are covered it ends with a bare "<<COMPLETE>>" marker.
//   2. EXTRACTION — once complete (or after a turn cap forces it), a dedicated
//      structured call reads the transcript and returns STRICT JSON: only what
//      the client actually said, null for anything not covered (no fabrication,
//      no snapping to the nearest option).

const COMPLETE_MARKER = "<<COMPLETE>>";
const SEED_PREFIX = "(ვიზიტორმა"; // hidden opening seed — not a real client turn
// Hard stop so a looping conversation always reaches the thread (and can never
// grow into the 60KB request cap as a raw error).
const FORCE_COMPLETE_AFTER_TURNS = 12;

function transcriptOf(messages: ChatMessage[]): string {
  return messages
    .filter((m) => !(m.role === "user" && m.content.startsWith(SEED_PREFIX)))
    .map((m) => `${m.role === "user" ? "კლიენტი" : "აგენტი"}: ${m.content}`)
    .join("\n");
}

// Extract the answers JSON. Prefer Gemini's schema-validated output; fall back
// to a bridge call that returns JSON (brace-sliced) if Gemini isn't available.
async function extractAnswers(
  messages: ChatMessage[],
  extractionSystem: string,
  schema: object,
): Promise<Record<string, unknown>> {
  const userText = `ტრანსკრიპტი:\n${transcriptOf(messages)}`;
  if (geminiConfigured()) {
    const out = await callGeminiStructured({
      system: extractionSystem,
      userText,
      schema,
    });
    return out as Record<string, unknown>;
  }
  const sys = `${extractionSystem}\n\nReturn ONLY a JSON object mapping each question id→answer or null, plus current_website, social_links, brand_assets, business_description, contact_name, contact_email, contact_phone. Nothing but JSON.`;
  const raw = await callBridge({
    system: sys,
    messages: [{ role: "user", content: userText }],
  });
  const js = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
  return JSON.parse(js) as Record<string, unknown>;
}

// One conversation turn, Gemini-first with bridge fallback.
async function converse(
  system: string,
  messages: ChatMessage[],
): Promise<string> {
  if (geminiConfigured()) {
    try {
      return await callGemini({ system, messages });
    } catch (err) {
      if (!bridgeConfigured()) throw err;
      return await callBridge({ system, messages });
    }
  }
  return await callBridge({ system, messages });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  let body: { messages?: ChatMessage[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (messages.length === 0) {
    return NextResponse.json({ error: "messages required" }, { status: 400 });
  }
  if (JSON.stringify(messages).length > 60_000) {
    return NextResponse.json(
      { error: "conversation too long" },
      { status: 413 },
    );
  }

  const cfg = await getBotConfigBySlug(slug);
  if (!cfg) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (!geminiConfigured() && !bridgeConfigured()) {
    return NextResponse.json(
      { error: "chat brain not configured" },
      { status: 503 },
    );
  }

  const questions = (cfg.questions as BotQuestion[]) ?? [];
  const prompts = selectSystemPrompts({
    client_name: cfg.client_name,
    intro: cfg.intro,
    knowledge: cfg.knowledge ?? null,
    questions,
  });
  const system = prompts.conversation;

  // 1. Conversation turn.
  let raw: string;
  try {
    raw = await converse(system, messages);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "ვერ მოხერხდა — სცადეთ მოგვიანებით",
      },
      { status: 502 },
    );
  }

  const marker = raw.indexOf(COMPLETE_MARKER);
  const modelDone = marker !== -1;
  const realUserTurns = messages.filter(
    (m) => m.role === "user" && !m.content.startsWith(SEED_PREFIX),
  ).length;
  const forced = !modelDone && realUserTurns >= FORCE_COMPLETE_AFTER_TURNS;

  // Not done yet → just return the reply and keep chatting.
  if (!modelDone && !forced) {
    return NextResponse.json({ reply: raw.trim(), complete: false });
  }

  // 2. Completion → extract the structured answers.
  const closing = modelDone
    ? raw.slice(0, marker).trim() ||
      "მადლობა! მალე მიიღებთ თქვენს შეთავაზებას აქვე."
    : "გმადლობთ ინფორმაციისთვის! ვამზადებთ თქვენს შეთავაზებას და მალე მოგაწვდით აქვე. 🙌";

  const fullTranscript: ChatMessage[] = [
    ...messages,
    { role: "assistant", content: closing },
  ];
  let answers: Record<string, unknown>;
  try {
    answers = await extractAnswers(
      fullTranscript,
      prompts.extraction,
      prompts.schema,
    );
  } catch {
    // Extraction failed — don't submit garbage; keep the conversation going.
    return NextResponse.json({ reply: closing, complete: false });
  }

  return NextResponse.json({ reply: closing, complete: true, answers });
}
