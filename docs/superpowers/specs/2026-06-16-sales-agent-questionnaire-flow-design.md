# Sales-Agent Questionnaire Flow — Design

**Date:** 2026-06-16
**Status:** Draft for review
**Author:** Claude + Luka

## Goal

Turn the questionnaire chatbots (Buckswood / GADCEA / clinic pattern) into a
revenue tool wired into the AllOnce sales CRM (`allone-website`). A salesperson
generates a tailored questionnaire bot for a prospect; the prospect's answers
flow into the CRM; the CRM drafts a **commercial offer** from those answers; on
human approval it generates and sends a **payment invoice** and a **service
contract** — all in the existing Georgian document formats.

This is the "sales agent" the brief describes: _answers → offer → (approve) →
invoice + contract._

## Decisions locked (from brainstorming)

1. **Automation = human-approve gate.** Answers auto-draft an offer; a person
   reviews/sets price and approves; approval auto-generates + sends invoice +
   contract. Never auto-send pricing or legal docs unreviewed.
2. **Bot generator = standalone + link.** A generator produces a hosted bot for
   any client; answers land in a shared table the CRM reads (not tightly coupled
   to a single lead row).
3. **Invoice = PDF + bank transfer**, staged schedule, matching existing
   invoices. (Pay-link is a future option, out of scope v1.)
4. **Contract + offer reuse existing formats** (the real PDFs/DOCX on the
   device — 9-section service agreement; 3-section invoice; offer deck).
5. **Issuer entity = one company, name localized by language:** Georgian docs →
   `შპს „ოლუან"`; English docs → `AllOne`. Same ID `405826361`, BoG IBAN
   `GE82BG0000000612104254`, dir. ნინო მესხიძე. (See memory `reference_oluan_bank`.)

## What already exists (build on, don't rebuild)

- **`offer-generator` Fly service** (just redeployed, healthy): Puppeteer PDF
  rendering, Claude proposal authoring (`/api/offers/*`), Supabase Storage
  upload, demo pipeline (`/api/demos/*`), Resend email send + open/click
  tracking. **This is where document generation lives.**
- **CRM (`allone-website`):** `src/app/sales/*` (leads, demos, campaigns,
  analytics), `src/app/admin/*`, lead billing/receivables tables
  (`lead_payments`), references, the `/api/admin/demos/*` proxy pattern.
- **Questionnaire pattern:** the 3 deployed bots (Next.js, chat-native, Georgian,
  Supabase per-table). Their shape is the template for generated bots.

## Architecture (4 components)

### 1. Questionnaire-bot generator (standalone)

A generator that, given a config (client name, language, question list, target
table tag), produces a hosted chat-native bot like the existing three.

- **v1 approach:** a single reusable bot app driven by a `bot_configs` row
  (config-as-data), not a new repo per client. One deployment, many bots, keyed
  by `?bot=<slug>`. This avoids 1 repo + 1 Vercel project per prospect.
- Answers POST to a **shared `questionnaire_responses` table** with columns:
  `id, bot_slug, lead_id (nullable), client_name, answers jsonb, completed_at,
created_at`. The CRM reads this table.
- A CRM page (`/sales/bots`) lists bots, creates configs (question builder or
  AI-drafted from a one-line brief), and shows the public link to send.

### 2. Answers → offer drafter

- When a `questionnaire_responses` row is marked `completed`, the CRM surfaces it
  (on its lead if `lead_id` set, else in an inbox) and offers **"Draft offer."**
- "Draft offer" calls a new `offer-generator` endpoint **`POST /api/offers/from-answers`**:
  Claude reads the answers + service catalog → returns a structured offer
  (scope lines, suggested price range, timeline). The CRM stores it as a
  `proposals` row in `status=draft`. **Price is editable; nothing is sent yet.**

### 3. Approval gate (CRM)

- Salesperson reviews the draft offer on the lead, sets the final price, edits
  scope, then **Approve**.
- On approve, the CRM calls the service to render the **offer PDF** (existing
  format) and transitions `proposals.status = approved`.

### 4. Invoice + contract on approval

- Approval triggers **`POST /api/contracts` and `POST /api/invoices`** on the
  service: render the Georgian 9-section contract and 3-section invoice PDFs
  (issuer block auto-filled per language), upload to Supabase Storage, and draft
  a Resend email to the client (human clicks send, consistent with the demo
  pipeline's one-click-send safety).
- Doc numbers follow existing scheme (`N<dd/mm/yyyy>-n`, `AL-2026-NNN-INV`).
- Payment stages (30/70 or 4-stage) seed `lead_payments` so receivables tracking
  already works.

## Data model (new tables, sales Supabase)

- `bot_configs` — slug, client_name, language, questions jsonb, lead_id, active.
- `questionnaire_responses` — as above (shared answers sink).
- `proposals` — lead_id, source_response_id, scope jsonb, price, currency,
  status (draft|approved|sent), offer_pdf_url, contract_pdf_url, invoice_pdf_url,
  doc_number, timestamps.
- Reuse `lead_payments` for the staged schedule.

## Document generation (in offer-generator service)

Three Puppeteer HTML→PDF renderers, each a faithful port of the existing docs:

- `offer.html` — commercial offer (the deck format).
- `contract.html` — 9-section მომსახურების ხელშეკრულება, issuer auto-filled.
- `invoice.html` — 3-section ინვოისი with staged payment schedule + terms.
  Issuer/recipient/scope/price/dates are template variables.

## Out of scope (v1)

- Payment links / online payment capture (bank transfer only).
- Auto-send without human click.
- Per-client bot repos (config-driven single app instead).
- E-signature (signature blocks remain manual, as today).

## Open questions for review

1. Single config-driven bot app vs. the per-client repo pattern I used for the 3
   bots — I recommend config-driven. OK?
2. Should "Draft offer" suggest a price (Claude, from a service catalog) or
   always leave price blank for the salesperson? Brief implied AI drafts it.
3. Where should generated bots be hosted — a new `bots.allonelabs.com` app, or a
   route inside `allone-website` itself?
4. Service catalog/pricing source for the AI offer drafter — is there a canonical
   price list, or infer from past offers?
