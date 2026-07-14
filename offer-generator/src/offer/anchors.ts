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

// Rate card (GEL) grounded in Allone Labs' real sold prices — proposals land in
// the ~800–2,500 range and typical full projects sell around 1,500+, so these
// anchors are set to keep drafts realistic rather than lowballing. Passed into
// the drafter prompt so the suggested price is grounded, not invented.
export const PRICE_ANCHORS = `
Web build (one-time, GEL): simple 5-page site ~2400; full e-commerce rebuild ~4000; full modernization + AI + workflow ~8000.
Modular components: full website 2400; AI layer (chatbot + pgvector personalization + admin-agent) 3000; catalog migration (~775 products) 1600.
Add-ons: Stripe / payments 1200-1600; Instagram Shop 1000-1600; Meta Pixel + Conversion API 800-1200; blog (CMS + 10 articles) 2000-3000; photo reshoot 1600-3000.
Recurring: support 100-200/mo; infra opex ~7-200/mo.
FLOOR: never quote a full project below 1500 GEL, no matter how small the scope looks. These are premium builds — price them like real work, not the cheapest plausible number.
Payment: advance / middle / final (proportional) or equal monthly stages. Timeline ~4 working weeks for a full build.
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
