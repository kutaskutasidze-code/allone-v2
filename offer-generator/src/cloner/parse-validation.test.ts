import { describe, it, expect } from "vitest";
import { parseValidationSummary } from "./index.js";

describe("parseValidationSummary", () => {
  it("parses canonical output line", () => {
    const out = parseValidationSummary(
      "MATCH: 47 SIMILAR: 3 DIFFER: 2 STATUS_4xx: 0 ERROR: 0 — total 52",
    );
    expect(out.total).toBe(52);
    expect(out.matched).toBe(50); // matched + similar
    expect(out.matchRate).toBeCloseTo(50 / 52);
  });

  it("handles alternative separators", () => {
    const out = parseValidationSummary("MATCH=10 SIMILAR=0 total 10");
    expect(out.total).toBe(10);
    expect(out.matched).toBe(10);
    expect(out.matchRate).toBe(1);
  });

  it("returns zero rate when no total found", () => {
    const out = parseValidationSummary("garbage output with no totals");
    expect(out.total).toBe(0);
    expect(out.matched).toBe(0);
    expect(out.matchRate).toBe(0);
  });

  it("extracts numbers even when surrounded by other text", () => {
    const out = parseValidationSummary(
      "Result:\nMATCH: 100\n  SIMILAR: 5\n  DIFFER: 1\n  total 106\n",
    );
    expect(out.total).toBe(106);
    expect(out.matched).toBe(105);
  });
});
