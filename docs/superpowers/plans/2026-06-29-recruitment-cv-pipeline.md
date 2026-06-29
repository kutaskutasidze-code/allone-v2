# Recruitment CV Pipeline — Implementation Plan (Increment 1: rank → Plane → CRM mirror, dry-run)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a web/CRM job application arrives, automatically extract the CV, rank it against the open role's JD with Claude, decide meeting/reject, write the result back into the CRM `job_applications` row, and create a Plane card — **with no candidate emails sent** (dry-run burn-in).

**Architecture:** Built inside the `allone-website` CRM (Next.js App Router). A Supabase Database Webhook on `job_applications` INSERT calls a route handler that runs a deterministic pipeline: normalize → extract CV text → match vacancy → agentic Claude evaluation (structured output) → write `ai_*` columns → create a Plane card. Idempotent; gated by `SENDING_ENABLED` (this increment never sends regardless).

**Tech Stack:** TypeScript, Next.js 16 App Router, `@anthropic-ai/sdk` (`messages.parse` + Zod), `@supabase/supabase-js` (service role), `pdf-parse`, `mammoth`, self-hosted Plane REST API. Tests: Vitest (repo already runs `*.test.ts`, e.g. `src/lib/email.selfserve.test.ts`).

## Global Constraints

- Language: TypeScript only. App Router route handlers under `src/app/api/...`.
- Claude model: `claude-opus-4-8` (mandated default). Cost-down alternative `claude-sonnet-4-6` is allowed only if the user explicitly chooses it — do not downgrade silently.
- Claude calls use the official `@anthropic-ai/sdk` with `client.messages.parse({ output_config: { format: zodOutputFormat(SCHEMA) } })`. Do NOT hand-roll HTTP or use OpenAI shims. `max_tokens: 16000`. `thinking: { type: "adaptive" }` (never `budget_tokens` — it 400s on opus-4-8).
- One Supabase project for everything: `cywmdjldapzrnabsoosd` (`NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`, already in `.env.local`). Use the existing service-role client `src/lib/supabase/admin.ts`.
- Plane: base `https://plane.allonelabs.com`, workspace slug `allone`, auth header `X-API-Key`. Token MUST come from `process.env.PLANE_API_KEY` (sourced from Keychain `plane-api-token`) — never hardcode.
- Git commits for this repo MUST be authored as `team@allonelabs.com` (Vercel commit-author gate). End commit messages with the Co-Authored-By line.
- This increment is DRY-RUN: no candidate emails, no Google Calendar. `SENDING_ENABLED` defaults to `"false"`.

## File Structure

| File                                               | Responsibility                                                                                                                                                          |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `supabase/migrations/20260629000000_recruiter.sql` | Add `ai_*` + `proposed_slots` + `plane_issue_id` columns to `job_applications`; create `recruiter_candidates` (email-channel + dead-letter, used in a later increment). |
| `src/lib/recruiter/types.ts`                       | Shared types: `Candidate`, `Verdict`, `Vacancy`.                                                                                                                        |
| `src/lib/recruiter/cv.ts`                          | `extractCvText(buffer, filename)` — pdf/docx → text.                                                                                                                    |
| `src/lib/recruiter/vacancies.ts`                   | `getOpenVacancies()`, `matchVacancy(app, vacancies)`.                                                                                                                   |
| `src/lib/recruiter/evaluate.ts`                    | `evaluateCandidate(input)` — Claude structured verdict.                                                                                                                 |
| `src/lib/recruiter/plane.ts`                       | `ensureRecruitmentProject()`, `createCandidateIssue(...)`.                                                                                                              |
| `src/lib/recruiter/config.ts`                      | Env access + constants (thresholds, flags).                                                                                                                             |
| `src/app/api/recruiter/ingest/web/route.ts`        | Webhook endpoint orchestrating the pipeline.                                                                                                                            |
| `scripts/recruiter-setup-plane.mjs`                | One-time: create the "Recruitment" Plane project, print its id.                                                                                                         |
| `src/app/admin/careers/applications/page.tsx`      | (modify) show `ai_score` / `ai_decision`.                                                                                                                               |
| `docs/recruiter-supabase-webhook.md`               | How to register the Supabase DB webhook.                                                                                                                                |

Tests live beside each module (`*.test.ts`).

---

### Task 1: DB migration — ranking columns + recruiter_candidates

**Files:**

- Create: `supabase/migrations/20260629000000_recruiter.sql`

**Interfaces:**

