import { NextRequest, NextResponse, after } from "next/server";
import {
  getBotConfigBySlug,
  saveSession,
  countRealTurns,
  sanitizeTranscript,
  SEED_PREFIX,
} from "@/lib/bots/repo";
import { callBridge, bridgeConfigured } from "@/lib/claude-bridge";
import {
  callGemini,
  callGeminiStructured,
  geminiConfigured,
} from "@/lib/gemini";
import type { ChatMessage } from "@/lib/llm-types";
import type { BotQuestion } from "@/lib/bots/types";
import { selectSystemPrompts, COMPLETE_MARKER } from "./select-prompts";

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
// Hard stop so a looping conversation always reaches the thread (and can never
// grow into the 60KB request cap as a raw error).
const FORCE_COMPLETE_AFTER_TURNS = 20;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Client-minted session ids are untrusted input and become a primary key —
 *  only accept a well-formed UUID. */
function isUuid(v: unknown): v is string {
  return typeof v === "string" && UUID_RE.test(v);
}

function transcriptOf(messages: ChatMessage[]): string {
  return messages
    .filter((m) => !(m.role === "user" && m.content.startsWith(SEED_PREFIX)))
    .map((m) => `${m.role === "user" ? "კლიენტი" : "აგენტი"}: ${m.content}`)
    .join("\n");
}

// Extract the answers JSON. Prefer Gemini's schema-validated output; fall back
// to a bridge call that returns JSON (brace-sliced).
// `bridgeSuffix` is path-specific: Georgian bots get the Georgian suffix so
// their behavior is byte-for-byte unchanged when Gemini is down.
//
// The fallback fires when Gemini is unconfigured OR when it FAILS — the same
// resilience `converse()` already has. Without that symmetry a Gemini quota
// window (three keys, all 429 on the free tier) let the conversation run to its
// closing line via the bridge and then killed extraction, so the visitor was
// told "we'll contact you" while nothing was ever saved.
async function extractAnswers(
  messages: ChatMessage[],
  extractionSystem: string,
  schema: object,
  bridgeSuffix: string,
): Promise<Record<string, unknown>> {
  const userText = `ტრანსკრიპტი:\n${transcriptOf(messages)}`;
  if (geminiConfigured()) {
    try {
      const out = await callGeminiStructured({
        system: extractionSystem,
        userText,
        schema,
      });
      return out as Record<string, unknown>;
    } catch (err) {
      if (!bridgeConfigured()) throw err;
      console.error("[bots/chat] gemini extraction failed, using bridge", err);
    }
  }
  const sys = `${extractionSystem}\n\n${bridgeSuffix}`;
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

  let body: { messages?: ChatMessage[]; session_id?: unknown };
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

  // Durable session. The visitor's answers used to exist only in their browser
  // tab until the model emitted <<COMPLETE>> (12+ turns in), so closing the tab
  // early threw the whole conversation away. We now persist after every turn.
  //
  // `transcript` is mutated below to include this turn's reply; `after()` runs
  // once, post-response, and reads the final value — so saving never delays the
  // visitor and never fails the turn.
  const sessionId = isUuid(body.session_id) ? body.session_id : null;
  let transcript = sanitizeTranscript(messages);
  if (sessionId) {
    after(async () => {
      await saveSession({
        sessionId,
        botSlug: slug,
        leadId: cfg.lead_id,
        clientName: cfg.client_name,
        transcript,
        userAgent: req.headers.get("user-agent"),
      });
    });
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
  const realUserTurns = countRealTurns(transcript);
  const forced = !modelDone && realUserTurns >= FORCE_COMPLETE_AFTER_TURNS;

  // Not done yet → just return the reply and keep chatting.
  if (!modelDone && !forced) {
    const reply = raw.trim();
    transcript = sanitizeTranscript([
      ...messages,
      { role: "assistant", content: reply },
    ]);
    return NextResponse.json({ reply, complete: false, session_id: sessionId });
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
  transcript = sanitizeTranscript(fullTranscript);
  let answers: Record<string, unknown>;
  try {
    answers = await extractAnswers(
      fullTranscript,
      prompts.extraction,
      prompts.schema,
      prompts.bridgeSuffix,
    );
  } catch (err) {
    // Both providers failed. We've already said goodbye to the visitor, so
    // going quiet here is the worst option: they leave believing we have their
    // brief while nothing reaches the sales team. Complete anyway with no
    // extracted answers — submit still writes the row and notifies the rep, and
    // the full transcript rides along, so a human can read it and follow up.
    // No contact is extracted, so hasContact() is false and the automatic offer
    // never fires on this degraded path.
    console.error("[bots/chat] extraction failed on both providers", err);
    return NextResponse.json({
      reply: closing,
      complete: true,
      answers: {},
      degraded: true,
      session_id: sessionId,
    });
  }

  return NextResponse.json({
    reply: closing,
    complete: true,
    answers,
    session_id: sessionId,
  });
}
