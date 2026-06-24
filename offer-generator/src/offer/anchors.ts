export interface OfferScopeLine {
  label: string;
  description: string;
  price: number;
}

export interface OfferStage {
  label: string;
  amount: number;
  when: string;
}

export interface OfferDraft {
  client_name: string;
  headline?: string; // hero accent phrase (e.g. "მარკეტინგის ავტომატიზაცია"); defaults to "ციფრული გარდაქმნა"
  summary: string; // 2-4 Georgian sentences
  scope_lines: OfferScopeLine[];
  price: number; // one-time total GEL
  currency: "GEL";
  schedule: OfferStage[]; // payment stages summing to price
  monthly_price?: number; // structured recurring GEL/month (display now, bill later)
  monthly_opex: string; // legacy free-text e.g. "100–200 ₾/თვე" (fallback)
  timeline: string; // e.g. "4 სამუშაო კვირა"
  addons?: OfferScopeLine[]; // optional suggested extras
}

// Real anchors from past offers (GEL). Passed into the drafter prompt so the
// suggested price is grounded, not invented.
export const PRICE_ANCHORS = `
Web build: simple 5-page static ~500; full e-commerce rebuild ~800; full modernization+AI+workflow ~2000 (4x500 monthly).
Modular: full website 800; AI layer (chatbot + pgvector personalization + admin-agent) 400; catalog migration (~775 products) 300.
Add-ons: Stripe 300-400; Instagram Shop 250-400; Meta Pixel+Conversion API 200-300; blog (CMS+10 articles) 600-800; photo reshoot 800-1200.
Recurring: support 100-200/mo; infra opex ~7-200/mo.
Payment: advance/middle/final (e.g. 200/800/500) or equal monthly stages. Timeline ~4 working weeks for a full build.
`.trim();

// Distilled from Allone Labs' best real offers (Tama AL-2026-028 — the
// gold-standard structure). NOT to be copied verbatim — it shows the TONE and
// SHAPE the drafted texts should match: specific, audit-grounded, premium, and
// free of fabrication. Passed into the drafter so output reads like our real
// work, not a generic template.
export const STYLE_EXEMPLAR = `
SUMMARY — example tone (TAMA, real offer):
"TAMA-მ მოახერხა იშვიათი რამ ქართულ ბაზარზე: ფესვებიდან ამოზრდილი ცნობადობა + სიცხადე ვიზუალურ ენაში. თუმცა, თქვენი ციფრული აქტივი დღეს ბრენდს უკან ჩამორჩება — ის დგას ტექნოლოგიაზე, რომელმაც სიცოცხლის ბოლოს 2022-ში მიაღწია, და ფარულად კარგავს ტრაფიკს. ჩვენი წინადადება — სრულად ახალი საიტი თანამედროვე სტეკზე, რომელიც ინარჩუნებს ბრენდს, მაგრამ ცვლის ფუნდამენტს."
→ ჯერ აღიარე რას აკეთებს კლიენტი კარგად (კონკრეტულად), მერე დაასახელე ნამდვილი ხარვეზი, ბოლოს — გადაწყვეტა. პატივისცემით, არა მაამებლურად.

SCOPE LINE descriptions — example style (real):
- "სრული რეპლატფორმინგი Next.js 15 + Node 20-ზე — ვცვლით ფუნდამენტს (PHP 7.4 → თანამედროვე სტეკი), ვინარჩუნებთ ბრენდის ვიზუალურ ენას."
- "AI ფენა: მომხმარებლის ჩატბოტი + სმარტ პერსონალიზაცია + ბუნებრივი ადმინ-აგენტი ქართულად."
→ თითო ხაზი = კონკრეტული შედეგი + რას იღებს კლიენტი. არა ბუნდოვანი ფრაზები („მოდერნიზაცია").

WHAT TO AVOID: ზოგადი დაპირებები რიცხვების/სპეციფიკის გარეშე; ფუნქციები, რომლებიც პასუხებში არ ჩანს; ანგლიციზმები.
`.trim();