- Produces: new columns on `job_applications` — `ai_score INT`, `ai_decision TEXT`, `ai_confidence NUMERIC`, `ai_language TEXT`, `ai_rationale TEXT`, `ai_strengths JSONB`, `ai_gaps JSONB`, `proposed_slots JSONB`, `plane_issue_id TEXT`, `ai_ranked_at TIMESTAMPTZ`. Extend `status` CHECK to add `'interview'`.

- [ ] **Step 1: Write the migration**

```sql
-- Recruiter pipeline: AI ranking columns on job_applications + email-channel table.
ALTER TABLE job_applications
  ADD COLUMN IF NOT EXISTS ai_score INT,
  ADD COLUMN IF NOT EXISTS ai_decision TEXT CHECK (ai_decision IN ('meeting','reject')),
  ADD COLUMN IF NOT EXISTS ai_confidence NUMERIC,
  ADD COLUMN IF NOT EXISTS ai_language TEXT,
  ADD COLUMN IF NOT EXISTS ai_rationale TEXT,
  ADD COLUMN IF NOT EXISTS ai_strengths JSONB,
  ADD COLUMN IF NOT EXISTS ai_gaps JSONB,
  ADD COLUMN IF NOT EXISTS proposed_slots JSONB,
  ADD COLUMN IF NOT EXISTS plane_issue_id TEXT,
  ADD COLUMN IF NOT EXISTS ai_ranked_at TIMESTAMPTZ;

-- Allow an explicit interview stage (meeting booked) alongside the existing values.
ALTER TABLE job_applications DROP CONSTRAINT IF EXISTS job_applications_status_check;
ALTER TABLE job_applications ADD CONSTRAINT job_applications_status_check
  CHECK (status IN ('new','reviewing','shortlisted','interview','rejected','hired'));

CREATE INDEX IF NOT EXISTS idx_job_applications_ai_ranked_at ON job_applications(ai_ranked_at);

-- Email-channel candidates + dead-letter (used by a later increment; created now so the schema is stable).
CREATE TABLE IF NOT EXISTS recruiter_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL CHECK (source IN ('web','email')),
  external_id TEXT NOT NULL,
  email TEXT,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  ai_score INT,
  ai_decision TEXT,
  plane_issue_id TEXT,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (source, external_id)
);
```

- [ ] **Step 2: Apply the migration to the project**

Run (uses the Supabase Management API or `psql`; this repo applies migrations via the Management API — mirror how prior migrations like `20260617000000_careers.sql` were applied):

```bash
cd ~/projects/allone-website
# Apply via your existing migration runner / Supabase CLI db push, e.g.:
npx supabase db push   # or the repo's documented Mgmt-API apply script
```

Expected: columns + table created; no error. Verify:

```bash
# Should print the new column names
node -e "import('@supabase/supabase-js').then(async ({createClient})=>{const c=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);const {data,error}=await c.from('job_applications').select('ai_score,plane_issue_id,ai_ranked_at').limit(1);console.log(error?error.message:'columns OK')})"
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260629000000_recruiter.sql
git -c user.name="Allone Labs" -c user.email="team@allonelabs.com" commit -m "feat(recruiter): add AI ranking columns + recruiter_candidates table

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Shared types + config

**Files:**

- Create: `src/lib/recruiter/types.ts`
- Create: `src/lib/recruiter/config.ts`

**Interfaces:**

- Produces: `Candidate`, `Verdict`, `Vacancy` types; `recruiterConfig` object with `sendingEnabled`, `confThreshold`, `model`, `plane` fields.

- [ ] **Step 1: Write types**

```typescript
// src/lib/recruiter/types.ts
export type Vacancy = {
  id: string;
  slug: string;
  title: string;
  department: string | null;
  description_md: string | null;
  is_open: boolean;
};

export type Candidate = {
  source: "web" | "email";
  externalId: string; // job_applications.id (web) | message_id (email)
  name: string;
  email: string;
  phone?: string | null;
  vacancyId?: string | null;
  cvPath?: string | null; // path in private 'applications' bucket
  projects?: string | null;
  note?: string | null;
};

