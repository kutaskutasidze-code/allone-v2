import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/bots/repo", async (importActual) => {
  const actual = await importActual<typeof import("@/lib/bots/repo")>();
  return {
    getBotConfigBySlug: vi.fn(async (slug: string) =>
      slug === "live"
        ? { slug, lead_id: null, client_name: "Acme", active: true }
        : null,
    ),
    buildResponseRow: actual.buildResponseRow,
    insertResponse: vi.fn(async () => {}),
  };
});

import { POST } from "./route";

function req(body: unknown) {
  return new Request("http://x/api/bots/live/submit", {
    method: "POST",
    headers: { "content-type": "application/json", "user-agent": "UA" },
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest;
}

describe("POST submit", () => {
  it("400 when answers missing", async () => {
    const res = await POST(req({}), {
      params: Promise.resolve({ slug: "live" }),
    });
    expect(res.status).toBe(400);
  });
  it("404 for unknown bot", async () => {
    const res = await POST(req({ answers: { a: 1 } }), {
      params: Promise.resolve({ slug: "nope" }),
    });
    expect(res.status).toBe(404);
  });
  it("200 ok on valid submit", async () => {
    const res = await POST(req({ answers: { respondent: "ქ" } }), {
      params: Promise.resolve({ slug: "live" }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});
