import type { OfferDraft, OfferStage } from "./types";

// ---------------------------------------------------------------------------
// Pricing single-source-of-truth.
//
// An offer carries the same number in four places:
//   1. proposals.price (DB column)
//   2. offer.price (JSON)
//   3. Σ offer.scope_lines[].price
//   4. Σ offer.schedule[].amount
//
// Whenever sales edits scope lines (or authors a manual offer), these must NOT
// be allowed to diverge. The scope lines are the source of truth for the total:
//   offer.price := Σ scope_lines, and the schedule is rescaled to match.
//
// reconcileOfferPricing() takes whatever the client sent and returns an offer
// whose four representations all agree. Both the manual-create POST and the
// draft-edit PATCH funnel through it, so neither path can persist a divergent
// price.
// ---------------------------------------------------------------------------

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Rescale a schedule so its amounts sum exactly to `total`, preserving each
 * stage's proportion. If the schedule is empty or sums to 0, fall back to a
 * single "on signing" stage for the full amount. Rounding drift is absorbed by
 * the last stage so the sum is exact.
 */
function reconcileSchedule(
  schedule: OfferStage[] | undefined,
  total: number,
): OfferStage[] {
  const stages = Array.isArray(schedule)
    ? schedule.filter((s) => s && typeof s.label === "string" && s.label.trim())
    : [];
  const currentSum = stages.reduce((s, x) => s + (Number(x.amount) || 0), 0);

  if (stages.length === 0 || currentSum <= 0) {
    return [
      { label: "გადახდა", amount: total, when: "ხელშეკრულების გაფორმებისას" },
    ];
  }

  // Already exact — leave the sales-authored stages untouched.
  if (round2(currentSum) === round2(total)) {
    return stages.map((s) => ({ ...s, amount: round2(Number(s.amount) || 0) }));
  }

  // Rescale proportionally, then push any rounding remainder into the last stage.
  const scaled = stages.map((s) => ({
    ...s,
    amount: round2(((Number(s.amount) || 0) / currentSum) * total),
  }));
  const scaledSum = scaled.reduce((s, x) => s + x.amount, 0);
  const drift = round2(total - scaledSum);
  if (drift !== 0 && scaled.length > 0) {
    scaled[scaled.length - 1].amount = round2(
      scaled[scaled.length - 1].amount + drift,
    );
  }
  return scaled;
}

/**
 * Return a copy of `offer` whose price representations all agree:
 * offer.price = Σ scope_lines, schedule rescaled to that total. Add-ons are
 * priced separately and are NOT part of the headline total. The reconciled
 * total is also returned for the proposals.price column.
 */
export function reconcileOfferPricing(offer: OfferDraft): {
  offer: OfferDraft;
  price: number;
} {
  const scope_lines = (
    Array.isArray(offer.scope_lines) ? offer.scope_lines : []
  ).map((l) => ({
    label: typeof l.label === "string" ? l.label : "",
    description: typeof l.description === "string" ? l.description : "",
    price: round2(Number(l.price) || 0),
  }));

  const price = round2(scope_lines.reduce((s, l) => s + l.price, 0));
  const schedule = reconcileSchedule(offer.schedule, price);

  return {
    offer: { ...offer, scope_lines, price, schedule },
    price,
  };
}
