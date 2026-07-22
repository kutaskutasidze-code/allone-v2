import { describe, it, expect } from "vitest";
import { sanitizeTranscript, countRealTurns, SEED_PREFIX } from "./repo";

describe("sanitizeTranscript", () => {
  it("keeps well-formed role/content pairs", () => {
    expect(
      sanitizeTranscript([
        { role: "user", content: "გამარჯობა" },
        { role: "assistant", content: "დღეს რით დაგეხმაროთ?" },
      ]),
    ).toEqual([
      { role: "user", content: "გამარჯობა" },
      { role: "assistant", content: "დღეს რით დაგეხმაროთ?" },
    ]);
  });

  it("drops malformed entries instead of throwing", () => {
    expect(
      sanitizeTranscript([
        { role: "user", content: "ok" },
        { role: 5, content: "bad role" },
        { role: "user" },
        null,
        "nope",
      ]),
    ).toEqual([{ role: "user", content: "ok" }]);
  });

  it("returns an empty transcript for non-array input", () => {
    expect(sanitizeTranscript(undefined)).toEqual([]);
    expect(sanitizeTranscript(null)).toEqual([]);
    expect(sanitizeTranscript({ role: "user" })).toEqual([]);
  });

  it("caps message length so one turn can't bloat the row", () => {
    const [msg] = sanitizeTranscript([
      { role: "user", content: "x".repeat(20_000) },
    ]);
    expect(msg!.content.length).toBe(8000);
  });

  it("caps the number of stored turns", () => {
    const many = Array.from({ length: 500 }, () => ({
      role: "user",
      content: "hi",
    }));
    expect(sanitizeTranscript(many).length).toBe(200);
  });
});

describe("countRealTurns", () => {
  it("counts visitor turns only", () => {
    expect(
      countRealTurns([
        { role: "user", content: "one" },
        { role: "assistant", content: "reply" },
        { role: "user", content: "two" },
      ]),
    ).toBe(2);
  });

  it("excludes the hidden opening seed", () => {
    expect(
      countRealTurns([
        { role: "user", content: `${SEED_PREFIX} გახსნა ჩატი)` },
        { role: "assistant", content: "მოგესალმებით" },
        { role: "user", content: "ჩვენ ვართ კლინიკა" },
      ]),
    ).toBe(1);
  });

  it("is zero for a conversation the visitor never spoke in", () => {
    expect(
      countRealTurns([
        { role: "user", content: `${SEED_PREFIX} გახსნა ჩატი)` },
        { role: "assistant", content: "მოგესალმებით" },
      ]),
    ).toBe(0);
  });
});
