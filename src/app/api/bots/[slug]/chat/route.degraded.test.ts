import { describe, it, expect, vi, beforeEach } from "vitest";

// The invariant under test: once the bot has said goodbye to the visitor, the
// route must never report "not done". If it did, the client skips /submit and
// the whole intake is lost while the visitor believes we have their brief.
// That is what happened to the Longevity Institute client during a Gemini
// quota window.

const callGeminiStructured = vi.fn();
const callBridge = vi.fn();
const callGemini = vi.fn();

vi.mock("@/lib/bots/repo", async (importActual) => {
  const actual = await importActual<typeof import("@/lib/bots/repo")>();
  return {
    ...actual,
    getBotConfigBySlug: vi.fn(async (slug: string) =>
      slug === "live"
        ? {
            slug,
            lead_id: null,
            client_name: "Longevity Institute",
            intro: null,
            knowledge: null,
            questions: [{ id: "services", text: "?", type: "text" }],
            active: true,
          }
        : null,
    ),
    saveSession: vi.fn(async () => "s1"),
  };
});

vi.mock("@/lib/gemini", () => ({
  geminiConfigured: () => true,
  callGemini: (...a: unknown[]) => callGemini(...a),
  callGeminiStructured: (...a: unknown[]) => callGeminiStructured(...a),
}));

vi.mock("@/lib/claude-bridge", () => ({
  bridgeConfigured: () => true,
  callBridge: (...a: unknown[]) => callBridge(...a),
}));

import { POST } from "./route";
import { COMPLETE_MARKER } from "./select-prompts";

function req(body: unknown) {
  return new Request("http://x/api/bots/live/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest;
}

const finishedConversation = {
  messages: [
    { role: "user", content: "(ვიზიტორმა გახსნა ჩატი)" },
    { role: "assistant", content: "მოგესალმებით" },
    { role: "user", content: "ჩვენ ვართ კლინიკა" },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  // The model finished the conversation and emitted the closing + marker.
  callGemini.mockResolvedValue(
    `მადლობა, მალე დაგიკავშირდებით.\n${COMPLETE_MARKER}`,
  );
});

describe("chat completion when extraction breaks", () => {
  it("falls back to the bridge when Gemini extraction fails", async () => {
    callGeminiStructured.mockRejectedValue(new Error("gemini HTTP 429: quota"));
    callBridge.mockResolvedValue('{"services":"ბიომარკერული სკრინინგი"}');

    const res = await POST(req(finishedConversation), {
      params: Promise.resolve({ slug: "live" }),
    });
    const data = await res.json();

    expect(callBridge).toHaveBeenCalled();
    expect(data.complete).toBe(true);
    expect(data.answers).toEqual({ services: "ბიომარკერული სკრინინგი" });
  });

  it("still completes (so the response is saved) when BOTH providers fail", async () => {
    callGeminiStructured.mockRejectedValue(new Error("gemini HTTP 429: quota"));
    callBridge.mockRejectedValue(new Error("bridge down"));

    const res = await POST(req(finishedConversation), {
      params: Promise.resolve({ slug: "live" }),
    });
    const data = await res.json();

    // The visitor was thanked, so we must complete — otherwise the client
    // never calls /submit and the intake disappears.
    expect(data.complete).toBe(true);
    expect(data.degraded).toBe(true);
    expect(data.answers).toEqual({});
    expect(data.reply).toContain("მადლობა");
  });

  it("keeps chatting normally when the model has not finished", async () => {
    callGemini.mockResolvedValue("კიდევ ერთი კითხვა: რა სერვისები გაქვთ?");

    const res = await POST(req(finishedConversation), {
      params: Promise.resolve({ slug: "live" }),
    });
    const data = await res.json();

    expect(data.complete).toBe(false);
    expect(callGeminiStructured).not.toHaveBeenCalled();
  });
});
