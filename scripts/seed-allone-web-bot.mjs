// scripts/seed-allone-web-bot.mjs
// Upsert the public website bot. Run: node scripts/seed-allone-web-bot.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

// Load .env.local without extra deps
for (const line of readFileSync(
  new URL("../.env.local", import.meta.url),
  "utf8",
).split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]])
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("missing Supabase env");
const db = createClient(url, key);

const KNOWLEDGE = `
ALLONE (Allone Labs, Tbilisi) builds AI-powered business systems: websites,
chatbots, sales/CRM automation, and workflow automation. We design, build, and
deploy — typical web projects start around a few hundred GEL and scale with
scope; we add AI layers, migrations, and integrations as needed. Process:
discovery → proposal → build → launch. We work in Georgian and English.
We do not quote a final price in chat — every visitor gets a tailored offer
generated at the end of this conversation.
`.trim();

const QUESTIONS = [
  {
    id: "needs",
    text: "What do you need (website, chatbot, automation, other)?",
    type: "text",
  },
  { id: "features", text: "Which features matter most to you?", type: "text" },
  {
    id: "budget",
    text: "What budget and timeline are you working with?",
    type: "text",
  },
  {
    id: "assets",
    text: "Do you have an existing website, socials, or branding?",
    type: "text",
  },
  {
    id: "contact",
    text: "What's your name and the best email or phone to reach you?",
    type: "text",
  },
];

const row = {
  slug: "allone-web",
  client_name: "ALLONE",
  title: "ALLONE — website assistant",
  intro:
    "Hi! I'm ALLONE's assistant. Ask me anything about what we build, or tell me about your project and I'll prepare an offer for you right here.",
  language: "en",
  questions: QUESTIONS,
  knowledge: KNOWLEDGE,
  lead_id: null,
  active: true,
};

const { error } = await db
  .from("bot_configs")
  .upsert(row, { onConflict: "slug" });
if (error) throw error;
console.log("seeded bot_configs slug=allone-web");
