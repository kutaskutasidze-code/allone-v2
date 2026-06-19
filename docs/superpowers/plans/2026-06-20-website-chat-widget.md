# Website Chat Widget → Self-Serve Offer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A chat widget on allonelabs.com that answers FAQ, runs the existing sales-bot intake, and hands the visitor an instant public offer link — reusing the allone-website bot + offer pipeline.

**Architecture:** Thin vanilla-JS widget in the static `allone-studio` site calls same-origin `/api/bots/allone-web/*`, which Vercel rewrites to `app.allonelabs.com`. The existing `/chat` route is extended to support an FAQ-aware, bilingual website bot (gated on a new `knowledge` field). A new `/self-offer` route auto-drafts + renders the offer via the offer-generator service and publishes it as a `sent` proposal, so the existing thread page renders it instantly.

**Tech Stack:** Next.js 16 App Router (allone-website, `pnpm`), Supabase (Postgres + Storage), offer-generator Express service on Fly, Resend email, static HTML + vanilla JS + Vercel rewrites (allone-studio).

## Global Constraints

- **allone-website package manager:** `pnpm` only — never `npm install` (desyncs lockfile, breaks Vercel). Run `pnpm build` before pushing.
- **TypeScript strict mode** — no `any` types.
- **Do not change existing live Georgian bots' behavior.** All website-bot changes in the shared `/chat` route MUST be gated on the new `knowledge` field being present, so bots without it take the exact existing code path.
- **Two repos:** backend changes in `/Users/macintoshi/projects/allone-website` (branch `feat/website-chat-widget`); widget changes in `/Users/macintoshi/Projects/allone-studio`.
- **Commit author for allone-website Vercel deploys:** commits that will deploy must be authored `team@allonelabs.com` (COMMIT_AUTHOR_REQUIRED). This plan's commits stay on a feature branch; the rule applies when merging to `master`.
- **Bot slug:** `allone-web`. **Doc-number series:** `AL-2026-NNN` (existing `nextDocNumber()`). **Proposal source tag:** `website-self-serve`.
- **Offer link returned to the visitor:** `https://app.allonelabs.com/b/allone-web/c/<response_id>` (existing thread page).

---

## File Structure

**allone-website (backend):**

- `supabase/migrations/20260620000000_website_bot.sql` — NEW: add `bot_configs.knowledge text`, `proposals.source text`, and `self_serve_rl` rate-limit table.
- `src/lib/bots/types.ts` — MODIFY: add `knowledge` to `BotConfig`.
- `src/lib/bots/website-prompt.ts` — NEW: FAQ-aware bilingual conversation + extraction prompt builders + contact schema.
- `src/app/api/bots/[slug]/chat/route.ts` — MODIFY: branch to website prompt + contact extraction when `cfg.knowledge` present.
- `src/lib/offers/repo.ts` — MODIFY: `createProposal`/`UpdateProposalPatch` carry `source`; add `countRecentSelfServe`/`logSelfServe`.
- `src/lib/offers/types.ts` — MODIFY: add `source` to `Proposal`/`CreateProposalInput`/`UpdateProposalPatch`.
- `src/lib/offers/self-offer.ts` — NEW: pure helper that extracts contact + builds the offer-link URL.
- `src/lib/email.ts` — MODIFY: add `sendSelfServeOfferNotice()`.
- `src/app/api/bots/[slug]/self-offer/route.ts` — NEW: the self-serve auto-offer endpoint.
- `scripts/seed-allone-web-bot.mjs` — NEW: upsert the `allone-web` bot_config row.

**allone-studio (widget):**

- `vercel.json` — MODIFY: add `/api/bots/:path*` rewrite to app.allonelabs.com.
- `css/chat-widget.css` — NEW: namespaced widget styles.
- `js/chat-widget.js` — NEW: the widget.
- `index.html`, `services/index.html`, `studio/index.html`, `work/index.html`, `contact/index.html`, `wings/index.html`, `careers/index.html` — MODIFY: include the widget before `</body>`.

---

## Task 1: Migration — knowledge column, source column, rate-limit table

**Files:**

- Create: `supabase/migrations/20260620000000_website_bot.sql`

**Interfaces:**

- Produces: `bot_configs.knowledge text` (nullable); `proposals.source text` (nullable); table `self_serve_rl(id uuid pk, ip text, created_at timestamptz default now())`.

- [ ] **Step 1: Write the migration**

```sql
-- Website self-serve bot: FAQ knowledge for the shared bot, a source tag on
-- proposals, and a tiny rate-limit log. Idempotent.

ALTER TABLE bot_configs   ADD COLUMN IF NOT EXISTS knowledge text;
ALTER TABLE proposals     ADD COLUMN IF NOT EXISTS source text;

CREATE TABLE IF NOT EXISTS self_serve_rl (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_self_serve_rl_ip_ts
  ON self_serve_rl(ip, created_at DESC);

ALTER TABLE self_serve_rl ENABLE ROW LEVEL SECURITY;
```

- [ ] **Step 2: Apply the migration to Supabase**

Apply via the project's normal migration path (the repo applies SQL through the Supabase Management API / `scripts/setup-db.mjs` flow; project ref `cywmdjldapzrnabsoosd`). If applying manually, run the SQL above in the Supabase SQL editor.

Run (verify columns exist):

```bash
cd /Users/macintoshi/projects/allone-website
node -e "import('./src/lib/supabase/admin.js').catch(()=>{})" 2>/dev/null; echo "apply via dashboard/mgmt-api; verify next"
```

Expected: `knowledge` and `source` columns present, `self_serve_rl` table present. Verify in the Supabase dashboard table view.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260620000000_website_bot.sql
git commit -m "feat(db): website-bot knowledge, proposal source, self-serve rate-limit"
```

---

## Task 2: BotConfig type carries `knowledge`

**Files:**

- Modify: `src/lib/bots/types.ts`
- Test: `src/lib/bots/types.test.ts` (create)

**Interfaces:**

- Consumes: existing `BotConfig`.
- Produces: `BotConfig.knowledge: string | null`.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/bots/types.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/bots/types.test.ts`
Expected: FAIL — `knowledge` not assignable / not a known property.

- [ ] **Step 3: Add the field**

In `src/lib/bots/types.ts`, add to the `BotConfig` interface after `created_at: string;`:

```ts
/** Optional FAQ/knowledge block. When present, the /chat route runs the
 *  FAQ-aware bilingual website bot instead of the Georgian intake bot. */
knowledge: string | null;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/bots/types.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/bots/types.ts src/lib/bots/types.test.ts
git commit -m "feat(bots): add optional knowledge field to BotConfig"
```

