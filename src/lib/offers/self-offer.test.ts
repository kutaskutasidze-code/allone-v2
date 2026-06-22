import { describe, it, expect } from "vitest";
import { extractContact, hasContact, offerThreadUrl } from "./self-offer";

describe("self-offer helpers", () => {
  it("extracts contact fields", () => {
    expect(
      extractContact({ contact_name: "Lika", contact_email: "a@b.com" }),
    ).toEqual({ name: "Lika", email: "a@b.com", phone: null });
  });
  it("hasContact requires email or phone", () => {
    expect(hasContact({ contact_name: "Lika" })).toBe(false);
    expect(hasContact({ contact_email: "a@b.com" })).toBe(true);
    expect(hasContact({ contact_phone: "+995..." })).toBe(true);
    expect(hasContact({ contact_email: "" })).toBe(false);
  });
  it("builds the thread url", () => {
    expect(offerThreadUrl("allone-web", "rid-1")).toBe(
      "https://app.allonelabs.com/b/allone-web/c/rid-1",
    );
  });
});
