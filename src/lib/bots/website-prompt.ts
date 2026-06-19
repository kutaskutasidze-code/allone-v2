import type { BotQuestion } from "./types";

export const WEBSITE_COMPLETE_MARKER = "<<COMPLETE>>";

/**
 * Conversation system prompt for the public website bot. Unlike the Georgian
 * intake bot, this one (a) answers FAQ from `knowledge` first, (b) mirrors the
 * visitor's language defaulting to English, and (c) MUST capture contact details
 * before emitting the completion marker.
 */
export function buildWebsiteConversationSystem(
  clientName: string,
  intro: string | null,
  knowledge: string,
  questions: BotQuestion[],
): string {
  const optional = questions
    .map((q, i) => {
      const opts = q.options?.length ? ` (e.g.: ${q.options.join(" / ")})` : "";
      return `${i + 1}. ${q.text}${opts}`;
    })
    .join("\n");
  return [
    `You are the website assistant for ${clientName} (an AI/automation studio).`,
    intro ? `Context: ${intro}` : "",
    ``,
    `LANGUAGE: Reply in the visitor's language. Default to English; if the visitor`,
    `writes in Georgian, switch to clean Georgian (mxedruli). Mirror them per message.`,
    ``,
    `KNOWLEDGE — use this to answer questions about the company, services and process:`,
    knowledge,
    ``,
    `HOW TO BEHAVE:`,
    `- Greet once, in your first message only.`,
    `- Answer the visitor's questions helpfully and briefly using the knowledge above.`,
    `- One short question at a time — never a bulleted list of questions.`,
    `- When the visitor shows buying intent (wants a quote, a website, a bot, pricing,`,
    `  to start a project), smoothly move into intake and gather the core topics below.`,
    `- Do NOT name prices — the offer is generated for them at the end.`,
    ``,
    `CORE INTAKE TOPICS (gather naturally before completing):`,
    `- what they do and what they need (product/segment);`,
    `- the main functionality they want;`,
    `- budget and desired timeline;`,
    `- existing materials: website / social links / branding (logo, colors).`,
    ``,
    `CONTACT (MANDATORY — required before you finish):`,
    `- the visitor's name, and at least one of: email or phone number.`,
    `- If you are about to wrap up but have no contact email or phone yet, ASK for it`,
    `  first. Never emit the completion marker without a contact email or phone.`,
    ``,
    `OPTIONAL TOPICS (only if they fit naturally):`,
    optional,
    ``,
    `WRAP UP: once the core topics AND contact are captured, write one short closing`,
    `sentence (thank them; say their offer will appear here shortly), then on a NEW line`,
    `exactly "${WEBSITE_COMPLETE_MARKER}". Add nothing after the marker — no JSON.`,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Strict extractor: only what the visitor actually said; null otherwise. */
export function buildWebsiteExtractionSystem(questions: BotQuestion[]): string {
  const list = questions
    .map((q) => {
      const opts = q.options?.length
        ? ` — options (hint only): ${q.options.join(" / ")}`
        : "";
      return `[${q.id}] ${q.text}${opts}`;
    })
    .join("\n");
  return [
    `You are a data extractor. Below is an intake conversation between a visitor and`,
    `an assistant. Extract ONLY what the visitor actually said.`,
    ``,
    `Strict rules:`,
    `- If a topic was not discussed or not answered, return null (empty array [] for`,
    `  social_links).`,
    `- Never invent, never default, never snap to the nearest option.`,
    `- Keep the visitor's real, specific answer in their own words.`,
    `- Extract contact_name, contact_email, contact_phone if stated; null otherwise.`,
    ``,
    `Questions:`,
    list,
  ].join("\n");
}

/** Gemini responseSchema: each question id → nullable string + assets + contact. */
export function buildWebsiteAnswersSchema(questions: BotQuestion[]): object {
  const properties: Record<string, object> = {};
  for (const q of questions) {
    properties[q.id] = { type: "STRING", nullable: true };
  }
  properties.current_website = { type: "STRING", nullable: true };
  properties.social_links = { type: "ARRAY", items: { type: "STRING" } };
  properties.brand_assets = { type: "STRING", nullable: true };
  properties.business_description = { type: "STRING", nullable: true };
  properties.contact_name = { type: "STRING", nullable: true };
  properties.contact_email = { type: "STRING", nullable: true };
  properties.contact_phone = { type: "STRING", nullable: true };
  return { type: "OBJECT", properties };
}
