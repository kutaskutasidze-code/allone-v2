import { describe, it, expect } from "vitest";
import { reconcileOfferPricing } from "./pricing";
import type { OfferDraft } from "./types";

function baseOffer(over: Partial<OfferDraft> = {}): OfferDraft {
  return {
    client_name: "Test Co",
    summary: "s",
    scope_lines: [
      { label: "Web", description: "", price: 800 },
      { label: "AI", description: "", price: 300 },
    ],
    price: 0, // deliberately wrong — reconcile must fix it
    currency: "GEL",
    schedule: [],
    monthly_opex: "",
    timeline: "",
    ...over,
  };
}

describe("reconcileOfferPricing", () => {
  it("derives price from the sum of scope lines (ignores incoming price)", () => {
    const { offer, price } = reconcileOfferPricing(baseOffer({ price: 5 }));
    expect(price).toBe(1100);
    expect(offer.price).toBe(1100);
  });

  it("creates a single full-amount schedule stage when none provided", () => {
    const { offer } = reconcileOfferPricing(baseOffer());
    expect(offer.schedule).toHaveLength(1);
    expect(offer.schedule[0].amount).toBe(1100);
  });

  it("leaves a schedule that already sums to the total untouched", () => {
    const { offer } = reconcileOfferPricing(
      baseOffer({
        schedule: [
          { label: "ავანსი", amount: 600, when: "x" },
          { label: "დასრულება", amount: 500, when: "y" },
        ],
      }),
    );
    expect(offer.schedule.map((s) => s.amount)).toEqual([600, 500]);
  });

  it("rescales a divergent schedule to match the total, exactly", () => {
    const { offer } = reconcileOfferPricing(
      baseOffer({
        // sums to 200, must rescale to 1100 keeping the 50/50 split
        schedule: [
          { label: "a", amount: 100, when: "" },
          { label: "b", amount: 100, when: "" },
        ],
      }),
    );
    const sum = offer.schedule.reduce((s, x) => s + x.amount, 0);
    expect(sum).toBe(1100);
    expect(offer.schedule[0].amount).toBe(550);
    expect(offer.schedule[1].amount).toBe(550);
  });

  it("absorbs rounding drift into the last stage so the sum is exact", () => {
    const { offer, price } = reconcileOfferPricing(
      baseOffer({
        scope_lines: [{ label: "x", description: "", price: 1000 }],
        // 1/3 + 1/3 + 1/3 of 1000 → rounding drift
        schedule: [
          { label: "a", amount: 1, when: "" },
          { label: "b", amount: 1, when: "" },
          { label: "c", amount: 1, when: "" },
        ],
      }),
    );
    const sum = offer.schedule.reduce((s, x) => s + x.amount, 0);
    expect(sum).toBe(price);
    expect(price).toBe(1000);
  });

  it("does not count add-ons in the headline total", () => {
    const { price } = reconcileOfferPricing(
      baseOffer({
        addons: [{ label: "extra", description: "", price: 9999 }],
      }),
    );
    expect(price).toBe(1100);
  });
});