export type Verdict = {
  score: number; // 0-100
  decision: "meeting" | "reject";
  confidence: number; // 0-1
  language: string; // ISO-639-1
  strengths: string[];
  gaps: string[];
  rationale: string;
  emailSubject: string;
  emailBody: string;
};
```

- [ ] **Step 2: Write config**

```typescript
// src/lib/recruiter/config.ts
function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env ${name}`);
  return v;
}

export const recruiterConfig = {
  sendingEnabled: process.env.RECRUITER_SENDING_ENABLED === "true", // dry-run default
  confThreshold: Number(process.env.RECRUITER_CONF_THRESHOLD ?? "0.6"),
  model: process.env.RECRUITER_MODEL ?? "claude-opus-4-8",
  webhookSecret: () => need("RECRUITER_WEBHOOK_SECRET"),
  plane: {
    baseUrl: process.env.PLANE_BASE_URL ?? "https://plane.allonelabs.com",
    apiKey: () => need("PLANE_API_KEY"),
    workspace: process.env.PLANE_WORKSPACE ?? "allone",
    projectId: () => need("PLANE_RECRUITMENT_PROJECT_ID"),
  },
};
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/recruiter/types.ts src/lib/recruiter/config.ts
git -c user.name="Allone Labs" -c user.email="team@allonelabs.com" commit -m "feat(recruiter): shared types + config

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: CV text extraction

**Files:**

- Create: `src/lib/recruiter/cv.ts`
- Test: `src/lib/recruiter/cv.test.ts`

**Interfaces:**

- Produces: `extractCvText(buffer: Buffer, filename: string): Promise<string>` — throws `UnsupportedCvError` on unknown extension.

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/recruiter/cv.test.ts
import { describe, it, expect } from "vitest";
import { extractCvText, UnsupportedCvError } from "./cv";

describe("extractCvText", () => {
  it("rejects unsupported extensions", async () => {
    await expect(
      extractCvText(Buffer.from("x"), "resume.rtf"),
    ).rejects.toBeInstanceOf(UnsupportedCvError);
  });
});
```

- [ ] **Step 2: Run it — expect FAIL (module not found)**

Run: `cd ~/projects/allone-website && npx vitest run src/lib/recruiter/cv.test.ts`
Expected: FAIL — cannot find `./cv`.

- [ ] **Step 3: Implement**

```typescript
// src/lib/recruiter/cv.ts
import mammoth from "mammoth";

export class UnsupportedCvError extends Error {}

export async function extractCvText(
  buffer: Buffer,
  filename: string,
): Promise<string> {
  const ext = filename.toLowerCase().split(".").pop();
  if (ext === "pdf") {
    // pdf-parse v2 default export parses a Buffer and returns { text }
    const pdfParse = (await import("pdf-parse")).default as (
      b: Buffer,
    ) => Promise<{ text: string }>;
    const { text } = await pdfParse(buffer);
    return text.trim();
  }
  if (ext === "docx" || ext === "doc") {
    const { value } = await mammoth.extractRawText({ buffer });
    return value.trim();
  }
  throw new UnsupportedCvError(`Unsupported CV type: ${filename}`);
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `npx vitest run src/lib/recruiter/cv.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/recruiter/cv.ts src/lib/recruiter/cv.test.ts
git -c user.name="Allone Labs" -c user.email="team@allonelabs.com" commit -m "feat(recruiter): CV text extraction (pdf/docx)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Vacancy fetch + role match

**Files:**

- Create: `src/lib/recruiter/vacancies.ts`
- Test: `src/lib/recruiter/vacancies.test.ts`

**Interfaces:**

- Consumes: `Vacancy`, `Candidate` from `./types`; supabase admin client from `@/lib/supabase/admin`.
- Produces: `getOpenVacancies(): Promise<Vacancy[]>`; `matchVacancy(candidate: Candidate, vacancies: Vacancy[]): Vacancy | null` (web: by `vacancyId`; fallback: single open vacancy).

- [ ] **Step 1: Write the failing test (pure matcher — no DB)**

```typescript
// src/lib/recruiter/vacancies.test.ts
import { describe, it, expect } from "vitest";
import { matchVacancy } from "./vacancies";
import type { Vacancy, Candidate } from "./types";

const v = (id: string, slug: string): Vacancy => ({
  id,
  slug,
  title: slug,
  department: null,
  description_md: "jd",
  is_open: true,
});

describe("matchVacancy", () => {
  it("matches by vacancyId when present", () => {
    const vacancies = [v("a", "one"), v("b", "two")];
    const c = {
      source: "web",
      externalId: "x",
      name: "n",
      email: "e",
      vacancyId: "b",
    } as Candidate;
    expect(matchVacancy(c, vacancies)?.id).toBe("b");
  });
  it("falls back to the sole open vacancy when no id", () => {
    const vacancies = [v("a", "one")];
    const c = {
      source: "email",
      externalId: "x",
      name: "n",
      email: "e",
    } as Candidate;
    expect(matchVacancy(c, vacancies)?.id).toBe("a");
  });
  it("returns null when ambiguous and no id", () => {
    const vacancies = [v("a", "one"), v("b", "two")];
    const c = {
      source: "email",
      externalId: "x",
      name: "n",
      email: "e",
    } as Candidate;
    expect(matchVacancy(c, vacancies)).toBeNull();
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `npx vitest run src/lib/recruiter/vacancies.test.ts`
Expected: FAIL — cannot find `./vacancies`.

- [ ] **Step 3: Implement**

```typescript
// src/lib/recruiter/vacancies.ts
import { createAdminClient } from "@/lib/supabase/admin";
import type { Vacancy, Candidate } from "./types";

