# Questionnaire-Bot Generator (Foundation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a salesperson create a config-driven questionnaire bot inside `allone-website`, share its public link, and have completed answers land in a shared table the CRM can read.

**Architecture:** One reusable public chat route `/b/[slug]` renders any bot from a `bot_configs` row (config-as-data, no per-client repo). Answers POST to `/api/bots/[slug]/submit` → `questionnaire_responses` via the service-role admin client. A `/sales/bots` CRM page creates configs (questions hand-built or AI-drafted from a one-line brief) and shows the link. This is Plan 1 of 4; Plans 2–4 (answers→offer, approval, invoice/contract) build on `questionnaire_responses`.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Supabase (`@supabase/supabase-js`), Tailwind, vitest, Anthropic SDK (already a dep, used by `/api/sales/chat`).

---

## File Structure

- Create `supabase/migrations/20260616000000_bot_configs_and_responses.sql` — two tables + RLS.
- Create `src/lib/bots/types.ts` — `BotConfig`, `BotQuestion`, `QuestionnaireResponse` types + `OTHER_LABEL`.
- Create `src/lib/bots/repo.ts` — `getBotConfigBySlug`, `listBotConfigs`, `createBotConfig`, `insertResponse`, `listResponses` (service-role).
- Create `src/lib/bots/repo.test.ts` — repo unit tests (mocked client).
- Create `src/app/api/bots/[slug]/route.ts` — `GET` public config (sanitized).
- Create `src/app/api/bots/[slug]/submit/route.ts` — `POST` answer.
- Create `src/app/api/bots/[slug]/submit/route.test.ts` — submit handler test.
- Create `src/app/b/[slug]/page.tsx` — server loader for the public bot.
- Create `src/app/b/[slug]/BotChat.tsx` — client chat UI (config-driven).
- Create `src/app/api/sales/bots/route.ts` — `GET` list / `POST` create (sales-authed).
- Create `src/app/api/sales/bots/draft/route.ts` — `POST` AI-draft questions from a brief.
- Create `src/app/sales/bots/page.tsx` + `BotsContent.tsx` — CRM list + create UI.
- Modify the sales sidebar component to add a "Bots" link (path discovered in Task 9).

---

## Task 1: Database migration

**Files:**

- Create: `supabase/migrations/20260616000000_bot_configs_and_responses.sql`

- [ ] **Step 1: Write the migration** (idempotent, RLS like `lead_payments`)

```sql
-- Config-driven questionnaire bots + their shared answer sink.
-- bot_configs: one row per bot (questions stored as jsonb).
-- questionnaire_responses: one row per completed submission; lead_id optional.
-- Idempotent so it can be re-applied.

CREATE TABLE IF NOT EXISTS bot_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  client_name text NOT NULL,
  title text NOT NULL,
  intro text,
  language text NOT NULL DEFAULT 'ka',
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES sales_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bot_configs_slug ON bot_configs(slug);

CREATE TABLE IF NOT EXISTS questionnaire_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_slug text NOT NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  client_name text,
  respondent_name text,
  answers jsonb NOT NULL,
  user_agent text,
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_qr_bot_slug ON questionnaire_responses(bot_slug);
CREATE INDEX IF NOT EXISTS idx_qr_lead ON questionnaire_responses(lead_id);

DROP TRIGGER IF EXISTS update_bot_configs_updated_at ON bot_configs;
CREATE TRIGGER update_bot_configs_updated_at
  BEFORE UPDATE ON bot_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS: tables are written/read only via the service-role admin client
-- (public bot submit + sales APIs). Enable RLS with no policies so the
-- anon/auth keys cannot touch them directly.
ALTER TABLE bot_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_responses ENABLE ROW LEVEL SECURITY;
```

- [ ] **Step 2: Apply against the sales Supabase project**

