// src/app/api/recruiter/ingest/web/route.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { evaluateCandidate } from "@/lib/recruiter/evaluate";

vi.mock("@/lib/recruiter/evaluate", () => ({
  evaluateCandidate: vi.fn(async () => ({
    score: 75,
    decision: "meeting",
    confidence: 0.9,
    language: "en",
    strengths: ["a"],
    gaps: [],
    rationale: "r",
    emailSubject: "s",
    emailBody: "b",
  })),
}));
vi.mock("@/lib/recruiter/plane", () => ({
  createCandidateIssue: vi.fn(async () => ({ id: "issue_1" })),
}));
vi.mock("@/lib/recruiter/cv", () => ({
  extractCvText: vi.fn(async () => "cv text"),
  UnsupportedCvError: class extends Error {},
}));
vi.mock("@/lib/recruiter/vacancies", () => ({
  getOpenVacancies: vi.fn(async () => [
    {
      id: "v1",
      slug: "x",
      title: "T",
      department: null,
      description_md: "jd",
      is_open: true,
    },
  ]),
  matchVacancy: vi.fn(() => ({
    id: "v1",
    slug: "x",
    title: "T",
    department: null,
    description_md: "jd",
    is_open: true,
  })),
}));
// Minimal supabase admin mock: a row not yet ranked, signed-url + update succeed.
const update = vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({ update }),
    storage: {
      from: () => ({
        createSignedUrl: async () => ({
          data: { signedUrl: "https://x/cv" },
          error: null,
        }),
        download: async () => ({
          data: { arrayBuffer: async () => Buffer.from("pdf") },
          error: null,
        }),
      }),
    },
  }),
}));

import { POST } from "./route";

const req = (body: unknown, secret = "s3cret") =>
  new Request("http://x/api/recruiter/ingest/web", {
    method: "POST",
    headers: { "x-webhook-secret": secret, "content-type": "application/json" },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  process.env.RECRUITER_WEBHOOK_SECRET = "s3cret";
});

describe("POST /api/recruiter/ingest/web", () => {
  it("401s on a bad secret", async () => {
    const res = await POST(req({ record: {} }, "wrong"));
    expect(res.status).toBe(401);
  });
  it("skips an already-ranked application", async () => {
    const res = await POST(
      req({
        record: {
          id: "a1",
          name: "N",
          email: "e",
          cv_path: "x/cv.pdf",
          vacancy_id: "v1",
          ai_ranked_at: "2026-01-01",
        },
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ skipped: true });
  });
  it("ranks a fresh application and creates a Plane issue", async () => {
    const res = await POST(
      req({
        record: {
          id: "a2",
          name: "N",
          email: "e",
          cv_path: "x/cv.pdf",
          vacancy_id: "v1",
        },
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      ranked: true,
      decision: "meeting",
    });
    expect(update).toHaveBeenCalled();
  });

  it("holds an application with low confidence (0.3) without throwing", async () => {
    vi.mocked(evaluateCandidate).mockResolvedValueOnce({
      score: 40,
      decision: "reject",
      confidence: 0.3,
      language: "en",
      strengths: [],
      gaps: ["x"],
      rationale: "low confidence",
      emailSubject: "s",
      emailBody: "b",
    });
    const res = await POST(
      req({
        record: {
          id: "a3",
          name: "N",
          email: "e@test.com",
          cv_path: "x/cv.pdf",
          vacancy_id: "v1",
        },
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ held: true });
  });
});