export async function getOpenVacancies(): Promise<Vacancy[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("vacancies")
    .select("id,slug,title,department,description_md,is_open")
    .eq("is_open", true);
  if (error) throw new Error(`getOpenVacancies: ${error.message}`);
  return (data ?? []) as Vacancy[];
}

export function matchVacancy(
  candidate: Candidate,
  vacancies: Vacancy[],
): Vacancy | null {
  if (candidate.vacancyId) {
    return vacancies.find((v) => v.id === candidate.vacancyId) ?? null;
  }
  return vacancies.length === 1 ? vacancies[0] : null;
}
```

> NOTE: confirm the admin client export name in `src/lib/supabase/admin.ts`. If it exports a singleton (e.g. `supabaseAdmin`) rather than `createAdminClient()`, import that instead and drop the `()` call — adjust this and every later task identically.

- [ ] **Step 4: Run — expect PASS**

Run: `npx vitest run src/lib/recruiter/vacancies.test.ts`
Expected: PASS (matcher tests don't touch the DB).

- [ ] **Step 5: Commit**

```bash
git add src/lib/recruiter/vacancies.ts src/lib/recruiter/vacancies.test.ts
git -c user.name="Allone Labs" -c user.email="team@allonelabs.com" commit -m "feat(recruiter): vacancy fetch + role matching

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Claude evaluation (structured verdict)

**Files:**

- Create: `src/lib/recruiter/evaluate.ts`
- Test: `src/lib/recruiter/evaluate.test.ts`

**Interfaces:**

- Consumes: `Verdict`, `Vacancy` from `./types`; `recruiterConfig` from `./config`; `@anthropic-ai/sdk`.
- Produces: `evaluateCandidate(args: { vacancy: Vacancy; cvText: string; note?: string|null; projects?: string|null }): Promise<Verdict>`. Exposes `VerdictSchema` (Zod) for reuse.

- [ ] **Step 1: Write the failing test (schema-only — no network)**

```typescript
// src/lib/recruiter/evaluate.test.ts
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
```

- [ ] **Step 2: Run — expect FAIL**

Run: `npx vitest run src/lib/recruiter/evaluate.test.ts`
Expected: FAIL — cannot find `./evaluate`.

- [ ] **Step 3: Implement**

```typescript
// src/lib/recruiter/evaluate.ts
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { recruiterConfig } from "./config";
import type { Verdict, Vacancy } from "./types";

export const VerdictSchema = z.object({
  score: z.number().min(0).max(100),
  decision: z.enum(["meeting", "reject"]),
  confidence: z.number().min(0).max(1),
  language: z.string(), // ISO-639-1, e.g. "en", "ka"
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  rationale: z.string(),
  emailSubject: z.string(),
  emailBody: z.string(),
});

const SYSTEM = `You are a hiring screener for AllOne, an AI company in Tbilisi.
Score the candidate against the role's job description. Be specific and fair.
- "meeting" only if they clearly merit an interview; otherwise "reject".
- Detect the language the candidate wrote in and set "language" to its ISO-639-1 code.
- Write emailSubject/emailBody IN THAT LANGUAGE: a warm meeting-interest note (no times — a human will propose them) for "meeting", or a brief, kind rejection for "reject".
- Set confidence low if the CV is thin, unparseable, or the fit is genuinely borderline.`;

export async function evaluateCandidate(args: {
  vacancy: Vacancy;
  cvText: string;
  note?: string | null;
  projects?: string | null;
}): Promise<Verdict> {
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY
  const userContent = [
    `# Role: ${args.vacancy.title}`,
    `## Job description\n${args.vacancy.description_md ?? "(none provided)"}`,
    `## Candidate CV (extracted text)\n${args.cvText.slice(0, 24000)}`,
    args.note ? `## Candidate note ("how you use AI")\n${args.note}` : "",
    args.projects ? `## Candidate projects\n${args.projects}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const res = await client.messages.parse({
    model: recruiterConfig.model,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system: SYSTEM,
    messages: [{ role: "user", content: userContent }],
    output_config: { format: zodOutputFormat(VerdictSchema) },
  });

  if (!res.parsed_output) {
    throw new Error(
      `evaluateCandidate: no parsed output (stop_reason=${res.stop_reason})`,
    );
  }
  return res.parsed_output as Verdict;
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `npx vitest run src/lib/recruiter/evaluate.test.ts`
Expected: PASS (only the schema is exercised; `evaluateCandidate` is not called).

- [ ] **Step 5: Commit**

```bash
git add src/lib/recruiter/evaluate.ts src/lib/recruiter/evaluate.test.ts
git -c user.name="Allone Labs" -c user.email="team@allonelabs.com" commit -m "feat(recruiter): Claude structured CV evaluation

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Plane client + one-time project setup