Run: `psql "$DATABASE_URL" -f supabase/migrations/20260616000000_bot_configs_and_responses.sql`
(Or apply via the project's existing migration runner — see `apply_migrations.sql`.)
Expected: `CREATE TABLE` ×2, `CREATE INDEX`, `CREATE TRIGGER`, `ALTER TABLE` ×2, no errors.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260616000000_bot_configs_and_responses.sql
git commit -m "feat(bots): add bot_configs + questionnaire_responses tables"
```

---

## Task 2: Shared types

**Files:**

- Create: `src/lib/bots/types.ts`

- [ ] **Step 1: Write the types**

```ts
export const OTHER_LABEL = "სხვა (ჩაწერეთ)";

export type QuestionType = "single" | "multi" | "text";

export interface BotQuestion {
  id: string;
  text: string;
  hint?: string;
  type: QuestionType;
  options?: string[];
  allowOther?: boolean;
}

export interface BotConfig {
  id: string;
  slug: string;
  client_name: string;
  title: string;
  intro: string | null;
  language: string;
  questions: BotQuestion[];
  lead_id: string | null;
  active: boolean;
  created_at: string;
}

/** Shape sent to the public bot page (no internal columns). */
export type PublicBotConfig = Pick<
  BotConfig,
  "slug" | "title" | "intro" | "language" | "questions"
>;

export interface QuestionnaireResponse {
  id: string;
  bot_slug: string;
  lead_id: string | null;
  client_name: string | null;
  respondent_name: string | null;
  answers: Record<string, string | string[]>;
  completed_at: string;
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/bots/types.ts
git commit -m "feat(bots): shared bot/question/response types"
```

---

## Task 3: Repo helpers (service-role)

**Files:**

- Create: `src/lib/bots/repo.ts`
- Test: `src/lib/bots/repo.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, vi } from "vitest";
import { slugify, buildResponseRow } from "./repo";

describe("slugify", () => {
  it("lowercases, strips punctuation, keeps a short hash suffix shape", () => {
    expect(slugify("ანგელოზთა Museum!")).toMatch(/^[a-z0-9-]+$/);
  });
});

describe("buildResponseRow", () => {
  it("pulls respondent_name from answers.respondent and keeps answers", () => {
    const row = buildResponseRow(
      "clinic-1",
      null,
      "Acme",
      {
        respondent: "ქეთა",
        role: "დირექცია",
      },
      "UA/1.0",
    );
    expect(row.bot_slug).toBe("clinic-1");
    expect(row.respondent_name).toBe("ქეთა");
    expect(row.answers.role).toBe("დირექცია");
    expect(row.user_agent).toBe("UA/1.0");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/lib/bots/repo.test.ts`
Expected: FAIL — `slugify`/`buildResponseRow` not exported.

- [ ] **Step 3: Implement the repo**

```ts
import { createAdminClient } from "@/lib/supabase/admin";
import type { BotConfig, QuestionnaireResponse } from "./types";

/** Stable URL slug; non-latin titles fall back to a generic stem. */
export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return base || "bot";
}

export function buildResponseRow(
  botSlug: string,
  leadId: string | null,
  clientName: string | null,
  answers: Record<string, string | string[]>,
  userAgent: string | null,
) {
  const respondent =
    typeof answers.respondent === "string"
      ? answers.respondent.slice(0, 200)
      : null;
  return {
    bot_slug: botSlug,
    lead_id: leadId,
    client_name: clientName,
    respondent_name: respondent,
    answers,
    user_agent: userAgent?.slice(0, 500) ?? null,
  };
}

export async function getBotConfigBySlug(
  slug: string,
): Promise<BotConfig | null> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("bot_configs")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
  if (error) throw error;
  return (data as BotConfig) ?? null;
}

export async function listBotConfigs(): Promise<BotConfig[]> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("bot_configs")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as BotConfig[]) ?? [];
}

export async function createBotConfig(input: {
  slug: string;
  client_name: string;
  title: string;
  intro: string | null;
  language: string;
  questions: unknown;
  lead_id: string | null;
  created_by: string | null;
}): Promise<BotConfig> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("bot_configs")
    .insert(input)
    .select("*")
    .single();
  if (error) throw error;
  return data as BotConfig;
}

