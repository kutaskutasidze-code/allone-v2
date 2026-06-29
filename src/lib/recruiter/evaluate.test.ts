import { describe, it, expect } from "vitest";
import { VerdictSchema } from "./evaluate";

describe("VerdictSchema", () => {
  it("accepts a well-formed verdict", () => {
    const ok = VerdictSchema.safeParse({
      score: 80,
      decision: "meeting",
      confidence: 0.9,
      language: "en",
      strengths: ["x"],
      gaps: [],
      rationale: "good",
      emailSubject: "s",
      emailBody: "b",
    });
    expect(ok.success).toBe(true);
  });
  it("rejects an out-of-range score", () => {
    const bad = VerdictSchema.safeParse({
      score: 200,
      decision: "meeting",
      confidence: 0.9,
      language: "en",
      strengths: [],
      gaps: [],
      rationale: "r",
      emailSubject: "s",
      emailBody: "b",
    });
    expect(bad.success).toBe(false);
  });
});
