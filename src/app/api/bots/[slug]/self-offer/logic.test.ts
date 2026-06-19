// src/app/api/bots/[slug]/self-offer/logic.test.ts
import { describe, it, expect } from "vitest";
import { selfOfferGuard } from "./guard";

describe("selfOfferGuard", () => {
  it("404s when the response is missing", () => {
    const r = selfOfferGuard({
      response: null,
      slug: "allone-web",
      answers: {},
    });
    expect(r).toMatchObject({ ok: false, status: 404 });
  });
  it("404s when the response belongs to another bot", () => {
    const r = selfOfferGuard({
      response: { bot_slug: "other" },
      slug: "allone-web",
      answers: { contact_email: "a@b.com" },
    });
    expect(r).toMatchObject({ ok: false, status: 404 });
  });
  it("422 needs_contact when no email/phone", () => {
    const r = selfOfferGuard({
      response: { bot_slug: "allone-web" },
      slug: "allone-web",
      answers: { contact_name: "Lika" },
    });
    expect(r).toMatchObject({ ok: false, status: 422 });
    expect(
      (r as { body: { needs_contact?: boolean } }).body.needs_contact,
    ).toBe(true);
  });
  it("ok when slug matches and contact present", () => {
    const r = selfOfferGuard({
      response: { bot_slug: "allone-web" },
      slug: "allone-web",
      answers: { contact_phone: "+995" },
    });
    expect(r).toEqual({ ok: true });
  });
});