---

## Task 3: Website prompt builders (FAQ + bilingual + contact extraction)

**Files:**

- Create: `src/lib/bots/website-prompt.ts`
- Test: `src/lib/bots/website-prompt.test.ts`

**Interfaces:**

- Consumes: `BotQuestion[]` from `./types`.
- Produces:
  - `buildWebsiteConversationSystem(clientName: string, intro: string | null, knowledge: string, questions: BotQuestion[]): string`
  - `buildWebsiteExtractionSystem(questions: BotQuestion[]): string`
  - `buildWebsiteAnswersSchema(questions: BotQuestion[]): object` — adds `contact_name`, `contact_email`, `contact_phone` (all nullable strings) plus the existing asset keys.
  - `WEBSITE_COMPLETE_MARKER = "<<COMPLETE>>"` (re-exported for the route).

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/bots/website-prompt.test.ts
import { describe, it, expect } from "vitest";
import {
  buildWebsiteConversationSystem,
  buildWebsiteAnswersSchema,
} from "./website-prompt";
import type { BotQuestion } from "./types";

const QS: BotQuestion[] = [
  { id: "needs", text: "What do you need?", type: "text" },
];

describe("website prompt", () => {
  it("embeds the knowledge block and mandates contact before completion", () => {
    const sys = buildWebsiteConversationSystem(
      "ALLONE",
      null,
      "FAQ_SENTINEL",
      QS,
    );
    expect(sys).toContain("FAQ_SENTINEL");
    expect(sys).toContain("<<COMPLETE>>");
    // contact must be required before completing
    expect(sys.toLowerCase()).toContain("contact");
    // default-language guidance present (English-first, mirror visitor)
    expect(sys.toLowerCase()).toContain("english");
  });

  it("answers schema includes nullable contact fields", () => {
    const schema = buildWebsiteAnswersSchema(QS) as {
      properties: Record<string, { type: string; nullable?: boolean }>;
    };
    expect(schema.properties.contact_email).toEqual({
      type: "STRING",
      nullable: true,
    });
    expect(schema.properties.contact_name).toEqual({
      type: "STRING",
      nullable: true,
    });
    expect(schema.properties.contact_phone).toEqual({
      type: "STRING",
      nullable: true,
    });
    expect(schema.properties.needs).toEqual({ type: "STRING", nullable: true });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/bots/website-prompt.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/bots/website-prompt.ts
import type { BotQuestion } from "./types";

export const WEBSITE_COMPLETE_MARKER = "<<COMPLETE>>";

/**
 * Conversation system prompt for the public website bot. Unlike the Georgian
 * intake bot, this one (a) answers FAQ from `knowledge` first, (b) mirrors the
 * visitor's language defaulting to English, and (c) MUST capture contact details
 * before emitting the completion marker.
 */
export function buildWebsiteConversationSystem(
  clientName: string,
  intro: string | null,
  knowledge: string,
  questions: BotQuestion[],
): string {
  const optional = questions
    .map((q, i) => {
      const opts = q.options?.length ? ` (e.g.: ${q.options.join(" / ")})` : "";
      return `${i + 1}. ${q.text}${opts}`;
    })
    .join("\n");
  return [
    `You are the website assistant for ${clientName} (an AI/automation studio).`,
    intro ? `Context: ${intro}` : "",
    ``,
    `LANGUAGE: Reply in the visitor's language. Default to English; if the visitor`,
    `writes in Georgian, switch to clean Georgian (mxedruli). Mirror them per message.`,
    ``,
    `KNOWLEDGE — use this to answer questions about the company, services and process:`,
    knowledge,
    ``,
    `HOW TO BEHAVE:`,
    `- Greet once, in your first message only.`,
    `- Answer the visitor's questions helpfully and briefly using the knowledge above.`,
    `- One short question at a time — never a bulleted list of questions.`,
    `- When the visitor shows buying intent (wants a quote, a website, a bot, pricing,`,
    `  to start a project), smoothly move into intake and gather the core topics below.`,
    `- Do NOT name prices — the offer is generated for them at the end.`,
    ``,
    `CORE INTAKE TOPICS (gather naturally before completing):`,
    `- what they do and what they need (product/segment);`,
    `- the main functionality they want;`,
    `- budget and desired timeline;`,
    `- existing materials: website / social links / branding (logo, colors).`,
    ``,
    `CONTACT (MANDATORY — required before you finish):`,
    `- the visitor's name, and at least one of: email or phone number.`,
    `- If you are about to wrap up but have no contact email or phone yet, ASK for it`,
    `  first. Never emit the completion marker without a contact email or phone.`,
    ``,
    `OPTIONAL TOPICS (only if they fit naturally):`,
    optional,
    ``,
    `WRAP UP: once the core topics AND contact are captured, write one short closing`,
    `sentence (thank them; say their offer will appear here shortly), then on a NEW line`,
    `exactly "${WEBSITE_COMPLETE_MARKER}". Add nothing after the marker — no JSON.`,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Strict extractor: only what the visitor actually said; null otherwise. */
export function buildWebsiteExtractionSystem(questions: BotQuestion[]): string {
  const list = questions
    .map((q) => {
      const opts = q.options?.length
        ? ` — options (hint only): ${q.options.join(" / ")}`
        : "";
      return `[${q.id}] ${q.text}${opts}`;
    })
    .join("\n");
  return [
    `You are a data extractor. Below is an intake conversation between a visitor and`,
    `an assistant. Extract ONLY what the visitor actually said.`,
    ``,
    `Strict rules:`,
    `- If a topic was not discussed or not answered, return null (empty array [] for`,
    `  social_links).`,
    `- Never invent, never default, never snap to the nearest option.`,
    `- Keep the visitor's real, specific answer in their own words.`,
    `- Extract contact_name, contact_email, contact_phone if stated; null otherwise.`,
    ``,
    `Questions:`,
    list,
  ].join("\n");
}

/** Gemini responseSchema: each question id → nullable string + assets + contact. */
export function buildWebsiteAnswersSchema(questions: BotQuestion[]): object {
  const properties: Record<string, object> = {};
  for (const q of questions) {
    properties[q.id] = { type: "STRING", nullable: true };
  }
  properties.current_website = { type: "STRING", nullable: true };
  properties.social_links = { type: "ARRAY", items: { type: "STRING" } };
  properties.brand_assets = { type: "STRING", nullable: true };
  properties.business_description = { type: "STRING", nullable: true };
  properties.contact_name = { type: "STRING", nullable: true };
  properties.contact_email = { type: "STRING", nullable: true };
  properties.contact_phone = { type: "STRING", nullable: true };
  return { type: "OBJECT", properties };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/bots/website-prompt.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/bots/website-prompt.ts src/lib/bots/website-prompt.test.ts
git commit -m "feat(bots): FAQ-aware bilingual website prompt + contact extraction"
```

---

## Task 4: Wire the website prompt into the /chat route (gated on knowledge)

**Files:**

- Modify: `src/app/api/bots/[slug]/chat/route.ts`
- Test: `src/app/api/bots/[slug]/chat/route.test.ts` (create)

**Interfaces:**

- Consumes: `buildWebsiteConversationSystem`, `buildWebsiteExtractionSystem`, `buildWebsiteAnswersSchema` from `@/lib/bots/website-prompt`; `BotConfig.knowledge`.
- Produces: when `cfg.knowledge` is non-empty, the route uses the website conversation system, the website extraction system, and the website answers schema (with contact fields). When `cfg.knowledge` is null/empty, behavior is byte-for-byte the existing Georgian path.

- [ ] **Step 1: Write the failing test**

```ts
// src/app/api/bots/[slug]/chat/route.test.ts
import { describe, it, expect } from "vitest";
import { selectSystemPrompts } from "./route";
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run "src/app/api/bots/[slug]/chat/route.test.ts"`
Expected: FAIL — `selectSystemPrompts` not exported.

- [ ] **Step 3: Refactor the route to expose `selectSystemPrompts` and branch on knowledge**

In `src/app/api/bots/[slug]/chat/route.ts`:

Add the import near the top:

```ts
import {
  buildWebsiteConversationSystem,
  buildWebsiteExtractionSystem,
  buildWebsiteAnswersSchema,
} from "@/lib/bots/website-prompt";
```

Add this exported selector below the existing `buildAnswersSchema` function:

```ts
// Pick conversation + extraction prompts by bot type. A bot with a `knowledge`
// block is the public website bot (FAQ-aware, bilingual, contact-capturing);
// without it we keep the exact existing Georgian intake path.
export function selectSystemPrompts(cfg: {
  client_name: string;
  intro: string | null;
  knowledge: string | null;
  questions: BotQuestion[];
}): { conversation: string; extraction: string; schema: object } {
  const questions = cfg.questions ?? [];
  if (cfg.knowledge && cfg.knowledge.trim()) {
    return {
      conversation: buildWebsiteConversationSystem(
        cfg.client_name,
        cfg.intro,
        cfg.knowledge,
        questions,
      ),
      extraction: buildWebsiteExtractionSystem(questions),
      schema: buildWebsiteAnswersSchema(questions),
    };
  }
  return {
    conversation: buildConversationSystem(
      cfg.client_name,
      cfg.intro,
      questions,
    ),
    extraction: buildExtractionSystem(questions),
    schema: buildAnswersSchema(questions),
  };
}
```

Change `extractAnswers` to accept the chosen extraction system + schema instead of rebuilding them internally:

```ts
async function extractAnswers(
  messages: ChatMessage[],
  extractionSystem: string,
  schema: object,
): Promise<Record<string, unknown>> {
  const userText = `ტრანსკრიპტი:\n${transcriptOf(messages)}`;
  if (geminiConfigured()) {
    const out = await callGeminiStructured({
      system: extractionSystem,
      userText,
      schema,
    });
    return out as Record<string, unknown>;
  }
  const sys = `${extractionSystem}\n\nReturn ONLY a JSON object mapping each question id→answer or null, plus current_website, social_links, brand_assets, business_description, contact_name, contact_email, contact_phone. Nothing but JSON.`;
  const raw = await callBridge({
    system: sys,
    messages: [{ role: "user", content: userText }],
  });
  const js = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
  return JSON.parse(js) as Record<string, unknown>;
}
```

In `POST`, replace the prompt construction and extraction call. Find:

```ts
const questions = (cfg.questions as BotQuestion[]) ?? [];
const system = buildConversationSystem(cfg.client_name, cfg.intro, questions);
```

Replace with:

```ts
const questions = (cfg.questions as BotQuestion[]) ?? [];
const prompts = selectSystemPrompts({
  client_name: cfg.client_name,
  intro: cfg.intro,
  knowledge: cfg.knowledge ?? null,
  questions,
});
const system = prompts.conversation;
```

Find the extraction call:

```ts
answers = await extractAnswers(fullTranscript, questions);
```

Replace with:

```ts
answers = await extractAnswers(
  fullTranscript,
  prompts.extraction,
  prompts.schema,
);
```

(The `COMPLETE_MARKER` constant already equals `<<COMPLETE>>`, which the website prompt also emits — no change needed there.)

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run "src/app/api/bots/[slug]/chat/route.test.ts"`
Expected: PASS. Also run the website-prompt + types tests to confirm no regressions:
`pnpm vitest run src/lib/bots`
Expected: PASS

- [ ] **Step 5: Typecheck + commit**

```bash
pnpm exec tsc --noEmit
git add "src/app/api/bots/[slug]/chat/route.ts" "src/app/api/bots/[slug]/chat/route.test.ts"
git commit -m "feat(chat): branch to FAQ website bot when knowledge present"
```

Expected: tsc clean.

---

## Task 5: Proposal `source` tag + self-serve rate-limit helpers

**Files:**

- Modify: `src/lib/offers/types.ts`, `src/lib/offers/repo.ts`
- Test: `src/lib/offers/repo.source.test.ts` (create)

**Interfaces:**

- Consumes: existing `createProposal`, `updateProposal`, `createAdminClient`.
- Produces:
  - `CreateProposalInput.source?: string`, `UpdateProposalPatch.source?: string`, `Proposal.source?: string | null`.
  - `countRecentSelfServe(ip: string, sinceMs: number): Promise<number>` — count `self_serve_rl` rows for `ip` newer than `now - sinceMs`.
  - `logSelfServe(ip: string): Promise<void>` — insert one `self_serve_rl` row.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/offers/repo.source.test.ts
import { describe, it, expect } from "vitest";
import type { CreateProposalInput } from "./types";

describe("proposal source field", () => {
  it("CreateProposalInput accepts a source tag", () => {
    const input: CreateProposalInput = {
      lead_id: null,
      source_response_id: "r",
      client_name: "ALLONE",
      doc_number: "AL-2026-031",
      language: "en",
      offer: {
        client_name: "ALLONE",
        summary: "",
        scope_lines: [],
        price: 0,
        currency: "GEL",
        schedule: [],
        monthly_opex: "",
        timeline: "",
      },
      price: 0,
      currency: "GEL",
      status: "sent",
      created_by: null,
      source: "website-self-serve",
    };
    expect(input.source).toBe("website-self-serve");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/offers/repo.source.test.ts`
Expected: FAIL — `source` not a known property of `CreateProposalInput`.

- [ ] **Step 3: Add the field + helpers**

In `src/lib/offers/types.ts`:

- Add to `Proposal` (after `created_by`): `source?: string | null;`
- Add to `CreateProposalInput` (after `created_by`): `source?: string;`
- Add to `UpdateProposalPatch`: `source?: string;`

In `src/lib/offers/repo.ts`, append:

```ts
// ---------------------------------------------------------------------------
// Self-serve rate-limit log (table: self_serve_rl). Coarse abuse guard for the
// public auto-offer endpoint.
// ---------------------------------------------------------------------------

export async function countRecentSelfServe(
  ip: string,
  sinceMs: number,
): Promise<number> {
  const db = createAdminClient();
  const since = new Date(Date.now() - sinceMs).toISOString();
  const { count, error } = await db
    .from("self_serve_rl")
    .select("id", { count: "exact", head: true })
    .eq("ip", ip)
    .gte("created_at", since);
  if (error) throw error;
  return count ?? 0;
}

export async function logSelfServe(ip: string): Promise<void> {
  const db = createAdminClient();
  const { error } = await db.from("self_serve_rl").insert({ ip });
  if (error) throw error;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/offers/repo.source.test.ts`
Expected: PASS

- [ ] **Step 5: Typecheck + commit**

```bash
pnpm exec tsc --noEmit
git add src/lib/offers/types.ts src/lib/offers/repo.ts src/lib/offers/repo.source.test.ts
git commit -m "feat(offers): proposal source tag + self-serve rate-limit helpers"
```

---

## Task 6: Self-offer helper (contact extraction + link builder)

**Files:**

- Create: `src/lib/offers/self-offer.ts`
- Test: `src/lib/offers/self-offer.test.ts`

**Interfaces:**

- Produces:
  - `extractContact(answers: Record<string, unknown>): { name: string | null; email: string | null; phone: string | null }`
  - `hasContact(answers: Record<string, unknown>): boolean` — true if email OR phone present and non-empty.
  - `offerThreadUrl(slug: string, responseId: string): string` → `https://app.allonelabs.com/b/<slug>/c/<rid>` (uses `NEXT_PUBLIC_APP_ORIGIN` with that default).

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/offers/self-offer.test.ts
import { describe, it, expect } from "vitest";
import { extractContact, hasContact, offerThreadUrl } from "./self-offer";

describe("self-offer helpers", () => {
  it("extracts contact fields", () => {
    expect(
      extractContact({ contact_name: "Lika", contact_email: "a@b.com" }),
    ).toEqual({ name: "Lika", email: "a@b.com", phone: null });
  });
  it("hasContact requires email or phone", () => {
    expect(hasContact({ contact_name: "Lika" })).toBe(false);
    expect(hasContact({ contact_email: "a@b.com" })).toBe(true);
    expect(hasContact({ contact_phone: "+995..." })).toBe(true);
    expect(hasContact({ contact_email: "" })).toBe(false);
  });
  it("builds the thread url", () => {
    expect(offerThreadUrl("allone-web", "rid-1")).toBe(
      "https://app.allonelabs.com/b/allone-web/c/rid-1",
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/offers/self-offer.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/offers/self-offer.ts

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

export function extractContact(answers: Record<string, unknown>): {
  name: string | null;
  email: string | null;
  phone: string | null;
} {
  return {
    name: str(answers.contact_name) ?? str(answers.respondent),
    email: str(answers.contact_email),
    phone: str(answers.contact_phone),
  };
}

export function hasContact(answers: Record<string, unknown>): boolean {
  const c = extractContact(answers);
  return !!(c.email || c.phone);
}

export function offerThreadUrl(slug: string, responseId: string): string {
  const origin =
    process.env.NEXT_PUBLIC_APP_ORIGIN ?? "https://app.allonelabs.com";
  return `${origin}/b/${slug}/c/${responseId}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/offers/self-offer.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/offers/self-offer.ts src/lib/offers/self-offer.test.ts
git commit -m "feat(offers): self-offer contact + thread-url helpers"
```

---

## Task 7: Lead notification email

**Files:**

- Modify: `src/lib/email.ts`
- Test: `src/lib/email.selfserve.test.ts` (create)

**Interfaces:**

- Consumes: `process.env.RESEND_API_KEY`, `process.env.CONTACT_EMAIL` (default `info@allonelabs.com`).
- Produces: `sendSelfServeOfferNotice(args: { clientName: string; contactName: string | null; contactEmail: string | null; contactPhone: string | null; docNumber: string; price: number; offerUrl: string }): Promise<void>` — best-effort; logs and returns (never throws) when `RESEND_API_KEY` is unset or the API call fails.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/email.selfserve.test.ts
import { describe, it, expect } from "vitest";
import { sendSelfServeOfferNotice } from "./email";

describe("sendSelfServeOfferNotice", () => {
  it("resolves without throwing when RESEND_API_KEY is unset", async () => {
    const prev = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;
    await expect(
      sendSelfServeOfferNotice({
        clientName: "Acme",
        contactName: "Lika",
        contactEmail: "a@b.com",
        contactPhone: null,
        docNumber: "AL-2026-031",
        price: 1500,
        offerUrl: "https://app.allonelabs.com/b/allone-web/c/r1",
      }),
    ).resolves.toBeUndefined();
    if (prev) process.env.RESEND_API_KEY = prev;
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/email.selfserve.test.ts`
Expected: FAIL — `sendSelfServeOfferNotice` not exported.

- [ ] **Step 3: Implement**

Append to `src/lib/email.ts`:

```ts
interface SelfServeNotice {
  clientName: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  docNumber: string;
  price: number;
  offerUrl: string;
}

/**
 * Notify the team when an anonymous website visitor auto-generates an offer.
 * Best-effort: never throws — a notification failure must not fail the offer.
 */
export async function sendSelfServeOfferNotice(
  n: SelfServeNotice,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_EMAIL || "info@allonelabs.com";
  const from =
    process.env.SMTP_FROM || "ALLONE Website <onboarding@resend.dev>";
  if (!apiKey) {
    console.log(
      "[self-serve offer]",
      n.docNumber,
      n.offerUrl,
      n.contactEmail ?? n.contactPhone,
    );
    return;
  }
  const html = `
    <h2>New self-serve offer — ${n.docNumber}</h2>
    <p><strong>Client:</strong> ${n.clientName}</p>
    <p><strong>Contact:</strong> ${n.contactName ?? "—"} · ${n.contactEmail ?? "—"} · ${n.contactPhone ?? "—"}</p>
    <p><strong>Price:</strong> ${n.price} GEL</p>
    <p><a href="${n.offerUrl}">Open the offer thread →</a></p>
    <p style="color:#888">Auto-generated from allonelabs.com chat. Refine in /sales/proposals.</p>`;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        // Cloudflare in front of Resend rejects default runtime UAs (see memory).
        "User-Agent": "Mozilla/5.0 (compatible; AlloneBot/1.0)",
      },
      body: JSON.stringify({
        from,
        to,
        subject: `🌐 Self-serve offer ${n.docNumber} — ${n.clientName}`,
        html,
      }),
    });
    if (!res.ok)
      console.error(
        "[self-serve offer] resend failed",
        res.status,
        await res.text(),
      );
  } catch (err) {
    console.error("[self-serve offer] notify error", err);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/email.selfserve.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/email.ts src/lib/email.selfserve.test.ts
git commit -m "feat(email): team notice for self-serve auto-offers"
```

---

## Task 8: The `/self-offer` route

**Files:**

- Create: `src/app/api/bots/[slug]/self-offer/route.ts`
- Test: `src/app/api/bots/[slug]/self-offer/logic.test.ts`

**Interfaces:**

- Consumes: `getResponse` (`@/lib/bots/repo`), `getProposalByResponseId`, `createProposal`, `updateProposal`, `nextDocNumber`, `countRecentSelfServe`, `logSelfServe` (`@/lib/offers/repo`), `extractContact`, `hasContact`, `offerThreadUrl` (`@/lib/offers/self-offer`), `sendSelfServeOfferNotice` (`@/lib/email`), `OfferDraft` (`@/lib/offers/types`).
- Produces:
  - Exported pure guard `selfOfferGuard(args: { response: { bot_slug: string } | null; slug: string; answers: Record<string, unknown> }): { ok: true } | { ok: false; status: number; body: object }`.
  - `POST` handler: body `{ response_id }`. Returns `{ offer_url, pdf_url, doc_number }` on success; `{ needs_contact: true }` (422) when contact missing; `{ error, retriable }` (502) when the offer service is down; idempotent — a response that already has a proposal returns its existing link.
- Constants: `RL_WINDOW_MS = 3_600_000`, `RL_MAX = 5`.

- [ ] **Step 1: Write the failing test (pure guard)**

```ts
// src/app/api/bots/[slug]/self-offer/logic.test.ts
import { describe, it, expect } from "vitest";
import { selfOfferGuard } from "./route";

describe("selfOfferGuard", () => {
  it("404s when the response is missing", () => {
    const r = selfOfferGuard({
      response: null,
      slug: "allone-web",
      answers: {},
    });
    expect(r).toMatchObject({ ok: false, status: 404 });
  });
  it("404s when the response belongs to another bot", () => {
    const r = selfOfferGuard({
      response: { bot_slug: "other" },
      slug: "allone-web",
      answers: { contact_email: "a@b.com" },
    });
    expect(r).toMatchObject({ ok: false, status: 404 });
  });
  it("422 needs_contact when no email/phone", () => {
    const r = selfOfferGuard({
      response: { bot_slug: "allone-web" },
      slug: "allone-web",
      answers: { contact_name: "Lika" },
    });
    expect(r).toMatchObject({ ok: false, status: 422 });
    expect(
      (r as { body: { needs_contact?: boolean } }).body.needs_contact,
    ).toBe(true);
  });
  it("ok when slug matches and contact present", () => {
    const r = selfOfferGuard({
      response: { bot_slug: "allone-web" },
      slug: "allone-web",
      answers: { contact_phone: "+995" },
    });
    expect(r).toEqual({ ok: true });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run "src/app/api/bots/[slug]/self-offer/logic.test.ts"`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the route**

```ts
// src/app/api/bots/[slug]/self-offer/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getResponse } from "@/lib/bots/repo";
import {
  getProposalByResponseId,
  createProposal,
  updateProposal,
  nextDocNumber,
  countRecentSelfServe,
  logSelfServe,
} from "@/lib/offers/repo";
import {
  extractContact,
  hasContact,
  offerThreadUrl,
} from "@/lib/offers/self-offer";
import { sendSelfServeOfferNotice } from "@/lib/email";
import type { OfferDraft } from "@/lib/offers/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OFFER_API_URL = process.env.OFFER_API_URL ?? "http://localhost:3100";
const OFFER_API_KEY = process.env.OFFER_API_KEY ?? "";
const RL_WINDOW_MS = 3_600_000; // 1 hour
const RL_MAX = 5;

// Pure request guard — kept separate so it is unit-testable without a DB.
export function selfOfferGuard(args: {
  response: { bot_slug: string } | null;
  slug: string;
  answers: Record<string, unknown>;
}): { ok: true } | { ok: false; status: number; body: object } {
  const { response, slug, answers } = args;
  if (!response || response.bot_slug !== slug) {
    return { ok: false, status: 404, body: { error: "not found" } };
  }
  if (!hasContact(answers)) {
    return { ok: false, status: 422, body: { needs_contact: true } };
  }
  return { ok: true };
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  attempts = 3,
): Promise<Response> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(120_000),
      });
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 3000));
    }
  }
  throw lastErr;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  let body: { response_id?: unknown };
  try {
    body = (await req.json()) as { response_id?: unknown };
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  if (typeof body.response_id !== "string") {
    return NextResponse.json(
      { error: "response_id (string) required" },
      { status: 400 },
    );
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  // Idempotent: a response already turned into an offer just returns its link.
  const existing = await getProposalByResponseId(body.response_id);
  if (existing) {
    return NextResponse.json({
      offer_url: offerThreadUrl(slug, body.response_id),
      pdf_url: existing.offer_pdf_url,
      doc_number: existing.doc_number,
    });
  }

  // Coarse rate limit per IP.
  if ((await countRecentSelfServe(ip, RL_WINDOW_MS)) >= RL_MAX) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }

  const response = await getResponse(body.response_id);
  const answers = (response?.answers ?? {}) as Record<string, unknown>;
  const guard = selfOfferGuard({ response, slug, answers });
  if (!guard.ok) return NextResponse.json(guard.body, { status: guard.status });

  const contact = extractContact(answers);
  const client_name =
    response!.client_name ?? contact.name ?? "Website visitor";

  // 1. Draft the offer.
  let offer: OfferDraft;
  try {
    const res = await fetchWithRetry(`${OFFER_API_URL}/api/offers/draft`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OFFER_API_KEY}`,
      },
      body: JSON.stringify({ client_name, answers }),
    });
    if (!res.ok) throw new Error(`draft ${res.status}: ${await res.text()}`);
    offer = ((await res.json()) as { offer: OfferDraft }).offer;
    if (
      !offer ||
      typeof offer.price !== "number" ||
      !Array.isArray(offer.scope_lines)
    ) {
      throw new Error("malformed offer");
    }
  } catch {
    await logSelfServe(ip);
    return NextResponse.json(
      { error: "offer service unavailable", retriable: true },
      { status: 502 },
    );
  }

  const doc_number = await nextDocNumber();

  // 2. Create the proposal (draft), then render the PDF, then publish as sent.
  const proposal = await createProposal({
    lead_id: response!.lead_id,
    source_response_id: response!.id,
    client_name,
    doc_number,
    language: "en",
    offer,
    price: offer.price,
    currency: offer.currency ?? "GEL",
    status: "draft",
    created_by: null,
    source: "website-self-serve",
  });

  let pdf_url: string | null = null;
  try {
    const res = await fetchWithRetry(`${OFFER_API_URL}/api/offers/render`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OFFER_API_KEY}`,
      },
      body: JSON.stringify({ offer, doc_number }),
    });
    if (res.ok) pdf_url = ((await res.json()) as { pdf_url: string }).pdf_url;
  } catch {
    // Render failed — still publish the interactive offer; PDF can be regenerated.
  }

  await updateProposal(proposal.id, {
    status: "sent",
    source: "website-self-serve",
    ...(pdf_url ? { offer_pdf_url: pdf_url } : {}),
    chat_documents: pdf_url
      ? [{ kind: "offer", label: "Offer", url: pdf_url }]
      : [],
  });

  await logSelfServe(ip);

  const offer_url = offerThreadUrl(slug, response!.id);
  await sendSelfServeOfferNotice({
    clientName: client_name,
    contactName: contact.name,
    contactEmail: contact.email,
    contactPhone: contact.phone,
    docNumber: doc_number,
    price: offer.price,
    offerUrl: offer_url,
  });

  return NextResponse.json({ offer_url, pdf_url, doc_number });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run "src/app/api/bots/[slug]/self-offer/logic.test.ts"`
Expected: PASS

- [ ] **Step 5: Typecheck + commit**

```bash
pnpm exec tsc --noEmit
git add "src/app/api/bots/[slug]/self-offer/route.ts" "src/app/api/bots/[slug]/self-offer/logic.test.ts"
git commit -m "feat(bots): self-serve auto-offer endpoint"
```

Expected: tsc clean.

---

## Task 9: Seed the `allone-web` bot config

**Files:**

- Create: `scripts/seed-allone-web-bot.mjs`

**Interfaces:**

- Consumes: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` from `.env.local`.
- Produces: an upserted `bot_configs` row with `slug='allone-web'`, `language='en'`, a `knowledge` block, `intro`, and the intake `questions` (including contact prompts) so the website bot exists.

- [ ] **Step 1: Write the seed script**

```js
// scripts/seed-allone-web-bot.mjs
// Upsert the public website bot. Run: node scripts/seed-allone-web-bot.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

// Load .env.local without extra deps
for (const line of readFileSync(
  new URL("../.env.local", import.meta.url),
  "utf8",
).split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]])
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("missing Supabase env");
const db = createClient(url, key);

const KNOWLEDGE = `
ALLONE (Allone Labs, Tbilisi) builds AI-powered business systems: websites,
chatbots, sales/CRM automation, and workflow automation. We design, build, and
deploy — typical web projects start around a few hundred GEL and scale with
scope; we add AI layers, migrations, and integrations as needed. Process:
discovery → proposal → build → launch. We work in Georgian and English.
We do not quote a final price in chat — every visitor gets a tailored offer
generated at the end of this conversation.
`.trim();

const QUESTIONS = [
  {
    id: "needs",
    text: "What do you need (website, chatbot, automation, other)?",
    type: "text",
  },
  { id: "features", text: "Which features matter most to you?", type: "text" },
  {
    id: "budget",
    text: "What budget and timeline are you working with?",
    type: "text",
  },
  {
    id: "assets",
    text: "Do you have an existing website, socials, or branding?",
    type: "text",
  },
  {
    id: "contact",
    text: "What's your name and the best email or phone to reach you?",
    type: "text",
  },
];

const row = {
  slug: "allone-web",
  client_name: "ALLONE",
  title: "ALLONE — website assistant",
  intro:
    "Hi! I'm ALLONE's assistant. Ask me anything about what we build, or tell me about your project and I'll prepare an offer for you right here.",
  language: "en",
  questions: QUESTIONS,
  knowledge: KNOWLEDGE,
  lead_id: null,
  active: true,
};

const { error } = await db
  .from("bot_configs")
  .upsert(row, { onConflict: "slug" });
if (error) throw error;
console.log("seeded bot_configs slug=allone-web");
```

- [ ] **Step 2: Run the seed**

Run:

```bash
cd /Users/macintoshi/projects/allone-website && node scripts/seed-allone-web-bot.mjs
```

Expected: prints `seeded bot_configs slug=allone-web`.

- [ ] **Step 3: Verify the bot answers (smoke)**

Run (against the deployed app or `pnpm dev` on :3001):

```bash
curl -s -X POST http://localhost:3001/api/bots/allone-web/chat \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"What does Allone do?"}]}' | head -c 400
```

Expected: JSON `{ "reply": "...English answer about Allone...", "complete": false }`.

- [ ] **Step 4: Commit**

```bash
git add scripts/seed-allone-web-bot.mjs
git commit -m "feat(bots): seed script for the allone-web website bot"
```

---

## Task 10: allone-studio — rewrite proxy for /api/bots

**Files:**

- Modify: `/Users/macintoshi/Projects/allone-studio/vercel.json`

**Interfaces:**

- Produces: same-origin `/api/bots/*` on allonelabs.com proxied to `https://app.allonelabs.com/api/bots/*`.

- [ ] **Step 1: Add the rewrite**

In `/Users/macintoshi/Projects/allone-studio/vercel.json`, add to the `rewrites` array (before or after the careers entry):

```json
{
  "source": "/api/bots/:path*",
  "destination": "https://app.allonelabs.com/api/bots/:path*"
}
```

Resulting `rewrites`:

```json
  "rewrites": [
    {
      "source": "/api/careers/:path*",
      "destination": "https://app.allonelabs.com/api/careers/:path*"
    },
    {
      "source": "/api/bots/:path*",
      "destination": "https://app.allonelabs.com/api/bots/:path*"
    }
  ],
```

- [ ] **Step 2: Commit (in allone-studio)**

```bash
cd /Users/macintoshi/Projects/allone-studio
git add vercel.json
git commit -m "feat: proxy /api/bots/* to app.allonelabs.com for chat widget"
```

---

## Task 11: allone-studio — widget CSS

**Files:**

- Create: `/Users/macintoshi/Projects/allone-studio/css/chat-widget.css`

**Interfaces:**

- Produces: namespaced `.alo-*` styles. Angular (no radius), monochrome, `#2776EA` accent. Fixed launcher bottom-right; panel above it.

- [ ] **Step 1: Write the CSS**

```css
/* ALLONE chat widget — angular, monochrome, #2776EA. All selectors namespaced
   with .alo- so the host site's resets don't fight the widget. */
.alo-root {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 2147483000;
  font-family:
    "Geist",
    system-ui,
    -apple-system,
    "Segoe UI",
    sans-serif;
  color: #0c1016;
}
.alo-launcher {
  width: 56px;
  height: 56px;
  background: #2776ea;
  color: #fff;
  border: 0;
  border-radius: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
  font-size: 22px;
  transition:
    transform 0.2s,
    filter 0.2s;
}
.alo-launcher:hover {
  filter: brightness(1.06);
  transform: translateY(-2px);
}
.alo-panel {
  position: absolute;
  right: 0;
  bottom: 70px;
  width: min(380px, 92vw);
  height: min(560px, 76vh);
  background: #fff;
  border: 1.5px solid #0c1016;
  display: none;
  flex-direction: column;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
}
.alo-root.alo-open .alo-panel {
  display: flex;
}
.alo-head {
  background: #0c1016;
  color: #f0f6f8;
  padding: 14px 16px;
  font-family: "Space Grotesk", "Geist", sans-serif;
  font-weight: 700;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.alo-close {
  background: transparent;
  border: 0;
  color: #f0f6f8;
  font-size: 20px;
  cursor: pointer;
  line-height: 1;
}
.alo-msgs {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.alo-msg {
  max-width: 85%;
  padding: 9px 12px;
  font-size: 14px;
  line-height: 1.5;
  border: 1.5px solid #0c1016;
  white-space: pre-wrap;
}
.alo-msg.bot {
  align-self: flex-start;
  background: #fff;
  color: #0c1016;
}
.alo-msg.user {
  align-self: flex-end;
  background: #2776ea;
  color: #fff;
  border-color: #2776ea;
}
.alo-msg.offer {
  align-self: stretch;
  background: #0c1016;
  color: #f0f6f8;
  border-color: #0c1016;
}
.alo-msg.offer a {
  color: #97cce8;
  font-weight: 700;
}
.alo-typing {
  align-self: flex-start;
  font-size: 13px;
  color: #6b7785;
}
.alo-form {
  display: flex;
  gap: 8px;
  border-top: 1.5px solid #0c1016;
  padding: 10px;
}
.alo-input {
  flex: 1;
  border: 1.5px solid #0c1016;
  border-radius: 0;
  padding: 9px 10px;
  font-size: 14px;
  outline: none;
  background: #fff;
  color: #0c1016;
  min-width: 0;
}
.alo-input:focus {
  border-color: #2776ea;
}
.alo-send {
  background: #2776ea;
  color: #fff;
  border: 0;
  border-radius: 0;
  padding: 0 16px;
  font-weight: 600;
  cursor: pointer;
}
.alo-send:disabled {
  opacity: 0.5;
  cursor: default;
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/macintoshi/Projects/allone-studio
git add css/chat-widget.css
git commit -m "feat: chat widget styles (angular monochrome, #2776EA)"
```

---

## Task 12: allone-studio — widget JS

**Files:**

- Create: `/Users/macintoshi/Projects/allone-studio/js/chat-widget.js`

**Interfaces:**

- Consumes: same-origin `/api/bots/allone-web/chat`, `/submit`, `/self-offer`.
- Produces: a self-contained IIFE that injects the launcher + panel, runs the conversation, and shows the offer link. Bot slug from `window.ALO_CHAT?.slug ?? "allone-web"`.

- [ ] **Step 1: Write the widget**

```js
/* ALLONE website chat widget. Mirrors the bot thread flow:
   /chat per turn → on complete /submit → /self-offer → show offer link. */
(function () {
  var SLUG = (window.ALO_CHAT && window.ALO_CHAT.slug) || "allone-web";
  var BASE = "/api/bots/" + SLUG;
  var SEED =
    "(visitor opened the chat — greet me and ask your first question.)";
  var messages = [{ role: "user", content: SEED }];
  var busy = false,
    started = false;

  var root = document.createElement("div");
  root.className = "alo-root";
  root.innerHTML =
    '<button class="alo-launcher" aria-label="Chat with ALLONE">💬</button>' +
    '<div class="alo-panel" role="dialog" aria-label="ALLONE chat">' +
    '<div class="alo-head"><span>ALLONE</span><button class="alo-close" aria-label="Close">×</button></div>' +
    '<div class="alo-msgs"></div>' +
    '<form class="alo-form"><input class="alo-input" placeholder="Type a message…" autocomplete="off"/>' +
    '<button class="alo-send" type="submit">Send</button></form>' +
    "</div>";
  document.body.appendChild(root);

  var msgs = root.querySelector(".alo-msgs");
  var form = root.querySelector(".alo-form");
  var input = root.querySelector(".alo-input");
  var sendBtn = root.querySelector(".alo-send");

  function add(text, kind) {
    var el = document.createElement("div");
    el.className = "alo-msg " + kind;
    if (kind === "offer") el.innerHTML = text;
    else el.textContent = text;
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
    return el;
  }
  function typing(on) {
    var t = msgs.querySelector(".alo-typing");
    if (on && !t) {
      t = document.createElement("div");
      t.className = "alo-typing";
      t.textContent = "…";
      msgs.appendChild(t);
      msgs.scrollTop = msgs.scrollHeight;
    }
    if (!on && t) t.remove();
  }
  function setBusy(b) {
    busy = b;
    sendBtn.disabled = b;
    input.disabled = b;
  }

  async function post(path, body) {
    var res = await fetch(BASE + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return {
      ok: res.ok,
      status: res.status,
      data: await res.json().catch(function () {
        return {};
      }),
    };
  }

  async function turn() {
    setBusy(true);
    typing(true);
    try {
      var r = await post("/chat", { messages: messages });
      typing(false);
      if (!r.ok) {
        add("Sorry — something went wrong. Please try again.", "bot");
        return;
      }
      var reply = r.data.reply || "";
      messages.push({ role: "assistant", content: reply });
      add(reply, "bot");
      if (r.data.complete && r.data.answers) await finish(r.data.answers);
    } catch (e) {
      typing(false);
      add("Network issue — please try again.", "bot");
    } finally {
      setBusy(false);
      input.focus();
    }
  }

  async function finish(answers) {
    var sub = await post("/submit", { answers: answers });
    if (!sub.ok || !sub.data.response_id) {
      add("We've got your details and will email your offer shortly.", "bot");
      return;
    }
    var off = await post("/self-offer", { response_id: sub.data.response_id });
    if (off.ok && off.data.offer_url) {
      add(
        'Your offer is ready 🎉 <a href="' +
          off.data.offer_url +
          '" target="_blank" rel="noopener">View your offer →</a>',
        "offer",
      );
    } else if (off.status === 422 && off.data.needs_contact) {
      add(
        "Before I prepare your offer — what's the best email or phone to reach you?",
        "bot",
      );
    } else {
      add("We've got your details and will email your offer shortly.", "bot");
    }
  }

  function open() {
    root.classList.add("alo-open");
    if (!started) {
      started = true;
      turn();
    } // seed → bot greeting
    input.focus();
  }
  root.querySelector(".alo-launcher").addEventListener("click", function () {
    root.classList.contains("alo-open")
      ? root.classList.remove("alo-open")
      : open();
  });
  root.querySelector(".alo-close").addEventListener("click", function () {
    root.classList.remove("alo-open");
  });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text || busy) return;
    input.value = "";
    messages.push({ role: "user", content: text });
    add(text, "user");
    turn();
  });
})();
```

- [ ] **Step 2: Commit**

```bash
cd /Users/macintoshi/Projects/allone-studio
git add js/chat-widget.js
git commit -m "feat: chat widget script (FAQ → intake → offer link)"
```

---

## Task 13: allone-studio — include the widget on all pages

**Files:**

- Modify: `index.html`, `services/index.html`, `studio/index.html`, `work/index.html`, `contact/index.html`, `wings/index.html`, `careers/index.html`

**Interfaces:**

- Produces: every page loads `chat-widget.css` + `chat-widget.js` and the widget mounts.

- [ ] **Step 1: Inject the include before `</body>` on every page**

Run (from the allone-studio root) — inserts the two tags immediately before the closing `</body></html>` on each HTML file, idempotently:

```bash
cd /Users/macintoshi/Projects/allone-studio
INCLUDE='<link rel="stylesheet" href="/css/chat-widget.css"><script src="/js/chat-widget.js" defer></script>'
for f in index.html services/index.html studio/index.html work/index.html contact/index.html wings/index.html careers/index.html; do
  if ! grep -q "chat-widget.js" "$f"; then
    perl -0pi -e "s{</body></html>}{$ENV{INCLUDE}</body></html>}" "$f"
    echo "patched $f"
  else
    echo "skip $f (already has widget)"
  fi
done
```

(Export the var so perl sees it: `export INCLUDE` before the loop, or inline — adjust as needed for your shell.)

Expected: `patched …` for each of the 7 files.

- [ ] **Step 2: Verify the include landed**

Run:

```bash
grep -c "chat-widget.js" index.html services/index.html studio/index.html work/index.html contact/index.html wings/index.html careers/index.html
```

Expected: each file reports `1`.

- [ ] **Step 3: Commit**

```bash
git add index.html services/index.html studio/index.html work/index.html contact/index.html wings/index.html careers/index.html
git commit -m "feat: mount chat widget on all pages"
```

---

## Task 14: End-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Build allone-website**

Run:

```bash
cd /Users/macintoshi/projects/allone-website && pnpm build
```

Expected: build succeeds, no type errors.

- [ ] **Step 2: Run the full test suite for touched areas**

Run:

```bash
pnpm vitest run src/lib/bots src/lib/offers src/lib/email.selfserve.test.ts "src/app/api/bots/[slug]"
```

Expected: all PASS.

- [ ] **Step 3: Live chat smoke (deployed app or dev)**

With the `allone-web` bot seeded, drive a full conversation and confirm completion returns an offer. Run:

```bash
# Simulate "enough info + contact" so the bot completes (may take a couple turns):
curl -s -X POST https://app.allonelabs.com/api/bots/allone-web/chat \
  -H 'Content-Type: application/json' \
  -d '{"messages":[
    {"role":"user","content":"(visitor opened the chat — greet me and ask your first question.)"},
    {"role":"user","content":"I need a website and a chatbot for my cafe. Budget ~1500 GEL, 3 weeks. No site yet. My name is Lika, email lika@example.com. That is all."}
  ]}' | head -c 600
```

Expected: JSON with `"complete": true` and an `answers` object containing `contact_email`.

- [ ] **Step 4: Self-offer smoke**

Take a `response_id` (submit the answers from Step 3 to `/submit`), then:

```bash
curl -s -X POST https://app.allonelabs.com/api/bots/allone-web/self-offer \
  -H 'Content-Type: application/json' -d '{"response_id":"<rid>"}'
```

Expected: `{ "offer_url": "https://app.allonelabs.com/b/allone-web/c/<rid>", "pdf_url": "...", "doc_number": "AL-2026-0NN" }`. Opening `offer_url` shows the rendered offer.

- [ ] **Step 5: Widget smoke on the static site**

Run `vercel dev` (or deploy a preview) for allone-studio, open the page, click the launcher, hold a short conversation, and confirm the "View your offer →" link appears and opens the thread.

- [ ] **Step 6: Confirm the team notice**

Check that `info@allonelabs.com` (or `CONTACT_EMAIL`) received the "Self-serve offer AL-2026-0NN" email, and that `/sales/proposals` shows the new proposal tagged `website-self-serve`.

---

## Notes on env vars (must exist on app.allonelabs.com / allone-perf Vercel project)

These already power the existing CRM offer flow; confirm present (per "Vercel env vars are per-project"):
`OFFER_API_URL`, `OFFER_API_KEY`, `GEMINI_API_KEY` (+ rotations), `CLAUDE_BRIDGE_URL`, `CLAUDE_BRIDGE_TOKEN`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `CONTACT_EMAIL`/`SMTP_FROM`. New (optional): `NEXT_PUBLIC_APP_ORIGIN` (defaults to `https://app.allonelabs.com`).