export async function insertResponse(
  row: ReturnType<typeof buildResponseRow>,
): Promise<void> {
  const db = createAdminClient();
  const { error } = await db.from("questionnaire_responses").insert(row);
  if (error) throw error;
}

export async function listResponses(
  botSlug?: string,
): Promise<QuestionnaireResponse[]> {
  const db = createAdminClient();
  let q = db
    .from("questionnaire_responses")
    .select("*")
    .order("completed_at", { ascending: false });
  if (botSlug) q = q.eq("bot_slug", botSlug);
  const { data, error } = await q;
  if (error) throw error;
  return (data as QuestionnaireResponse[]) ?? [];
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/bots/repo.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/bots/repo.ts src/lib/bots/repo.test.ts
git commit -m "feat(bots): service-role repo for configs + responses"
```

---

## Task 4: Public config endpoint `GET /api/bots/[slug]`

**Files:**

- Create: `src/app/api/bots/[slug]/route.ts`

- [ ] **Step 1: Implement** (returns only the public-safe fields)

```ts
import { NextRequest, NextResponse } from "next/server";
import { getBotConfigBySlug } from "@/lib/bots/repo";
import type { PublicBotConfig } from "@/lib/bots/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params; // Next 16: params is async
  const cfg = await getBotConfigBySlug(slug);
  if (!cfg) return NextResponse.json({ error: "not found" }, { status: 404 });
  const pub: PublicBotConfig = {
    slug: cfg.slug,
    title: cfg.title,
    intro: cfg.intro,
    language: cfg.language,
    questions: cfg.questions,
  };
  return NextResponse.json(pub);
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors (note the `await params` — Next 16 made route params async).

- [ ] **Step 3: Commit**

```bash
git add src/app/api/bots/[slug]/route.ts
git commit -m "feat(bots): public GET config endpoint"
```

---

## Task 5: Submit endpoint `POST /api/bots/[slug]/submit`

**Files:**

- Create: `src/app/api/bots/[slug]/submit/route.ts`
- Test: `src/app/api/bots/[slug]/submit/route.test.ts`

- [ ] **Step 1: Write the failing test** (validates the handler rejects bad input)

```ts
import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/bots/repo", () => ({
  getBotConfigBySlug: vi.fn(async (slug: string) =>
    slug === "live"
      ? { slug, lead_id: null, client_name: "Acme", active: true }
      : null,
  ),
  buildResponseRow: (
    await vi.importActual<typeof import("@/lib/bots/repo")>("@/lib/bots/repo")
  ).buildResponseRow,
  insertResponse: vi.fn(async () => {}),
}));

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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/app/api/bots/[slug]/submit/route.test.ts`
Expected: FAIL — `./route` has no `POST` export yet.

- [ ] **Step 3: Implement the handler**

```ts
import { NextRequest, NextResponse } from "next/server";
import {
  getBotConfigBySlug,
  buildResponseRow,
  insertResponse,
} from "@/lib/bots/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  let body: { answers?: Record<string, string | string[]> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  if (!body?.answers || typeof body.answers !== "object") {
    return NextResponse.json({ error: "answers required" }, { status: 400 });
  }
  const cfg = await getBotConfigBySlug(slug);
  if (!cfg) return NextResponse.json({ error: "not found" }, { status: 404 });

  const row = buildResponseRow(
    slug,
    cfg.lead_id,
    cfg.client_name,
    body.answers,
    req.headers.get("user-agent"),
  );
  await insertResponse(row);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/app/api/bots/[slug]/submit/route.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add "src/app/api/bots/[slug]/submit/route.ts" "src/app/api/bots/[slug]/submit/route.test.ts"
git commit -m "feat(bots): public submit endpoint -> questionnaire_responses"
```

---

## Task 6: Public chat UI `/b/[slug]`

**Files:**

- Create: `src/app/b/[slug]/page.tsx`
- Create: `src/app/b/[slug]/BotChat.tsx`

- [ ] **Step 1: Write the server loader**

```tsx
import { notFound } from "next/navigation";
import { getBotConfigBySlug } from "@/lib/bots/repo";
import { BotChat } from "./BotChat";

export const dynamic = "force-dynamic";

export default async function BotPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cfg = await getBotConfigBySlug(slug);
  if (!cfg) notFound();
  return (
    <BotChat
      slug={cfg.slug}
      title={cfg.title}
      intro={cfg.intro}
      questions={cfg.questions}
    />
  );
}
```

- [ ] **Step 2: Write the client chat component**

Port the proven chat-native flow from the existing questionnaire bots
(`~/Projects/clinic-questionnaire/app/page.tsx`): one question at a time,
option chips for `single`/`multi`, a free-text "სხვა (ჩაწერეთ)" via `OTHER_LABEL`,
a final POST to `/api/bots/${slug}/submit` with `{ answers }`. Drive it from the
`questions` prop instead of a hard-coded array.

```tsx
"use client";
import { useState } from "react";
import { OTHER_LABEL, type BotQuestion } from "@/lib/bots/types";

export function BotChat({
  slug,
  title,
  intro,
  questions,
}: {
  slug: string;
  title: string;
  intro: string | null;
  questions: BotQuestion[];
}) {
  const [step, setStep] = useState(-1); // -1 = intro screen
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [done, setDone] = useState(false);

  async function submit(all: Record<string, string | string[]>) {
    await fetch(`/api/bots/${slug}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: all }),
    });
    setDone(true);
  }

  function answer(q: BotQuestion, value: string | string[]) {
    const next = { ...answers, [q.id]: value };
    setAnswers(next);
    if (step + 1 >= questions.length) void submit(next);
    else setStep(step + 1);
  }

  if (done)
    return (
      <main className="mx-auto max-w-2xl p-8 text-center">მადლობა! 🙌</main>
    );
  if (step < 0)
    return (
      <main className="mx-auto max-w-2xl p-8">
        <h1 className="text-xl font-semibold">{title}</h1>
        {intro && <p className="mt-3 text-neutral-600">{intro}</p>}
        <button
          onClick={() => setStep(0)}
          className="mt-5 rounded-xl bg-black px-5 py-3 text-white"
        >
          დავიწყოთ
        </button>
      </main>
    );

  const q = questions[step];
  const opts = [...(q.options ?? []), ...(q.allowOther ? [OTHER_LABEL] : [])];
  return (
    <main className="mx-auto max-w-2xl p-8">
      <p className="text-sm text-neutral-500">
        {step + 1} / {questions.length}
      </p>
      <h2 className="mt-2 text-lg font-medium">{q.text}</h2>
      {q.hint && <p className="text-sm text-neutral-500">{q.hint}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        {q.type === "text" ? (
          <TextAnswer onSubmit={(v) => answer(q, v)} />
        ) : (
          opts.map((o) => (
            <button
              key={o}
              onClick={() => answer(q, q.type === "multi" ? [o] : o)}
              className="rounded-full border px-4 py-2 text-sm"
            >
              {o}
            </button>
          ))
        )}
      </div>
    </main>
  );
}

