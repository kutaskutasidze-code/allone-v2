# Plan 2 — Answers → AI-Drafted Offer (human-approve gate)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]` checkboxes.

**Goal:** When a questionnaire bot's answers come in, let a salesperson click "Draft offer" on the lead → Claude drafts scope + a suggested price (grounded in past offers) → saved as an editable `proposals` draft → salesperson edits/approves → renders the offer PDF in the Tama format and stores it. Nothing is sent to the client (that's the email step, Plan 4-adjacent). Invoice + contract come in Plan 3.

**Architecture:** New `proposals` table in the sales Supabase. Offer _brain + PDF_ live in the existing `offer-generator` Fly service (it already has Anthropic + Puppeteer). New service endpoint `POST /api/offers/draft` (answers → structured offer JSON, no PDF) and `POST /api/offers/render` (approved offer JSON → PDF → Supabase Storage → returns URL). The CRM proxies both behind `requireSalesAuth()` exactly like `/api/admin/demos/*`. Price grounding = a static `PRICE_ANCHORS` constant ported from `reference_allone_pricing` (web 500–800₾, AI layer 400₾, migration 300₾, add-ons, monthly opex), passed into the Claude system prompt.

**Tech Stack:** offer-generator (Express + TS + Anthropic SDK `claude-opus-4-8` + Puppeteer, deployed Fly app `allone-offer-generator`), CRM (Next 16, Supabase service-role, `OFFER_API_URL`/`OFFER_API_KEY` already set).

**Depends on:** Plan 1 (`questionnaire_responses` table — live). The service is deployed & healthy.

---

## File Structure

- `supabase/migrations/20260617000000_proposals.sql` — proposals table (CRM DB).
- `offer-generator/src/offer/anchors.ts` — `PRICE_ANCHORS` constant + the offer JSON `OfferDraft` type.
- `offer-generator/src/offer/draft.ts` — `draftOffer(answers, clientName)` → `OfferDraft` via Claude.
- `offer-generator/src/offer/render.ts` — `renderOfferPdf(offer)` → Buffer (Puppeteer, Tama-format HTML).
- `offer-generator/src/offer/template.ts` — the Georgian offer HTML template (variables).
- `offer-generator/src/routes/offers.ts` — Express router: `POST /api/offers/draft`, `POST /api/offers/render`.
- `offer-generator/src/offer/draft.test.ts` — unit test for prompt assembly + JSON extraction (mock Anthropic).
- Modify `offer-generator/src/index.ts` — mount `offersRouter` after `apiKeyAuth`.
- `src/lib/offers/types.ts` (CRM) — shared `OfferDraft`/`Proposal` types.
- `src/lib/offers/repo.ts` (CRM) — proposals CRUD (service-role).
- `src/app/api/sales/proposals/route.ts` — `GET` list / `POST` create-from-response (proxies service `/draft`).
- `src/app/api/sales/proposals/[id]/route.ts` — `GET` one / `PATCH` edit scope+price.
- `src/app/api/sales/proposals/[id]/approve/route.ts` — `POST` approve → proxies service `/render`, stores `offer_pdf_url`, sets status.
- `src/app/sales/leads/[id]/...` — add a "Responses" + "Draft offer" affordance (discover the lead-detail file first).
- `src/app/sales/proposals/{page.tsx,ProposalsContent.tsx}` — review/edit/approve UI + sidebar entry in `src/lib/sales-nav.ts`.

---

## Task 1: `proposals` migration

**Files:** Create `supabase/migrations/20260617000000_proposals.sql`

- [ ] **Step 1: Write migration** (idempotent, RLS, service-role-only; mirrors `lead_payments` style)

```sql
-- AI-drafted commercial offers. One row per offer attempt for a lead.
-- scope/pricing live as jsonb; status walks draft -> approved -> sent.
CREATE TABLE IF NOT EXISTS proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  source_response_id uuid REFERENCES questionnaire_responses(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  doc_number text,
  language text NOT NULL DEFAULT 'ka',
  offer jsonb NOT NULL,            -- OfferDraft: summary, scope_lines[], price, currency, schedule[], timeline
  price numeric(12,2),             -- editable headline price (mirrors offer.price for querying)
  currency text NOT NULL DEFAULT 'GEL',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','sent')),
  offer_pdf_url text,
  created_by uuid REFERENCES sales_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_proposals_lead ON proposals(lead_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);

DROP TRIGGER IF EXISTS update_proposals_updated_at ON proposals;
CREATE TRIGGER update_proposals_updated_at
  BEFORE UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
```

