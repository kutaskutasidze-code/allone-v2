import { describe, it, expect } from "vitest";
import type { BotConfig } from "./types";

describe("BotConfig", () => {
  it("allows an optional knowledge field", () => {
    const cfg: BotConfig = {
      id: "x",
      slug: "allone-web",
      client_name: "ALLONE",
      title: "t",
      intro: null,
      language: "en",
      questions: [],
      lead_id: null,
      active: true,
      created_at: "2026-06-20",
      knowledge: "FAQ text",
    };
    expect(cfg.knowledge).toBe("FAQ text");
  });
});