**Files:**

- Create: `src/lib/recruiter/plane.ts`
- Create: `scripts/recruiter-setup-plane.mjs`
- Test: `src/lib/recruiter/plane.test.ts`

**Interfaces:**

- Consumes: `recruiterConfig`, `Verdict`, `Candidate`.
- Produces: `createCandidateIssue(args: { candidate: Candidate; vacancyTitle: string; verdict: Verdict; cvUrl?: string|null }): Promise<{ id: string }>`; `buildIssueName(...)` and `buildIssueDescription(...)` (pure, tested).

- [ ] **Step 1: Write the failing test (pure formatters)**

```typescript
// src/lib/recruiter/plane.test.ts
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
```

- [ ] **Step 2: Run — expect FAIL**

Run: `npx vitest run src/lib/recruiter/plane.test.ts`
Expected: FAIL — cannot find `./plane`.

- [ ] **Step 3: Implement the client**

```typescript
// src/lib/recruiter/plane.ts
import { recruiterConfig } from "./config";
import type { Candidate, Verdict } from "./types";

function planeUrl(path: string): string {
  return `${recruiterConfig.plane.baseUrl}/api/v1/workspaces/${recruiterConfig.plane.workspace}${path}`;
}

async function planeFetch(
  path: string,
  init: RequestInit = {},
): Promise<unknown> {
  const res = await fetch(planeUrl(path), {
    ...init,
    headers: {
      "X-API-Key": recruiterConfig.plane.apiKey(),
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`Plane ${res.status}: ${await res.text()}`);
  return res.json();
}

export function buildIssueName(
  name: string,
  vacancyTitle: string,
  v: Verdict,
): string {
  return `${name} — ${vacancyTitle} — ${v.score}/100 — ${v.decision.toUpperCase()}`;
}

export function buildIssueDescription(
  c: Candidate,
  vacancyTitle: string,
  v: Verdict,
  cvUrl?: string | null,
): string {
  return [
    `**Role:** ${vacancyTitle}`,
    `**Email:** ${c.email}${c.phone ? `  **Phone:** ${c.phone}` : ""}`,
    `**Score:** ${v.score}/100   **Decision:** ${v.decision}   **Confidence:** ${v.confidence}`,
    `**Language:** ${v.language}`,
    `**Strengths:**\n${v.strengths.map((s) => `- ${s}`).join("\n") || "- (none)"}`,
    `**Gaps:**\n${v.gaps.map((g) => `- ${g}`).join("\n") || "- (none)"}`,
    `**Rationale:** ${v.rationale}`,
    cvUrl ? `**CV:** ${cvUrl}` : "",
    `**Drafted email (NOT sent — dry-run):**\nSubject: ${v.emailSubject}\n\n${v.emailBody}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export async function createCandidateIssue(args: {
  candidate: Candidate;
  vacancyTitle: string;
  verdict: Verdict;
  cvUrl?: string | null;
}): Promise<{ id: string }> {
  const { candidate, vacancyTitle, verdict } = args;
  const body = {
    name: buildIssueName(candidate.name, vacancyTitle, verdict),
    description_html: `<p>${buildIssueDescription(
      candidate,
      vacancyTitle,
      verdict,
      args.cvUrl,
    )
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/\n/g, "<br/>")}</p>`,
  };
  const issue = (await planeFetch(
    `/projects/${recruiterConfig.plane.projectId()}/issues/`,
    { method: "POST", body: JSON.stringify(body) },
  )) as { id: string };
  return { id: issue.id };
}
```

- [ ] **Step 4: Write the one-time setup script**

```javascript
// scripts/recruiter-setup-plane.mjs
// Creates (or finds) the "Recruitment" project in workspace `allone`, prints its id.
const BASE = process.env.PLANE_BASE_URL ?? "https://plane.allonelabs.com";
const WS = process.env.PLANE_WORKSPACE ?? "allone";
const KEY = process.env.PLANE_API_KEY;
if (!KEY) {
  console.error("Set PLANE_API_KEY");
  process.exit(1);
}
const h = { "X-API-Key": KEY, "Content-Type": "application/json" };

