// Pure request guard — kept separate so it is unit-testable without a DB
// and so that route.ts only exports HTTP handlers (Next.js constraint).
import { hasContact } from "@/lib/offers/self-offer";

export const RL_WINDOW_MS = 3_600_000; // 1 hour
export const RL_MAX = 5;

export function selfOfferGuard(args: {
  response: { bot_slug: string } | null;
  slug: string;
  answers: Record<string, unknown>;
}): { ok: true } | { ok: false; status: number; body: object } {
  const { response, slug, answers } = args;
  if (!response || response.bot_slug !== slug) {
    return { ok: false, status: 404, body: { error: "not found" } };
  }
  if (!hasContact(answers)) {
    return { ok: false, status: 422, body: { needs_contact: true } };
  }
  return { ok: true };
}
