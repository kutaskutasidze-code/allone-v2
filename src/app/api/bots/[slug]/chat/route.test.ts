import { describe, it, expect, vi } from "vitest";

// Mock server-only modules before importing the route
vi.mock("@/lib/claude-bridge", () => ({
  callBridge: vi.fn(),
  bridgeConfigured: vi.fn(() => false),
}));
vi.mock("@/lib/gemini", () => ({
  callGemini: vi.fn(),
  callGeminiStructured: vi.fn(),
  geminiConfigured: vi.fn(() => false),
}));
vi.mock("@/lib/bots/repo", () => ({
  getBotConfigBySlug: vi.fn(),
}));

import { selectSystemPrompts } from "./select-prompts";
import type { BotConfig } from "@/lib/bots/types";

const base: BotConfig = {
  id: "1",
  slug: "x",
  client_name: "ALLONE",
  title: "t",
  intro: null,
  language: "en",
  questions: [{ id: "needs", text: "?", type: "text" }],
  lead_id: null,
  active: true,
  created_at: "2026-06-20",
  knowledge: null,
};

describe("selectSystemPrompts", () => {
  it("uses the Georgian intake prompt when knowledge is absent", () => {
    const { conversation } = selectSystemPrompts({ ...base, knowledge: null });
    expect(conversation).toContain("ინტეიქ-აგენტი");
  });
  it("uses the website prompt when knowledge is present", () => {
    const { conversation } = selectSystemPrompts({
      ...base,
      knowledge: "FAQ_X",
    });
    expect(conversation).toContain("FAQ_X");
    expect(conversation.toLowerCase()).toContain("contact");
  });
});
