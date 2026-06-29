import { describe, it, expect } from "vitest";
import { buildIssueName } from "./plane";
import type { Verdict } from "./types";

const verdict = (s: number, d: Verdict["decision"]): Verdict => ({
  score: s,
  decision: d,
  confidence: 0.9,
  language: "en",
  strengths: [],
  gaps: [],
  rationale: "",
  emailSubject: "",
  emailBody: "",
});

describe("buildIssueName", () => {
  it("encodes name, role, score, decision", () => {
    expect(buildIssueName("Ana", "AI Intern", verdict(82, "meeting"))).toBe(
      "Ana — AI Intern — 82/100 — MEETING",
    );
  });
});
