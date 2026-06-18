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

function buildConversationSystem(
  clientName: string,
  intro: string | null,
  questions: BotQuestion[],
): string {
  const optional = questions
    .map((q, i) => {
      const opts = q.options?.length ? ` (მაგ.: ${q.options.join(" / ")})` : "";
      return `${i + 1}. ${q.text}${opts}`;
    })
    .join("\n");
  return [
    `შენ ხარ AllOne-ის ინტეიქ-აგენტი "${clientName}"-ისთვის. საუბრობ ქართულად, თბილად და პროფესიონალურად.`,
    intro ? `კონტექსტი: ${intro}` : "",
    `შენი მიზანია ბუნებრივ საუბარში გაიგო კლიენტის ბიზნესი და საჭიროებები.`,
    ``,
    `წესები:`,
    `- მისალმება მხოლოდ ერთხელ — შენს პირველ შეტყობინებაში. შემდეგ აღარასოდეს მიესალმო ("გამარჯობა" აღარ თქვა).`,
    `- ერთ ჯერზე მხოლოდ ერთი მოკლე კითხვა (არასდროს სიის სახით).`,
    `- თუ კლიენტი გკითხავს, ჯერ მოკლედ უპასუხე დამხმარედ, მერე ბუნებრივად დაუბრუნდი შენს კითხვას.`,
    `- იყავი მოქნილი. თუ კლიენტმა კონკრეტულ კითხვას არ უპასუხა, მაქსიმუმ ერთხელ გადაჰკითხე — მერე გადადი შემდეგ თემაზე. არასოდეს გაიმეორო ერთი და იგივე კითხვა რამდენჯერმე.`,
    `- ფასებს ნუ დაასახელებ — შეთავაზებას გუნდი მოამზადებს.`,
    `- წერე მხოლოდ სუფთა ქართულად (მხედრული). ნუ აურევ ლათინურ ან კირილიცის ასოებს.`,
    ``,
    `მთავარი (აუცილებელი) თემები — სცადე ეს დაფარო:`,
    `- რა სჭირდება (პროდუქტი/სეგმენტი) და რა საქმიანობს;`,
    `- მთავარი სასურველი ფუნქციონალი;`,
    `- ბიუჯეტი და სასურველი ვადა;`,
    `- არსებული მასალები: ვებსაიტი / სოციალური ქსელები / ბრენდინგი (ლოგო, ფერები) — ან მოკლე აღწერა, თუ არაფერი აქვს.`,
    ``,
    `დამატებითი თემები (სურვილისამებრ, არ არის სავალდებულო ყველა — ჰკითხე მხოლოდ თუ საუბარი ბუნებრივად უშვებს):`,
    optional,
    ``,
    `როცა მთავარი თემები დაფარულია, ნუ გააჭიანურებ — სცადე ~6-8 გაცვლაში დაასრულო. დასასრულებლად: დაწერე მოკლე დამამთავრებელი წინადადება (მადლობა + რომ მალე მიიღებენ შეთავაზებას აქვე), შემდეგ ახალ ხაზზე ზუსტად "${COMPLETE_MARKER}". მარკერის შემდეგ აღარაფერი დაამატო — JSON არ დაწერო.`,
  ]
    .filter(Boolean)
    .join("\n");
}

// Strict extractor: only what the client said; null otherwise; literal values,
// not option-buckets.
function buildExtractionSystem(questions: BotQuestion[]): string {
  const list = questions
    .map((q) => {
      const opts = q.options?.length
        ? ` — ვარიანტები (მხოლოდ მინიშნებად): ${q.options.join(" / ")}`
        : "";
      return `[${q.id}] ${q.text}${opts}`;
    })
    .join("\n");
  return [
    `შენ ხარ მონაცემთა ექსტრაქტორი. ქვემოთ მოცემულია ინტეიქ-საუბრის ტრანსკრიპტი კლიენტსა და აგენტს შორის. ამოიღე მხოლოდ ის, რაც კლიენტმა *რეალურად* თქვა.`,
    ``,
    `მკაცრი წესები:`,
    `- თუ თემა საუბარში არ განხილულა ან კლიენტს არ უპასუხია — დააბრუნე null (social_links-ისთვის ცარიელი მასივი []).`,
    `- არასოდეს გამოიგონო, არ ჩასვა ნაგულისხმევი მნიშვნელობა და არ მიამიდე უახლოეს ვარიანტს.`,
    `- შეინახე კლიენტის ნამდვილი, კონკრეტული პასუხი მისივე სიტყვებით (მაგ. ბიუჯეტი "2000 ₾", ვადა "3 კვირა") — არა დიაპაზონი ან კატეგორია.`,
    `- ვარიანტები მხოლოდ მინიშნებაა შენთვის — არ ჩათვალო პასუხად.`,
    ``,
    `კითხვები:`,
    list,
  ].join("\n");
}

// Gemini responseSchema (OpenAPI subset): every question id → nullable string,
// plus the asset keys.
function buildAnswersSchema(questions: BotQuestion[]): object {
  const properties: Record<string, object> = {};
  for (const q of questions) {
    properties[q.id] = { type: "STRING", nullable: true };
  }
  properties.current_website = { type: "STRING", nullable: true };
  properties.social_links = { type: "ARRAY", items: { type: "STRING" } };
  properties.brand_assets = { type: "STRING", nullable: true };
  properties.business_description = { type: "STRING", nullable: true };
  return { type: "OBJECT", properties };
}

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
  questions: BotQuestion[],
): Promise<Record<string, unknown>> {
  const system = buildExtractionSystem(questions);
  const userText = `ტრანსკრიპტი:\n${transcriptOf(messages)}`;
  if (geminiConfigured()) {
    const out = await callGeminiStructured({
      system,
      userText,
      schema: buildAnswersSchema(questions),
    });
    return out as Record<string, unknown>;
  }
  const sys = `${system}\n\nდააბრუნე მხოლოდ JSON ობიექტი: თითო კითხვის id→პასუხი ან null, ასევე current_website, social_links, brand_assets, business_description. JSON-ის გარდა აღარაფერი.`;
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
  const system = buildConversationSystem(cfg.client_name, cfg.intro, questions);

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
    answers = await extractAnswers(fullTranscript, questions);
  } catch {
    // Extraction failed — don't submit garbage; keep the conversation going.
    return NextResponse.json({ reply: closing, complete: false });
  }

  return NextResponse.json({ reply: closing, complete: true, answers });
}