- [ ] **Step 2: Apply via Supabase Management API** (the CLI login does NOT own `cywmdjldapzrnabsoosd`; the `equivalenza-supabase` Keychain PAT does):

```bash
PAT=$(security find-generic-password -s equivalenza-supabase -w)
SQL=$(cat supabase/migrations/20260617000000_proposals.sql)
curl -s -w "\n%{http_code}\n" -X POST \
  "https://api.supabase.com/v1/projects/cywmdjldapzrnabsoosd/database/query" \
  -H "Authorization: Bearer $PAT" -H "Content-Type: application/json" \
  --data "$(python3 -c "import json,sys;print(json.dumps({'query':sys.stdin.read()}))" <<< "$SQL")"
```

Expected: `[]` and HTTP `201`.

- [ ] **Step 3: Commit** `git add supabase/migrations/20260617000000_proposals.sql && git -c user.name="Allone Labs" -c user.email="team@allonelabs.com" commit -m "feat(offers): proposals table"`

---

## Task 2: Price anchors + offer types (service)

**Files:** Create `offer-generator/src/offer/anchors.ts`

- [ ] **Step 1: Write the constant + types** (numbers from `reference_allone_pricing`)

```ts
export interface OfferScopeLine {
  label: string;
  description: string;
  price: number;
}
export interface OfferStage {
  label: string;
  amount: number;
  when: string;
}
export interface OfferDraft {
  client_name: string;
  summary: string; // 2-4 Georgian sentences
  scope_lines: OfferScopeLine[];
  price: number; // total GEL
  currency: "GEL";
  schedule: OfferStage[]; // payment stages summing to price
  monthly_opex: string; // e.g. "100–200 ₾/თვე"
  timeline: string; // e.g. "4 სამუშაო კვირა"
  addons?: OfferScopeLine[]; // optional suggested extras
}

// Real anchors from past offers (GEL). Passed into the drafter prompt so the
// suggested price is grounded, not invented.
export const PRICE_ANCHORS = `
Web build: simple 5-page static ~500; full e-commerce rebuild ~800; full modernization+AI+workflow ~2000 (4x500 monthly).
Modular: full website 800; AI layer (chatbot + pgvector personalization + admin-agent) 400; catalog migration (~775 products) 300.
Add-ons: Stripe 300-400; Instagram Shop 250-400; Meta Pixel+Conversion API 200-300; blog (CMS+10 articles) 600-800; photo reshoot 800-1200.
Recurring: support 100-200/mo; infra opex ~7-200/mo.
Payment: advance/middle/final (e.g. 200/800/500) or equal monthly stages. Timeline ~4 working weeks for a full build.
`.trim();
```

- [ ] **Step 2: Typecheck** `cd offer-generator && npx tsc --noEmit` → no new errors. Commit with Task 3.

---

## Task 3: Offer drafter + test (service, TDD)

**Files:** Create `offer-generator/src/offer/draft.ts` + `offer-generator/src/offer/draft.test.ts`

- [ ] **Step 1: Inspect** `offer-generator/src/analyzer/index.ts` for the exact Anthropic client construction + model id already used in the service; reuse it (do NOT invent). Confirm model is `claude-opus-4-8`.

- [ ] **Step 2: Write the failing test** (mock Anthropic; assert `draftOffer` returns parsed `OfferDraft` and that scope prices sum to `price`)

```ts
import { describe, it, expect, vi } from "vitest";
vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = {
      create: async () => ({
        content: [
          {
            type: "text",
            text: '{"client_name":"Acme","summary":"ს","scope_lines":[{"label":"საიტი","description":"d","price":800}],"price":800,"currency":"GEL","schedule":[{"label":"წინასწარი","amount":800,"when":"ხელმოწერა"}],"monthly_opex":"100 ₾","timeline":"4 კვირა"}',
          },
        ],
      }),
    };
  },
}));
import { draftOffer } from "./draft";
describe("draftOffer", () => {
  it("parses the model JSON into an OfferDraft", async () => {
    const o = await draftOffer({ purpose: ["ვებსაიტი"] }, "Acme");
    expect(o.price).toBe(800);
    expect(o.scope_lines[0].label).toBe("საიტი");
  });
});
```

- [ ] **Step 3: Run → fail** `cd offer-generator && npx vitest run src/offer/draft.test.ts` → FAIL (no `draftOffer`).