const list = await fetch(`${BASE}/api/v1/workspaces/${WS}/projects/`, {
  headers: h,
}).then((r) => r.json());
let proj = (list.results ?? []).find((p) => p.name === "Recruitment");
if (!proj) {
  proj = await fetch(`${BASE}/api/v1/workspaces/${WS}/projects/`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({ name: "Recruitment", identifier: "HIRE" }),
  }).then((r) => r.json());
}
console.log("PLANE_RECRUITMENT_PROJECT_ID=" + proj.id);
```

Run it once and capture the id into env:

```bash
cd ~/projects/allone-website
PLANE_API_KEY="$(security find-generic-password -s plane-api-token -w)" node scripts/recruiter-setup-plane.mjs
# → copy the printed PLANE_RECRUITMENT_PROJECT_ID into .env.local and Vercel env
```

- [ ] **Step 5: Run the test — expect PASS**

Run: `npx vitest run src/lib/recruiter/plane.test.ts`
Expected: PASS.

- [ ] **Step 6: Move the Plane token into Keychain (one-time)**

```bash
security add-generic-password -U -s plane-api-token -a allonelabs -w "plane_api_7841d63f842649cb8c215d05956f0589"
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/recruiter/plane.ts src/lib/recruiter/plane.test.ts scripts/recruiter-setup-plane.mjs
git -c user.name="Allone Labs" -c user.email="team@allonelabs.com" commit -m "feat(recruiter): Plane client + Recruitment project setup script

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Web ingest endpoint (orchestration, dry-run)

**Files:**

- Create: `src/app/api/recruiter/ingest/web/route.ts`
- Test: `src/app/api/recruiter/ingest/web/route.test.ts`

**Interfaces:**

- Consumes: everything above + supabase admin client.
- Produces: `POST` handler. Body is a Supabase DB-webhook payload `{ record: JobApplicationRow }`. Header `x-webhook-secret` must equal `RECRUITER_WEBHOOK_SECRET`. Returns 401 on bad secret, 200 `{ skipped: true }` if already ranked, 200 `{ ranked: true, decision }` on success.

- [ ] **Step 1: Write the failing test (auth + idempotency guard, mocked deps)**

```typescript
// src/app/api/recruiter/ingest/web/route.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

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
          data: new Blob([Buffer.from("pdf")]),
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
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `npx vitest run src/app/api/recruiter/ingest/web/route.test.ts`
Expected: FAIL — cannot find `./route`.

- [ ] **Step 3: Implement the route**

```typescript
// src/app/api/recruiter/ingest/web/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recruiterConfig } from "@/lib/recruiter/config";
import { extractCvText, UnsupportedCvError } from "@/lib/recruiter/cv";
import { getOpenVacancies, matchVacancy } from "@/lib/recruiter/vacancies";
import { evaluateCandidate } from "@/lib/recruiter/evaluate";
import { createCandidateIssue } from "@/lib/recruiter/plane";
import type { Candidate } from "@/lib/recruiter/types";

export const runtime = "nodejs"; // pdf-parse/mammoth need Node, not edge

type Row = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  vacancy_id?: string | null;
  vacancy_title?: string | null;
  cv_path?: string | null;
  projects?: string | null;
  note?: string | null;
  ai_ranked_at?: string | null;
};

