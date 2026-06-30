import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => ({
  listIssuesInGroup: vi.fn(async () => [{ id: "iss1", name: "n", state: "s" }]),
  firstStateInGroup: vi.fn(async () => "done_state"),
  setIssueState: vi.fn(async () => undefined),
  addIssueComment: vi.fn(async () => undefined),
  sendCandidateEmail: vi.fn(async () => ({ sent: true, id: "e1" })),
  update: vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) })),
  inFn: vi.fn(async () => ({
    data: [
      {
        id: "a1",
        name: "Ana",
        email: "ana@example.com",
        vacancy_title: "AI Intern",
        plane_issue_id: "iss1",
        proposed_slots: [
          {
            startIso: "2026-07-02T07:00:00.000Z",
            endIso: "2026-07-02T07:30:00.000Z",
          },
        ],
        meeting_status: "proposed",
        ai_language: "en",
      },
    ],
  })),
}));
const { setIssueState, sendCandidateEmail, update } = h;
vi.mock("@/lib/recruiter/plane", () => ({
  listIssuesInGroup: h.listIssuesInGroup,
  firstStateInGroup: h.firstStateInGroup,
  setIssueState: h.setIssueState,
  addIssueComment: h.addIssueComment,
}));
vi.mock("@/lib/recruiter/notify", () => ({
  sendCandidateEmail: h.sendCandidateEmail,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({ update: h.update, select: () => ({ in: h.inFn }) }),
  }),
}));

import { GET } from "./route";

const req = (secret: string) =>
  new Request("http://x/api/recruiter/cron/poll-meetings", {
    method: "GET",
    headers: { authorization: `Bearer ${secret}` },
  }) as unknown as Parameters<typeof GET>[0];

beforeEach(() => {
  process.env.CRON_SECRET = "cron_s3cret";
  process.env.RECRUITER_SENDING_ENABLED = "true";
  vi.clearAllMocks();
});

describe("GET /api/recruiter/cron/poll-meetings", () => {
  it("401s on a bad secret", async () => {
    const res = await GET(req("nope"));
    expect(res.status).toBe(401);
  });

  it("books an approved candidate: emails invite + moves card to Done", async () => {
    const res = await GET(req("cron_s3cret"));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ booked: 1, ids: ["a1"] });
    expect(sendCandidateEmail).toHaveBeenCalledTimes(1);
    // attaches an .ics invite
    expect(sendCandidateEmail).toHaveBeenCalledWith(
      expect.objectContaining({ ics: expect.any(String) }),
    );
    expect(update).toHaveBeenCalled();
    expect(setIssueState).toHaveBeenCalledWith("iss1", "done_state");
  });
});