- [ ] **Step 4: Implement** `draftOffer(answers: Record<string,unknown>, clientName: string): Promise<OfferDraft>` — build a system prompt embedding `PRICE_ANCHORS` and instructing: return ONLY JSON matching `OfferDraft`, Georgian text, suggested price grounded in the anchors, scope_lines summing to price, a sensible payment schedule. User message = `JSON.stringify(answers)` + clientName. Extract first `{`…last `}`, `JSON.parse`. Throw on parse failure.

- [ ] **Step 5: Run → pass.** **Step 6: Commit** `git add offer-generator/src/offer/anchors.ts offer-generator/src/offer/draft.ts offer-generator/src/offer/draft.test.ts && git -c user.name="Allone Labs" -c user.email="team@allonelabs.com" commit -m "feat(offers): grounded AI offer drafter + anchors"`

---

## Task 4: Offer PDF template + renderer (service)

**Files:** Create `offer-generator/src/offer/template.ts` + `offer-generator/src/offer/render.ts`

- [ ] **Step 1: Template** — `renderOfferHtml(offer: OfferDraft): string` returning a full HTML doc in the Tama offer format (Georgian, monochrome, Noto Sans Georgian + Geist via Google Fonts): cover (client name, doc number passed in offer or by caller), executive summary, scope table (scope_lines: label/description/price), investment table (total `price`), payment-schedule table (`schedule`), monthly opex, timeline, why-Allone + contact footer (`შპს „ოლუან"` for ka). Reuse the CSS approach from `~/Desktop/meta-chatbot-offer/offer.html` (already proven monochrome A4 print CSS).

- [ ] **Step 2: Renderer** — `renderOfferPdf(offer): Promise<Buffer>` launches Puppeteer (`config.demo`/existing `executablePath` from `config.ts`), sets the HTML, waits for fonts, `page.pdf({format:"A4", printBackground:true})`, returns the buffer. Add a NOTE: if Puppeteer chromium isn't in the Fly image, the Dockerfile must install it — verify against the existing Dockerfile (the service already lists `puppeteer` as a dep).

- [ ] **Step 3: Typecheck** `npx tsc --noEmit`. Commit `git add offer-generator/src/offer/template.ts offer-generator/src/offer/render.ts && git -c user.name="Allone Labs" -c user.email="team@allonelabs.com" commit -m "feat(offers): Georgian offer PDF template + Puppeteer renderer"`

---

## Task 5: Offer routes + Supabase Storage upload (service)

**Files:** Create `offer-generator/src/routes/offers.ts`; modify `offer-generator/src/index.ts`

- [ ] **Step 1: Find** how the service uploads to Supabase Storage (grep `notifier`/`deployer`/`database` for `.storage.from`); reuse the same supabase client + a bucket (create/confirm an `offers` bucket).

- [ ] **Step 2: Router** —
  - `POST /api/offers/draft` body `{answers, client_name}` → `draftOffer(...)` → `{offer}`.
  - `POST /api/offers/render` body `{offer, doc_number}` → `renderOfferPdf(offer)` → upload to `offers/<doc_number>.pdf` → `{pdf_url}` (public URL).
    Both behind the service's existing `apiKeyAuth` (mounted after it in index.ts).

- [ ] **Step 3: Mount** in `index.ts`: `import offersRouter from "./routes/offers.js"; app.use(offersRouter);` after `apiKeyAuth`.

- [ ] **Step 4: Build** `cd offer-generator && npx tsc --noEmit && pnpm build` (if it has a build). Commit `git add offer-generator/src/routes/offers.ts offer-generator/src/index.ts && git -c user.name="Allone Labs" -c user.email="team@allonelabs.com" commit -m "feat(offers): /api/offers draft + render routes"`

- [ ] **Step 5: Deploy the service** `cd offer-generator && export FLY_API_TOKEN=$(security find-generic-password -s fly-api-token -w) && fly deploy -a allone-offer-generator --regions fra`. Smoke: `curl -s -X POST https://allone-offer-generator.fly.dev/api/offers/draft -H "Authorization: Bearer $OFFER_KEY" -H 'Content-Type: application/json' -d '{"client_name":"Test","answers":{"purpose":["ვებსაიტი"]}}'` → returns `{offer:{...}}`.

---

## Task 6: CRM offer types + proposals repo

**Files:** Create `src/lib/offers/types.ts`, `src/lib/offers/repo.ts`

