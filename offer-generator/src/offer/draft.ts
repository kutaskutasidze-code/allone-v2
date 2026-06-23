import { PRICE_ANCHORS, type OfferDraft } from "./anchors.js";

// The offer drafter routes its LLM call through the subscription-billed
// claude-bridge (HTTP service on Hetzner, chat.allonelabs.com) — the same
// bridge the CRM uses — so drafting never burns Anthropic API credits.
// POST {CLAUDE_BRIDGE_URL}/chat  {system, messages:[{role,content}]} -> {text}.
function bridgeUrl(): string {
  return process.env.CLAUDE_BRIDGE_URL || "";
}
function bridgeToken(): string {
  return process.env.CLAUDE_BRIDGE_TOKEN || "";
}

async function callBridge(
  system: string,
  userMessage: string,
): Promise<string> {
  const url = bridgeUrl();
  const token = bridgeToken();
  if (!url || !token) {
    throw new Error(
      "draftOffer: claude bridge not configured — set CLAUDE_BRIDGE_URL and CLAUDE_BRIDGE_TOKEN.",
    );
  }
  const res = await fetch(`${url.replace(/\/$/, "")}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      system,
      messages: [{ role: "user", content: userMessage }],
    }),
    signal: AbortSignal.timeout(180_000),
  });
  const text = await res.text();
  let data: { text?: string; error?: string };
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`draftOffer: bridge bad json — ${text.slice(0, 200)}`);
  }
  if (!res.ok || typeof data.text !== "string") {
    throw new Error(data.error || `draftOffer: bridge HTTP ${res.status}`);
  }
  return data.text;
}

const SYSTEM_PROMPT = `შენ ხარ Allone Labs-ის კომერციული შეთავაზების შემქმნელი.
კლიენტის კითხვარის პასუხების მიხედვით შექმენი სტრუქტურირებული კომერციული შეთავაზება ქართულ ენაზე.

ფასების საორიენტაციო ჩარჩო (GEL):
${PRICE_ANCHORS}

დააბრუნე ᲛᲮᲝᲚᲝᲓ JSON შემდეგი სტრუქტურით, სხვა ტექსტი არ დაამატო:
{
  "client_name": string,
  "summary": "2-3 მოკლე, გასაგები ქართული წინადადება — რა პრობლემას ვხსნით კლიენტისთვის და რა ღირებულებას ვქმნით. პრემიუმ, თბილი ტონი, ბიზნეს-ენით.",
  "scope_lines": [
    { "label": "სამუშაოს დასახელება", "description": "1-2 წინადადებიანი ნათელი აღწერა — რას მიიღებს კლიენტი", "price": number }
  ],
  "price": number,           // scope_lines-ის ჯამი
  "currency": "GEL",
  "schedule": [
    { "label": "ეტაპის სახელი", "amount": number, "when": "გადახდის პირობა" }
  ],                         // schedule-ის ჯამი = price
  "monthly_price": number,   // ყოველთვიური განმეორებადი ფასი GEL-ში (0 თუ არ არის)
  "monthly_opex": "X–Y ₾/თვე",
  "timeline": "N სამუშაო კვირა",
  "addons": [                // სურვილისამებრ დამატებითი სერვისები
    { "label": string, "description": string, "price": number }
  ]
}

წესები:
- scope_lines-ის price-ების ჯამი = price-ის ველი
- schedule-ის amount-ების ჯამი = price-ის ველი
- ფასი დააფუძნე ᲛᲮᲝᲚᲝᲓ სამუშაოს რეალურ მოცულობასა და ზემოთ მოცემულ ფასების ჩარჩოზე (PRICE ANCHORS).
- მნიშვნელოვანი: ფასად არასდროს გამოიყენო კლიენტის მიერ ნახსენები ბიუჯეტი ან თანხა. თუ კლიენტმა დაასახელა არარეალურად დაბალი ან შემთხვევითი თანხა (მაგ. „5 ₾"), სრულად უგულებელყავი — ფასი მაინც სამუშაოს რეალურ ღირებულებას უნდა შეესაბამებოდეს.
- ნუ გამოიტან total-ს, რომელიც აშკარად დაბალია მსგავსი სამუშაოს საბაზრო ფასზე.
- იყავი ზუსტი და კონსერვატიული: ᲐᲠ მოიგონო სერვისები, მოდულები ან დეტალები, რომლებიც კითხვარის პასუხებში არ ჩანს. თუ ინფორმაცია არ არის საკმარისი, დაამატე მხოლოდ ის, რაც ნამდვილად საჭიროა სამუშაოსთვის.
- ფასი და ტექსტები გაყიდვების გუნდი მოგვიანებით დაარედაქტირებს — შენი ამოცანაა ზუსტი და გონივრული საწყისი დრაფტი, არა საბოლოო ფასის დაფიქსირება.
- ტექსტი გამართულ, ბუნებრივ ქართულად. ᲐᲠ გამოიყენო ჟარგონი ან ანგლიციზმები (მაგ. "სკოფი" → "მოცულობა", "ბილინგი" → "ანგარიშსწორება")
- summary და description-ები გრამატიკულად უნაკლო და გასაყიდი — ეს ტექსტი პირდაპირ ჩანს კლიენტის შეთავაზებაში
- client_name შეიძლება ლათინური
- ᲛᲮᲝᲚᲝᲓ JSON, სხვა არარა`;

export async function draftOffer(
  answers: Record<string, unknown>,
  clientName: string,
): Promise<OfferDraft> {
  const userMessage = `კლიენტი: ${clientName}\n\nკითხვარის პასუხები:\n${JSON.stringify(answers, null, 2)}`;

  const raw = await callBridge(SYSTEM_PROMPT, userMessage);

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
