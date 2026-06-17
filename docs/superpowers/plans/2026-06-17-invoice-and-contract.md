# Plan 3 — Invoice + Contract PDFs on Approval

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]` checkboxes.

**Goal:** When a `proposal` is approved, let the salesperson generate the **service contract** (მომსახურების ხელშეკრულება) and **payment invoice** (ინვოისი) as Georgian PDFs in the firm's existing formats, store them, and seed `lead_payments` from the offer's payment schedule. No LLM — pure templated renders from the proposal's structured data + the fixed issuer details.

**Architecture:** Two new pure renderers in the offer-generator service (`src/docs/contract-template.ts`, `src/docs/invoice-template.ts`) + a route `POST /api/docs/generate` `{proposal}` → renders both PDFs (reusing the existing Puppeteer path), uploads to Supabase Storage, returns `{contract_pdf_url, invoice_pdf_url}`. Issuer block auto-filled from a fixed `ISSUER` constant (ka „ოლუან"/en AllOne, ID 405826361, BoG IBAN GE82BG0000000612104254, dir. ნინო მესხიძე). CRM: add `contract_pdf_url`/`invoice_pdf_url` columns to `proposals`, a "Generate contract + invoice" action on approved proposals that proxies the service, stores the URLs, and seeds `lead_payments`.

**Tech Stack:** offer-generator (Express+TS+Puppeteer, deployed Fly), CRM (Next 16, Supabase service-role, `OFFER_API_URL`/`OFFER_API_KEY` set).

**Depends on:** Plan 2 (`proposals` table + `OfferDraft` shape — live). NOT blocked by the claude-bridge (no LLM here).

**Source formats (real PDFs, already inspected):**

- Invoice: doc# `AL-2026-NNN-INV`; sections — issuer/recipient block → service table (#, მომსახურება, ღირებულება ₾) → payment schedule (ეტაპი, აღწერა, თანხა, ვადა) → 4 terms (უნაღდო ანგარიშსწორება; გადასახადები შემსრულებელს; ინვოისი = ხელშეკრულების ნაწილი; მიღება-ჩაბარების აქტი) → signature blocks → footer "მომზადდა Allone Labs-ის მიერ".
- Contract: doc# `N<dd/mm/yyyy>-n`; 9 sections — 1 საგანი, 2 ღირებულება და ანგარიშსწორება (staged), 3 უფლება-მოვალეობები, 4 პასუხისმგებლობა, 5 კონფიდენციალურობა, 6 დავათა გადაწყვეტა, 7 ფორს-მაჟორი, 8 მოქმედება და შეწყვეტა, 9 დასკვნითი — + დამკვეთი/შემსრულებელი signature blocks (executor = „ოლუან" full details).

---

## File Structure

- `supabase/migrations/20260617020000_proposals_doc_urls.sql` — add `contract_pdf_url`, `invoice_pdf_url`, `recipient` jsonb to `proposals`.
- `offer-generator/src/docs/issuer.ts` — `ISSUER` constant (ka/en names + ID/IBAN/director/address).
- `offer-generator/src/docs/invoice-template.ts` — `renderInvoiceHtml(proposal, recipient)`.
- `offer-generator/src/docs/contract-template.ts` — `renderContractHtml(proposal, recipient, dateISO)` (embeds the fixed 9-section GE legal boilerplate with variables).
- `offer-generator/src/docs/render.ts` — `htmlToPdf(html): Promise<Buffer>` (extract/reuse the Puppeteer launch already in `src/offer/render.ts`; if trivial, import that helper instead of duplicating).
- `offer-generator/src/routes/docs.ts` — `POST /api/docs/generate`.
- Modify `offer-generator/src/index.ts` — mount `docsRouter`.
- `src/lib/offers/repo.ts` — extend `updateProposal` patch type with the new url fields (already generic) + a `seedPaymentsFromSchedule(leadId, schedule)` helper.
- `src/app/api/sales/proposals/[id]/documents/route.ts` — `POST` → proxy service, store urls, seed payments.
- `src/app/sales/proposals/ProposalsContent.tsx` — add a "Generate contract + invoice" button on approved proposals + show the two PDF links + a recipient (client legal details) mini-form.

---

## Task 1: Migration — proposal doc URLs + recipient

**Files:** Create `supabase/migrations/20260617020000_proposals_doc_urls.sql`

- [ ] **Step 1: Write**

```sql
ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS contract_pdf_url text,
  ADD COLUMN IF NOT EXISTS invoice_pdf_url text,
  ADD COLUMN IF NOT EXISTS recipient jsonb;  -- {name, id_code, address, representative}
```

- [ ] **Step 2: Apply via Management API** (CLI login can't reach `cywmdjldapzrnabsoosd`; use the `equivalenza-supabase` Keychain PAT):

```bash
PAT=$(security find-generic-password -s equivalenza-supabase -w)
SQL=$(cat supabase/migrations/20260617020000_proposals_doc_urls.sql)
curl -s -w "\n%{http_code}\n" -X POST \
  "https://api.supabase.com/v1/projects/cywmdjldapzrnabsoosd/database/query" \
  -H "Authorization: Bearer $PAT" -H "Content-Type: application/json" \
  --data "$(python3 -c "import json,sys;print(json.dumps({'query':sys.stdin.read()}))" <<< "$SQL")"