- [ ] **Step 1: Types** — mirror `OfferDraft` (Task 2) and add `Proposal {id, lead_id, source_response_id, client_name, doc_number, language, offer:OfferDraft, price, currency, status, offer_pdf_url, created_at}`.
- [ ] **Step 2: Repo** (service-role via `createAdminClient`): `listProposals(leadId?)`, `getProposal(id)`, `createProposal(input)`, `updateProposal(id, patch)`, and `nextDocNumber()` (e.g. `AL-2026-<seq>` — derive seq from count+offset; keep simple). Throw on error.
- [ ] **Step 3: Typecheck. Commit** `git add src/lib/offers && git -c user.name="Allone Labs" -c user.email="team@allonelabs.com" commit -m "feat(offers): CRM proposals types + repo"`

---

## Task 7: CRM proposal APIs (create-from-response, edit, approve)

**Files:** Create `src/app/api/sales/proposals/route.ts`, `[id]/route.ts`, `[id]/approve/route.ts`

- [ ] **Step 1:** `route.ts` — `GET` (list, `requireSalesAuth`) and `POST` `{response_id}`: load the response row, call the service `POST {OFFER_API_URL}/api/offers/draft` (Bearer `OFFER_API_KEY`) with its answers + client_name, then `createProposal({... offer, price: offer.price, status:'draft', doc_number: nextDocNumber()})`. Return `{proposal}`. (Reuse the exact proxy pattern from `src/app/api/admin/demos/route.ts`.)
- [ ] **Step 2:** `[id]/route.ts` — `GET` one; `PATCH` `{offer?, price?}` → `updateProposal` (only while status='draft').
- [ ] **Step 3:** `[id]/approve/route.ts` — `POST`: load proposal, call service `POST /api/offers/render` `{offer, doc_number}`, store `offer_pdf_url`, set `status='approved'`. Return `{proposal}`.
- [ ] **Step 4: Typecheck. Commit** `git add src/app/api/sales/proposals && git -c user.name="Allone Labs" -c user.email="team@allonelabs.com" commit -m "feat(offers): proposal create/edit/approve APIs"`

---

## Task 8: CRM UI — responses inbox + proposal review/approve

**Files:** Create `src/app/sales/proposals/{page.tsx,ProposalsContent.tsx}`; modify `src/lib/sales-nav.ts`; wire a "Draft offer" affordance on the lead detail page (discover its path first).

- [ ] **Step 1:** Add a "Proposals" entry to `src/lib/sales-nav.ts` (same shape as the "Bots" entry added in Plan 1).
- [ ] **Step 2:** `page.tsx` (server, auth like `sales/demos/page.tsx`) → `listProposals()` → `<ProposalsContent>`. Also fetch completed `questionnaire_responses` not yet turned into a proposal (an inbox), so the page shows "New answers → Draft offer".
- [ ] **Step 3:** `ProposalsContent.tsx` (`"use client"`, no `any`): list responses with a "Draft offer" button (POST `/api/sales/proposals` `{response_id}`); list proposals with editable price + scope, a "Save" (PATCH) and "Approve & generate PDF" (POST `[id]/approve`) button; after approve, show the `offer_pdf_url` link.
- [ ] **Step 4: Build** `NODE_OPTIONS="--max-old-space-size=2048" pnpm build`; manual smoke: insert a test response, draft → edit price → approve → open PDF. Commit `git add src/app/sales/proposals src/lib/sales-nav.ts && git -c user.name="Allone Labs" -c user.email="team@allonelabs.com" commit -m "feat(offers): proposals review/approve UI + responses inbox"`

---

## Self-Review notes

- **Spec coverage:** implements Component 2 (answers→offer drafter) + the approval gate's offer half from the design spec. Invoice + contract on approval = Plan 3.
- **Grounding:** price comes from real anchors (`reference_allone_pricing`), passed to the model — honors "AI suggests price, inferred from existing offers."
- **Reuse:** offer brain/PDF in the existing Fly service (Anthropic + Puppeteer already there); CRM proxies via the already-set `OFFER_API_URL`/`OFFER_API_KEY`, same pattern as demos.
- **Model:** `claude-opus-4-8` (current). Don't downgrade.
- **Migration:** apply via Management API + `equivalenza-supabase` PAT (CLI login can't reach `cywmdjldapzrnabsoosd`).
- **Branch + deploy:** do this on a feature branch (master auto-deploys). The service deploy (Task 5) is a real Fly redeploy — verify health after.
- **Risk flag:** confirm the Fly Dockerfile actually ships a Chromium Puppeteer can launch; if `renderOfferPdf` fails at runtime with "could not find browser," the Dockerfile needs a chromium install step — handle as a follow-up within Task 4/5 if the smoke test fails.

```

```
