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