# then reload PostgREST cache:
curl -s -X POST "https://api.supabase.com/v1/projects/cywmdjldapzrnabsoosd/database/query" \
  -H "Authorization: Bearer $PAT" -H "Content-Type: application/json" \
  --data '{"query":"NOTIFY pgrst, '"'"'reload schema'"'"';"}'
```

Expected: `[]` + `201`.

- [ ] **Step 3: Commit** `git add supabase/migrations/20260617020000_proposals_doc_urls.sql && git -c user.name="Allone Labs" -c user.email="team@allonelabs.com" commit -m "feat(docs): proposals contract/invoice url + recipient columns"`

---

## Task 2: Issuer constant (service)

**Files:** Create `offer-generator/src/docs/issuer.ts`

- [ ] **Step 1: Write** (from `reference_oluan_bank`; name localizes by language)

```ts
export interface Recipient {
  name: string;
  id_code?: string;
  address?: string;
  representative?: string;
}

export const ISSUER = {
  name_ka: 'შპს „ოლუან"',
  name_en: "AllOne",
  id_code: "405826361",
  address_ka: "საქართველო, თბილისი, რაიონი საბურთალო, ტაშკენტის ქ. N 10ა ბ. 6ა",
  director: "ნინო მესხიძე",
  bank: 'სს „საქართველოს ბანკი"',
  iban: "GE82BG0000000612104254",
  email: "luka.adamia@allonelabs.com",
  website: "allone.ge",
} as const;