export async function POST(req: Request) {
  if (
    req.headers.get("x-webhook-secret")?.trim() !==
    recruiterConfig.webhookSecret()
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as { record?: Row };
  const row = body.record;
  if (!row?.id)
    return NextResponse.json({ error: "No record" }, { status: 400 });

  // Idempotency: skip if already ranked.
  if (row.ai_ranked_at)
    return NextResponse.json({ skipped: true, reason: "already_ranked" });

  const supabase = createAdminClient();

  const fail = async (reason: string) => {
    await supabase
      .from("job_applications")
      .update({
        status: "reviewing",
        ai_rationale: reason,
        ai_ranked_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    return NextResponse.json({ held: true, reason });
  };

  // 1. CV text
  let cvText = "";
  if (row.cv_path) {
    const dl = await supabase.storage
      .from("applications")
      .download(row.cv_path);
    if (dl.error || !dl.data)
      return fail(`cv_download_failed: ${dl.error?.message ?? "no data"}`);
    const buf = Buffer.from(await dl.data.arrayBuffer());
    try {
      cvText = await extractCvText(buf, row.cv_path);
    } catch (e) {
      if (e instanceof UnsupportedCvError) return fail("unsupported_cv_type");
      return fail(`cv_parse_failed: ${(e as Error).message}`);
    }
  }

  // 2. Role
  const vacancies = await getOpenVacancies();
  const candidate: Candidate = {
    source: "web",
    externalId: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    vacancyId: row.vacancy_id,
    cvPath: row.cv_path,
    projects: row.projects,
    note: row.note,
  };
  const vacancy = matchVacancy(candidate, vacancies);
  if (!vacancy) return fail("no_matching_vacancy");

  // 3. Evaluate
  const verdict = await evaluateCandidate({
    vacancy,
    cvText,
    note: row.note,
    projects: row.projects,
  });

  // 4. Guardrail: low confidence → hold (no auto-action even in later increments)
  const held = verdict.confidence < recruiterConfig.confThreshold || !row.email;

  // 5. CV signed URL for the Plane card
  let cvUrl: string | null = null;
  if (row.cv_path) {
    const { data } = await supabase.storage
      .from("applications")
      .createSignedUrl(row.cv_path, 60 * 60 * 24 * 7);
    cvUrl = data?.signedUrl ?? null;
  }

  // 6. Plane card
  const issue = await createCandidateIssue({
    candidate,
    vacancyTitle: vacancy.title,
    verdict,
    cvUrl,
  });

  // 7. Mirror into the CRM row. DRY-RUN: never email; status reflects decision unless held.
  const status = held
    ? "reviewing"
    : verdict.decision === "meeting"
      ? "shortlisted"
      : "rejected";
  const { error } = await supabase
    .from("job_applications")
    .update({
      ai_score: verdict.score,
      ai_decision: verdict.decision,
      ai_confidence: verdict.confidence,
      ai_language: verdict.language,
      ai_rationale: verdict.rationale,
      ai_strengths: verdict.strengths,
      ai_gaps: verdict.gaps,
      plane_issue_id: issue.id,
      ai_ranked_at: new Date().toISOString(),
      status,
    })
    .eq("id", row.id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    ranked: true,
    decision: verdict.decision,
    held,
    plane_issue_id: issue.id,
  });
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `npx vitest run src/app/api/recruiter/ingest/web/route.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Typecheck**

Run: `cd ~/projects/allone-website && npx tsc --noEmit`
Expected: no errors in `src/lib/recruiter/**` or the route. Fix any import-name mismatches (esp. the supabase admin export — see Task 4 note).

- [ ] **Step 6: Commit**

```bash
git add src/app/api/recruiter/ingest/web/
git -c user.name="Allone Labs" -c user.email="team@allonelabs.com" commit -m "feat(recruiter): web ingest endpoint (rank → Plane card → CRM mirror, dry-run)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: CRM careers admin — show AI ranking

**Files:**

- Modify: `src/app/admin/careers/applications/page.tsx`

**Interfaces:**

- Consumes: the new `ai_score` / `ai_decision` / `status` columns already selected by the page's query (extend the select if needed).

- [ ] **Step 1: Read the file and find the applications query + table header/rows**

Run: `sed -n '1,80p' src/app/admin/careers/applications/page.tsx` to locate the `.select(...)` and the row rendering.

- [ ] **Step 2: Extend the select to include the AI columns**

In the Supabase query, add the new columns. Example (adapt to the existing select string):

```typescript
.select("id,name,email,status,created_at,ai_score,ai_decision,ai_confidence")
```

- [ ] **Step 3: Render a Score + AI-decision cell**

Add a header cell `<th>AI</th>` and, in each row, a cell:

```tsx
<td>
  {app.ai_score != null ? (
    <span title={app.ai_decision ?? ""}>
      {app.ai_score}/100 · {app.ai_decision ?? "—"}
    </span>
  ) : (
    <span className="text-zinc-400">—</span>
  )}
</td>
```

- [ ] **Step 4: Typecheck + build**

Run: `npx tsc --noEmit && npx next build`
Expected: compiles; the admin page renders the new column.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/careers/applications/page.tsx
git -c user.name="Allone Labs" -c user.email="team@allonelabs.com" commit -m "feat(recruiter): show AI score/decision on CRM careers admin page

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Wire the Supabase DB webhook + env + end-to-end smoke

**Files:**

- Create: `docs/recruiter-supabase-webhook.md`

**Interfaces:** none (operational).

- [ ] **Step 1: Document + create the DB webhook**

Write `docs/recruiter-supabase-webhook.md`:

```markdown
# Supabase DB webhook → recruiter ingest

Supabase Dashboard → Database → Webhooks → Create:

- Table: `public.job_applications`
- Events: INSERT
- Type: HTTP Request, POST
- URL: https://app.allonelabs.com/api/recruiter/ingest/web (prod CRM origin)
- HTTP Headers: `x-webhook-secret: <RECRUITER_WEBHOOK_SECRET>`

Supabase sends `{ "type":"INSERT", "table":"job_applications", "record": {...} }`.
The route reads `record`.
```

- [ ] **Step 2: Set env on the CRM Vercel project AND `.env.local`**

Required keys: `ANTHROPIC_API_KEY`, `PLANE_API_KEY` (from Keychain `plane-api-token`), `PLANE_RECRUITMENT_PROJECT_ID` (from Task 6 setup script), `RECRUITER_WEBHOOK_SECRET` (generate a random secret), `RECRUITER_SENDING_ENABLED=false`. Per the per-project env rule, set these on the CRM project (`allone-perf`) explicitly.

- [ ] **Step 3: Deploy, then end-to-end smoke**

Submit a real test application through the live careers apply form (or insert a `job_applications` row via the service role) and confirm within ~1 min:

- the row gets `ai_score`, `ai_decision`, `ai_ranked_at`, `plane_issue_id`, and an updated `status`;
- a card appears in the Plane "Recruitment" project assigned/visible to you;
- **no email was sent** (dry-run).

```bash
# Insert a synthetic application (uses a real open vacancy id + an uploaded test CV path)
node -e "import('@supabase/supabase-js').then(async({createClient})=>{const c=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);const {data:v}=await c.from('vacancies').select('id').eq('is_open',true).limit(1).single();const {data,error}=await c.from('job_applications').insert({vacancy_id:v.id,name:'Test Candidate',email:'test@example.com',cv_path:'<slug>/<uploaded-test-cv>.pdf',note:'I use Claude daily to build things'}).select('id').single();console.log(error?error.message:'inserted '+data.id)})"
```

- [ ] **Step 4: Verify the row was ranked**

```bash
node -e "import('@supabase/supabase-js').then(async({createClient})=>{const c=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);const {data}=await c.from('job_applications').select('name,ai_score,ai_decision,status,plane_issue_id').order('created_at',{ascending:false}).limit(1).single();console.log(data)})"
```

Expected: `ai_score`/`ai_decision`/`plane_issue_id` populated; `status` is `shortlisted`/`rejected`/`reviewing`.

- [ ] **Step 5: Commit**

```bash
git add docs/recruiter-supabase-webhook.md
git -c user.name="Allone Labs" -c user.email="team@allonelabs.com" commit -m "docs(recruiter): Supabase DB webhook wiring + smoke steps

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Out of scope (follow-up plans)

These are deliberately deferred — each becomes its own spec→plan once Increment 1 is validated in dry-run:

1. **Increment 2 — Auto-send rejections.** Flip `RECRUITER_SENDING_ENABLED=true`; send the drafted rejection via `src/lib/email.ts` in the candidate's language; log outbound to `emails`; idempotency so a candidate is emailed at most once.
2. **Increment 3 — Meeting flow (calendar + Plane approval).** Propose slots from Google Calendar free/busy; Plane card "Awaiting time approval"; a cron route polls Plane for approval → send invite + create the calendar event; status → `interview`.
3. **Increment 4 — Email channel.** Supabase DB webhook on `emails` INSERT → `/api/recruiter/ingest/email`; filter CV-bearing inbound mail; reuse the same pipeline via `recruiter_candidates`.

## Self-review notes

- Spec coverage: web channel ingest ✅ (T7), JD auto-detect ✅ (T4 reads `vacancies` live), agentic eval ✅ (T5), Plane card ✅ (T6), CRM mirror ✅ (T7 columns + T8 UI), idempotency ✅ (T7 `ai_ranked_at` guard), low-confidence hold ✅ (T7), dry-run ✅ (no email path exists in this increment). Auto-send / calendar / email channel intentionally deferred (see above).
- Open confirmations carried from the spec: exact export name in `src/lib/supabase/admin.ts` (Task 4 note); whether to keep `claude-opus-4-8` or accept the Sonnet 4.6 cost-down; the Google account for Increment 3; the still-unknown "also it should…" requirement.
