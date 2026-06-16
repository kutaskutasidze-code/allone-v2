import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config.js";
import { PRICE_ANCHORS, type OfferDraft } from "./anchors.js";

const MODEL = "claude-opus-4-8";

const SYSTEM_PROMPT = `შენ ხარ Allone Labs-ის კომერციული შეთავაზების შემქმნელი.
კლიენტის კითხვარის პასუხების მიხედვით შექმენი სტრუქტურირებული კომერციული შეთავაზება ქართულ ენაზე.

ფასების საორიენტაციო ჩარჩო (GEL):
${PRICE_ANCHORS}

დააბრუნე ᲛᲮᲝᲚᲝᲓ JSON შემდეგი სტრუქტურით, სხვა ტექსტი არ დაამატო:
{
  "client_name": string,
  "summary": "2-4 ქართული წინადადება — რა პრობლემას ვხსნით და რა ღირებულებას ვთავაზობთ",
  "scope_lines": [
    { "label": "სამუშაოს დასახელება", "description": "დეტალური აღწერა", "price": number }
  ],
  "price": number,           // scope_lines-ის ჯამი
  "currency": "GEL",
  "schedule": [
    { "label": "ეტაპის სახელი", "amount": number, "when": "გადახდის პირობა" }
  ],                         // schedule-ის ჯამი = price
  "monthly_opex": "X–Y ₾/თვე",
  "timeline": "N სამუშაო კვირა",
  "addons": [                // სურვილისამებრ დამატებითი სერვისები
    { "label": string, "description": string, "price": number }
  ]
}

წესები:
- scope_lines-ის price-ების ჯამი = price-ის ველი
- schedule-ის amount-ების ჯამი = price-ის ველი
- ფასები საორიენტაციო ჩარჩოს ფარგლებში, კლიენტის სირთულეზე მორგებული
- ტექსტი ქართულად (client_name შეიძლება ლათინური)
- ᲛᲮᲝᲚᲝᲓ JSON, სხვა არარა`;

export async function draftOffer(
  answers: Record<string, unknown>,
  clientName: string,
): Promise<OfferDraft> {
  const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });

  const userMessage = `კლიენტი: ${clientName}\n\nკითხვარის პასუხები:\n${JSON.stringify(answers, null, 2)}`;

  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlock = msg.content.find((c) => c.type === "text");
  if (!textBlock || !("text" in textBlock)) {
    throw new Error("draftOffer: no text block in Anthropic response");
  }

  const raw = textBlock.text;

  // Extract first { ... last } to handle any accidental preamble/postamble
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(
      `draftOffer: could not locate JSON object in response: ${raw.slice(0, 200)}`,
    );
  }

  const jsonStr = raw.slice(start, end + 1);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (err) {
    throw new Error(
      `draftOffer: JSON.parse failed — ${err instanceof Error ? err.message : String(err)}. Raw: ${jsonStr.slice(0, 300)}`,
    );
  }

  // Light runtime validation — trust the model but catch obvious gaps
  const draft = parsed as OfferDraft;
  if (!draft.scope_lines || !Array.isArray(draft.scope_lines)) {
    throw new Error("draftOffer: missing scope_lines in parsed offer");
  }
  if (typeof draft.price !== "number") {
    throw new Error("draftOffer: missing price in parsed offer");
  }

  return draft;
}