function TextAnswer({ onSubmit }: { onSubmit: (v: string) => void }) {
  const [v, setV] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(v.trim());
      }}
      className="flex w-full gap-2"
    >
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        className="flex-1 rounded-xl border px-4 py-3"
        placeholder="ჩაწერეთ პასუხი…"
      />
      <button className="rounded-xl bg-black px-5 text-white">გაგზავნა</button>
    </form>
  );
}
```

> NOTE (v1 simplification): multi-select here commits a single chip for brevity.
> The richer multi-select + "continue" UX from the existing bots is a follow-up
> polish task, not required for the answers pipeline. Logged here, not silently dropped.

- [ ] **Step 3: Build to verify the route compiles**

Run: `NODE_OPTIONS="--max-old-space-size=2048" pnpm build`
Expected: build succeeds; `/b/[slug]` appears as a dynamic route.

- [ ] **Step 4: Commit**

```bash
git add src/app/b/
git commit -m "feat(bots): public config-driven chat route /b/[slug]"
```

---

## Task 7: AI question drafter `POST /api/sales/bots/draft`

**Files:**

- Create: `src/app/api/sales/bots/draft/route.ts`

- [ ] **Step 1: Find how `/api/sales/chat` constructs the Anthropic client**

Run: `sed -n '1,40p' src/app/api/sales/chat/route.ts`
Expected: reveals the Anthropic SDK import + model id + how auth is enforced
(`requireSalesAuth`). Reuse the exact same client construction and model id.

- [ ] **Step 2: Implement the drafter** (returns `BotQuestion[]` JSON)

```ts
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireSalesAuth } from "@/lib/sales-auth";
import type { BotQuestion } from "@/lib/bots/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  await requireSalesAuth();
  const { brief } = (await req.json()) as { brief?: string };
  if (!brief)
    return NextResponse.json({ error: "brief required" }, { status: 400 });

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  const msg = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 2000,
    system:
      "You design Georgian (ka) requirements questionnaires for client discovery. " +
      "Return ONLY a JSON array of questions. Each: {id, text, type:'single'|'multi'|'text', " +
      "options?:string[], allowOther?:boolean, hint?:string}. 12-18 questions. Georgian text.",
    messages: [{ role: "user", content: `Brief: ${brief}` }],
  });
  const text = msg.content.find((b) => b.type === "text");
  const raw = text && "text" in text ? text.text : "[]";
  const json = raw.slice(raw.indexOf("["), raw.lastIndexOf("]") + 1);
  let questions: BotQuestion[];
  try {
    questions = JSON.parse(json);
  } catch {
    return NextResponse.json({ error: "draft parse failed" }, { status: 502 });
  }
  return NextResponse.json({ questions });
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. (If the model id differs from Step 1's finding, use that one.)

- [ ] **Step 4: Commit**

```bash
git add src/app/api/sales/bots/draft/route.ts
git commit -m "feat(bots): AI question drafter from a one-line brief"
```

---

## Task 8: Bot config CRUD `GET/POST /api/sales/bots`

**Files:**

- Create: `src/app/api/sales/bots/route.ts`

- [ ] **Step 1: Implement list + create** (sales-authed; slug uniqueness via random suffix)

```ts
import { NextRequest, NextResponse } from "next/server";
import { requireSalesAuth } from "@/lib/sales-auth";
import { listBotConfigs, createBotConfig, slugify } from "@/lib/bots/repo";
import { randomBytes } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await requireSalesAuth();
  return NextResponse.json({ bots: await listBotConfigs() });
}

export async function POST(req: NextRequest) {
  const { salesUser } = await requireSalesAuth();
  const body = await req.json();
  if (!body?.client_name || !Array.isArray(body?.questions)) {
    return NextResponse.json(
      { error: "client_name + questions required" },
      { status: 400 },
    );
  }
  const slug = `${slugify(body.client_name)}-${randomBytes(3).toString("hex")}`;
  const bot = await createBotConfig({
    slug,
    client_name: body.client_name,
    title: body.title || `${body.client_name} — კითხვარი`,
    intro: body.intro ?? null,
    language: body.language || "ka",
    questions: body.questions,
    lead_id: body.lead_id ?? null,
    created_by: salesUser?.id ?? null,
  });
  return NextResponse.json({ bot });
}
```

> If `requireSalesAuth()` returns a differently-named field than `salesUser`,
> use the field discovered in Task 7 Step 1 / `src/lib/sales-auth.ts`.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/sales/bots/route.ts
git commit -m "feat(bots): sales bot config list/create API"
```

---

## Task 9: CRM `/sales/bots` page + sidebar link

**Files:**

- Create: `src/app/sales/bots/page.tsx`
- Create: `src/app/sales/bots/BotsContent.tsx`
- Modify: the sales sidebar (discover path in Step 1)

- [ ] **Step 1: Find the sidebar component**

Run: `grep -rl "sales/demos\|sales/leads" src/components src/app/sales | grep -iE "sidebar|nav|layout" | head`
Expected: the file rendering the sales nav items. Add a `{ href: "/sales/bots", label: "Bots" }` entry following the existing item shape.

- [ ] **Step 2: Write the server page** (mirrors `sales/demos/page.tsx` shape)

```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listBotConfigs } from "@/lib/bots/repo";
import { BotsContent } from "./BotsContent";

