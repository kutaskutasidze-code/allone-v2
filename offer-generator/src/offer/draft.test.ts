import { describe, it, expect, vi } from "vitest";

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = {
      create: async () => ({
        content: [
          {
            type: "text",
            text: '{"client_name":"Acme","summary":"ს","scope_lines":[{"label":"საიტი","description":"d","price":800}],"price":800,"currency":"GEL","schedule":[{"label":"წინასწარი","amount":800,"when":"ხელმოწერა"}],"monthly_opex":"100 ₾","timeline":"4 კვირა"}',
          },
        ],
      }),
    };
  },
}));

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