export function issuerName(language: string): string {
  return language === "en" ? ISSUER.name_en : ISSUER.name_ka;
}
```

- [ ] **Step 2: Typecheck `npx tsc --noEmit`. Commit with Task 4.**

---

## Task 3: Render helper (service)

**Files:** Modify `offer-generator/src/offer/render.ts` to export a reusable `htmlToPdf(html: string): Promise<Buffer>`; create `offer-generator/src/docs/render.ts` re-exporting it (or import directly).

- [ ] **Step 1:** Open `src/offer/render.ts`. If `renderOfferPdf` already wraps a generic "launch puppeteer → setContent → wait fonts → page.pdf" sequence, extract that into an exported `htmlToPdf(html)` and have `renderOfferPdf` call it. Reuse `config.puppeteer.executablePath`, `waitUntil:"load"` + `document.fonts.ready`, `{format:"A4", printBackground:true}`.
- [ ] **Step 2:** `src/docs/render.ts`: `export { htmlToPdf } from "../offer/render.js";`
- [ ] **Step 3: Typecheck. Commit with Task 4.**

---

## Task 4: Invoice + contract templates (service)

**Files:** Create `offer-generator/src/docs/invoice-template.ts`, `offer-generator/src/docs/contract-template.ts`

- [ ] **Step 1: Invoice** — `renderInvoiceHtml(proposal: ProposalLike, recipient: Recipient): string`. `ProposalLike = {client_name, doc_number, language, offer: OfferDraft, recipient?}`. Layout = the real invoice format: header (`ინვოისი / INVOICE`, number `${doc_number}-INV`, issue date, first-payment due), issuer block (`issuerName(lang)`, ID, address, director, bank, IBAN, email/site from `ISSUER`), recipient block (`recipient.name`, id_code, address, representative — blanks render as `____`), service table from `offer.scope_lines` (#, label+description, price ₾) with total = `offer.price`, payment schedule table from `offer.schedule` (ეტაპი/აღწერა/თანხა/ვადა), the 4 fixed terms, signature blocks (issuer = ოლუან details; recipient = client), footer "მომზადდა Allone Labs-ის მიერ". Monochrome A4 print CSS + Noto Sans Georgian + Geist (reuse the offer template's CSS approach).
- [ ] **Step 2: Contract** — `renderContractHtml(proposal, recipient, dateLabel): string`. Title `მომსახურების ხელშეკრულება N<doc_number>`, place/date line, parties paragraph (დამკვეთი = `recipient.name` (+id_code); შემსრულებელი = `issuerName(lang)` ს/კ 405826361, dir ნინო მესხიძე). Then the **fixed 9-section Georgian legal boilerplate** — copy the section text verbatim from the reference contract (`~/Desktop/გიორგი მიქელაძე — მომსახურების ხელშეკრულება.pdf`, already inspected): §1 საგანი (inject scope: list `offer.scope_lines` labels/descriptions + `offer.timeline` as the deadline), §2 ღირებულება (inject `offer.price` in words+digits + `offer.schedule` as the staged payments), §3–§9 standard text, then signature blocks (full ოლუან executor details incl. bank/IBAN). Keep §3–9 as static constants.
- [ ] **Step 3: Typecheck `npx tsc --noEmit`. Build `pnpm build`. Commit** `git add offer-generator/src/docs offer-generator/src/offer/render.ts && git -c user.name="Allone Labs" -c user.email="team@allonelabs.com" commit -m "feat(docs): Georgian invoice + contract templates + issuer + render helper"`

---

## Task 5: Docs route + mount (service)

**Files:** Create `offer-generator/src/routes/docs.ts`; modify `offer-generator/src/index.ts`

- [ ] **Step 1: Router** — `POST /api/docs/generate` body `{proposal, recipient, date_label}` (proposal carries `doc_number`, `language`, `offer`, `client_name`). Render both HTMLs → `htmlToPdf` → upload to Storage `offers` bucket at `contracts/<doc_number>.pdf` and `invoices/<doc_number>-INV.pdf` (reuse the storage client from the offers route). Return `{contract_pdf_url, invoice_pdf_url}`. Behind the existing `apiKeyAuth`.
- [ ] **Step 2: Mount** in `index.ts`: `import docsRouter from "./routes/docs.js"; app.use(docsRouter);` after `apiKeyAuth`.
- [ ] **Step 3: Typecheck + build. Commit** `git add offer-generator/src/routes/docs.ts offer-generator/src/index.ts && git -c user.name="Allone Labs" -c user.email="team@allonelabs.com" commit -m "feat(docs): /api/docs/generate route"`
- [ ] **Step 4: Deploy + smoke** `cd offer-generator && export FLY_API_TOKEN=$(security find-generic-password -s fly-api-token -w) && fly deploy -a allone-offer-generator --regions fra`. Smoke with a synthetic proposal `{doc_number:"AL-2026-TEST", language:"ka", client_name:"ტესტი", offer:{...}}` + recipient → expect 200 + two PDF urls; fetch each, confirm `PDF document`. Then delete the two test objects from storage.

---

## Task 6: CRM — repo + documents API

**Files:** modify `src/lib/offers/repo.ts`; create `src/app/api/sales/proposals/[id]/documents/route.ts`

- [ ] **Step 1: repo** — add `seedPaymentsFromSchedule(leadId: string, schedule: OfferStage[])`: for each stage insert a `lead_payments` row `{lead_id, amount: stage.amount, label: stage.label, due_date: null}` (skip if `leadId` null). `updateProposal` already accepts an arbitrary patch — no change needed for the url fields, but extend the `Proposal` type with `contract_pdf_url?`, `invoice_pdf_url?`, `recipient?`.
- [ ] **Step 2: API** — `POST /api/sales/proposals/[id]/documents` (`requireSalesAuth`, `await params`): load proposal; require `status==='approved'` else 409; read optional `{recipient}` from body (merge over `proposal.recipient`); proxy service `POST {OFFER_API_URL}/api/docs/generate` (Bearer) with `{proposal, recipient, date_label: <today in ka>}`; on success `updateProposal(id, {contract_pdf_url, invoice_pdf_url, recipient})` and, if `proposal.lead_id`, `seedPaymentsFromSchedule(lead_id, proposal.offer.schedule)`; return `{proposal}`. 502 on service failure (no partial writes before the service returns).
- [ ] **Step 3: Typecheck. Commit** `git add src/lib/offers/repo.ts src/app/api/sales/proposals/[id]/documents && git -c user.name="Allone Labs" -c user.email="team@allonelabs.com" commit -m "feat(docs): proposal documents API + payment seeding"`

---

## Task 7: CRM — UI for documents

**Files:** modify `src/app/sales/proposals/ProposalsContent.tsx`

- [ ] **Step 1:** On each **approved** proposal card, add: an optional recipient mini-form (name, id_code, address, representative — for the legal blocks), a "Generate contract + invoice" button (POST `[id]/documents` with `{recipient}`), and after success show `contract_pdf_url` + `invoice_pdf_url` as links. Reuse existing styles; no `any`; show a clean inline error on 502.
- [ ] **Step 2: Build** `NODE_OPTIONS="--max-old-space-size=2048" pnpm build`; manual smoke: approve a proposal, fill recipient, generate → open both PDFs, confirm `lead_payments` rows seeded. Commit `git add src/app/sales/proposals/ProposalsContent.tsx && git -c user.name="Allone Labs" -c user.email="team@allonelabs.com" commit -m "feat(docs): generate contract+invoice UI on approved proposals"`

---

## Self-Review notes

- **No LLM** anywhere in Plan 3 → not blocked by the claude-bridge. Pure templated renders.
- **Issuer localization** honored (ka „ოლუან"/en AllOne, same ID/IBAN) per `reference_oluan_bank`.
- **Legal text fidelity:** §3–§9 contract boilerplate copied verbatim from the real reference contract; only parties/scope/price/schedule/dates are variables. Flag for human (Luka) legal review before sending to a real client — the generator reproduces the existing template, it does not invent terms.
- **Payments:** seeding `lead_payments` from the schedule means the CRM's receivables/billing views light up automatically on doc generation.
- **Storage:** contracts + invoices go in the existing `offers` bucket under `contracts/` and `invoices/` prefixes.
- **Branch + deploy:** feature branch (master auto-deploys); Task 5 redeploys the Fly service (verify health). The doc generation itself is verifiable end-to-end without the bridge.

```

```
