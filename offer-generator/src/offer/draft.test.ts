import { describe, it, expect, vi, beforeEach } from "vitest";

const OFFER_JSON =
  '{"client_name":"Acme","summary":"ს","scope_lines":[{"label":"საიტი","description":"d","price":800}],"price":800,"currency":"GEL","schedule":[{"label":"წინასწარი","amount":800,"when":"ხელმოწერა"}],"monthly_opex":"100 ₾","timeline":"4 კვირა"}';

// draftOffer routes through the claude-bridge HTTP endpoint, so we mock fetch
// to return the bridge's {text} shape and set the bridge env vars.
beforeEach(() => {
  process.env.CLAUDE_BRIDGE_URL = "http://bridge.test";
  process.env.CLAUDE_BRIDGE_TOKEN = "test-token";
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ text: OFFER_JSON }),
    })),
  );
});

import { draftOffer } from "./draft.js";

describe("draftOffer", () => {
  it("parses the model JSON into an OfferDraft", async () => {
    const o = await draftOffer({ purpose: ["ვებსაიტი"] }, "Acme");
    expect(o.price).toBe(800);
    expect(o.scope_lines[0].label).toBe("საიტი");
  });

  it("scope_lines prices sum to total price", async () => {
    const o = await draftOffer({ purpose: ["ვებსაიტი"] }, "Acme");
    const sum = o.scope_lines.reduce((acc, l) => acc + l.price, 0);
    expect(sum).toBe(o.price);
  });
});
