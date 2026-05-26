import { describe, it, expect } from "vitest";
import { sanitizeProjectName } from "./index.js";

describe("sanitizeProjectName", () => {
  it("lowercases", () => {
    expect(sanitizeProjectName("Acme-Co")).toBe("acme-co");
  });

  it("replaces invalid chars with dashes", () => {
    expect(sanitizeProjectName("acme co!")).toBe("acme-co");
  });

  it("collapses consecutive dashes", () => {
    expect(sanitizeProjectName("a---b")).toBe("a-b");
  });

  it("trims leading and trailing dashes", () => {
    expect(sanitizeProjectName("-acme-")).toBe("acme");
  });

  it("clamps to 100 chars", () => {
    const long = "a".repeat(150);
    expect(sanitizeProjectName(long).length).toBe(100);
  });

  it("falls back to demo-<timestamp> on all-invalid input", () => {
    const out = sanitizeProjectName("!!!");
    expect(out).toMatch(/^demo-\d+$/);
  });

  it("preserves valid alphanumeric + dashes intact", () => {
    expect(sanitizeProjectName("demo-7a1b-2c")).toBe("demo-7a1b-2c");
  });
});