export const dynamic = "force-dynamic";

export default async function BotsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sales/login");
  const bots = await listBotConfigs();
  return <BotsContent bots={bots} />;
}
```

- [ ] **Step 3: Write the client content** — list bots with their public link
      (`/b/<slug>`) + a copy button, and a "New bot" form: client name + a brief box
      that calls `POST /api/sales/bots/draft`, shows the drafted questions for edit,
      then `POST /api/sales/bots` to save. (Standard React form + fetch; reuse CRM
      input styles from a sibling `*Content.tsx`.)

```tsx
"use client";
import { useState } from "react";
import type { BotConfig, BotQuestion } from "@/lib/bots/types";

export function BotsContent({ bots }: { bots: BotConfig[] }) {
  const [draft, setDraft] = useState<BotQuestion[] | null>(null);
  const [clientName, setClientName] = useState("");
  const [brief, setBrief] = useState("");
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  async function generate() {
    const r = await fetch("/api/sales/bots/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brief }),
    });
    const j = await r.json();
    setDraft(j.questions ?? []);
  }
  async function save() {
    await fetch("/api/sales/bots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_name: clientName, questions: draft }),
    });
    location.reload();
  }

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold">Questionnaire bots</h1>
      <div className="mt-4 space-y-2">
        {bots.map((b) => (
          <div
            key={b.id}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <span>{b.client_name}</span>
            <a
              className="text-sm underline"
              href={`${origin}/b/${b.slug}`}
              target="_blank"
            >
              {origin}/b/{b.slug}
            </a>
          </div>
        ))}
      </div>
      <div className="mt-8 space-y-2 rounded-xl border p-4">
        <input
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="Client name"
          className="w-full rounded border px-3 py-2"
        />
        <textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="One line: what is this client / what do we want to learn?"
          className="w-full rounded border px-3 py-2"
        />
        <button onClick={generate} className="rounded bg-neutral-200 px-4 py-2">
          Draft questions
        </button>
        {draft && (
          <>
            <ul className="list-disc pl-5 text-sm">
              {draft.map((q) => (
                <li key={q.id}>{q.text}</li>
              ))}
            </ul>
            <button
              onClick={save}
              className="rounded bg-black px-4 py-2 text-white"
            >
              Create bot
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Build + manual smoke**

Run: `NODE_OPTIONS="--max-old-space-size=2048" pnpm build`
Then locally: create a bot from `/sales/bots`, open `/b/<slug>`, complete it, and
confirm a row lands: `select bot_slug, respondent_name from questionnaire_responses order by completed_at desc limit 1;`
Expected: build passes; one response row written.

- [ ] **Step 5: Commit**

```bash
git add src/app/sales/bots/ src/components
git commit -m "feat(bots): /sales/bots generator page + sidebar link"
```

---

## Self-Review notes

- **Spec coverage:** Component 1 (bot generator: config-driven app, shared
  `questionnaire_responses`, `/sales/bots` create + link, hosted inside
  `allone-website`) is fully covered by Tasks 1–9. Components 2–4
  (answers→offer, approval, invoice/contract) are explicitly out of this plan →
  Plans 2–4.
- **Decisions honored:** config-driven single app (T6), hosted in allone-website
  (`/b/[slug]`, T6), AI-drafted questions (T7). Pricing/offer come in Plan 2.
- **Next 16 gotcha:** route `params` is async — every handler/page `await`s it
  (T4, T5, T6). Don't revert to sync `params`.
- **RLS:** tables have RLS enabled with no policies; all access is via
  `createAdminClient()` server-side only — matches the existing security model.

```

```
