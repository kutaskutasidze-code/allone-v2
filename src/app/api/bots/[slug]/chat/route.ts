import { NextRequest, NextResponse } from "next/server";
import { getBotConfigBySlug } from "@/lib/bots/repo";
import { callBridge, bridgeConfigured } from "@/lib/claude-bridge";
import type { ChatMessage } from "@/lib/llm-types";
import type { BotQuestion } from "@/lib/bots/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Conversational intake agent. The bot's goal is to gather the info described
// by its configured questions — but conversationally: one thing at a time,
// answering the visitor's own questions along the way. When it has everything,
// it emits a closing message, then a line "<<COMPLETE>>" and a JSON object
// mapping each question id → the gathered answer. The client detects that,
// submits the answers, and moves the visitor into their thread.

function buildSystem(
  clientName: string,
  intro: string | null,
  questions: BotQuestion[],
): string {
  const goals = questions
    .map((q, i) => {
      const opts = q.options?.length ? ` (მაგ.: ${q.options.join(" / ")})` : "";
      return `${i + 1}. [${q.id}] ${q.text}${opts}`;
    })
    .join("\n");
  return [
    `შენ ხარ AllOne-ის ინტეიქ-აგენტი "${clientName}"-ისთვის. საუბრობ ქართულად, თბილად და პროფესიონალურად.`,
    intro ? `კონტექსტი: ${intro}` : "",
    `შენი მიზანია ბუნებრივ საუბარში მოიპოვო რაც შეიძლება მეტი ინფორმაცია კლიენტის ბიზნესისა და საჭიროებების შესახებ — ქვემოთ ჩამოთვლილი თემების მიხედვით.`,
    `წესები:`,
    `- ერთ ჯერზე დასვი მხოლოდ ერთი მოკლე კითხვა (არა სიის სახით).`,
    `- თუ კლიენტი რამეს გკითხავს, ჯერ უპასუხე დამხმარედ, მერე ბუნებრივად დააბრუნე საუბარი შენს კითხვაზე.`,
    `- იყავი მოქნილი — არ დაჟინდე ზუსტ ფორმულირებაზე; მთავარია არსი მოიპოვო.`,
    `- ნუ გადაამეტებ — როცა საკმარისი ინფორმაცია გექნება, დაასრულე.`,
    ``,
    `მოსაპოვებელი ინფორმაცია:`,
    goals,
    ``,
    `ასევე — აუცილებლად მოიპოვე კლიენტის არსებული მასალები, რომ მათი დემო ავაწყოთ:`,
    `- მიმდინარე ვებსაიტის ბმული (თუ აქვს);`,
    `- სოციალური ქსელების ბმულები (Facebook / Instagram / სხვა);`,
    `- სხვა მასალები (ლოგო, ფერები, ბრენდბუქი — თუ აქვს);`,
    `- თუ არცერთი არ აქვს, სთხოვე მოკლე აღწერა: რას აკეთებენ, ბრენდის სტილი/ფერები რა სურთ.`,
    ``,
    `როცა საკმარისი ინფორმაცია გექნება ყველა (ან თითქმის ყველა) თემაზე და ასევე არსებულ მასალებზე: დაწერე მოკლე დამამთავრებელი წინადადება (მადლობა + რომ მალე გადასცემ შეთავაზებას), შემდეგ ახალ ხაზზე ზუსტად "<<COMPLETE>>", შემდეგ ახალ ხაზზე JSON ობიექტი. JSON-ში შედის: თითო კითხვის id→პასუხი, პლუს ეს გასაღებები — "current_website" (URL ან null), "social_links" (მასივი ან []), "brand_assets" (აღწერა ან null), "business_description" (მოკლე აღწერა). სხვა არაფერი JSON-ის შემდეგ.`,
  ]
    .filter(Boolean)
    .join("\n");
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
  // Cap to keep the bridge prompt bounded.
  if (JSON.stringify(messages).length > 60_000) {
    return NextResponse.json(
      { error: "conversation too long" },
      { status: 413 },
    );
  }

  const cfg = await getBotConfigBySlug(slug);
  if (!cfg) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (!bridgeConfigured()) {
    return NextResponse.json(
      { error: "chat bridge not configured" },
      { status: 503 },
    );
  }

  const system = buildSystem(
    cfg.client_name,
    cfg.intro,
    (cfg.questions as BotQuestion[]) ?? [],
  );

  let raw: string;
  try {
    raw = await callBridge({ system, messages });
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

  // Split off the completion signal if present.
  const marker = raw.indexOf("<<COMPLETE>>");
  if (marker === -1) {
    return NextResponse.json({ reply: raw.trim(), complete: false });
  }

  const reply = raw.slice(0, marker).trim();
  const after = raw.slice(marker + "<<COMPLETE>>".length);
  const js = after.slice(after.indexOf("{"), after.lastIndexOf("}") + 1);
  let answers: Record<string, unknown> = {};
  try {
    answers = JSON.parse(js);
  } catch {
    // If the JSON is malformed, treat as not-complete so the conversation
    // continues rather than submitting garbage.
    return NextResponse.json({ reply: reply || raw.trim(), complete: false });
  }
  return NextResponse.json({ reply, complete: true, answers });
}
