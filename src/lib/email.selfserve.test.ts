import { describe, it, expect } from "vitest";
import { sendSelfServeOfferNotice } from "./email";

describe("sendSelfServeOfferNotice", () => {
  it("resolves without throwing when RESEND_API_KEY is unset", async () => {
    const prev = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;
    await expect(
      sendSelfServeOfferNotice({
        clientName: "Acme",
        contactName: "Lika",
        contactEmail: "a@b.com",
        contactPhone: null,
        docNumber: "AL-2026-031",
        price: 1500,
        offerUrl: "https://app.allonelabs.com/b/allone-web/c/r1",
      }),
    ).resolves.toBeUndefined();
    if (prev) process.env.RESEND_API_KEY = prev;
  });
});
