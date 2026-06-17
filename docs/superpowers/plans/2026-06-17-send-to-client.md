# Plan 4 — Send Documents to Client (email)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]` checkboxes.

**Goal:** From an approved proposal in `/sales/proposals`, the salesperson composes an email (recipient prefilled from the lead, editable Georgian subject/body, per-document checkboxes), reviews it, and sends — the selected PDFs (offer / contract / invoice) go out as **attachments** via Resend, and the proposal flips to `status='sent'`.

**Architecture:** Decisions locked: **choose-per-send** (checkbox per doc), **draft-then-send** (compose+review in the UI, second click sends), **attached PDFs**. The service gets a generic `POST /api/docs/send` that fetches the chosen PDF URLs from Supabase Storage, base64-encodes them, and sends via Resend with `attachments`. The CRM composes/reviews the draft client-side (no server draft state needed), then `POST /api/sales/proposals/[id]/send` proxies the service and records the send.

**Tech Stack:** offer-generator (Express+TS, Resend HTTP — note the custom `User-Agent` already required vs Cloudflare 1010), CRM (Next 16). `RESEND_API_KEY` + `RESEND_FROM_ADDRESS` already set as Fly secrets on the service.

**Depends on:** Plans 2–3 (proposals + offer/contract/invoice PDFs — live). Leads have an `email` column. NOT blocked by the bridge (no LLM).

---

## File Structure

- `supabase/migrations/20260617030000_proposals_sent.sql` — add `sent_at timestamptz`, `recipient_email text` (status already allows 'sent').
- `offer-generator/src/sender/send-docs.ts` — `sendDocsEmail({to, fromName?, subject, html, attachments:[{url,filename}]})`.
- `offer-generator/src/routes/docs.ts` — add `POST /api/docs/send`.
- `src/lib/offers/types.ts` — add `sent_at?`, `recipient_email?` to `Proposal`; `lead_email?` for the joined display value.
- `src/lib/offers/repo.ts` — `listProposals` joins `leads(email)` → expose `lead_email`.
- `src/app/api/sales/proposals/[id]/send/route.ts` — `POST` compose→send.
- `src/app/sales/proposals/ProposalsContent.tsx` — "Send to client" compose/review/send UI on approved proposals.

---

## Task 1: Migration

**Files:** Create `supabase/migrations/20260617030000_proposals_sent.sql`

- [ ] **Step 1: Write**

```sql
ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS recipient_email text;
```

- [ ] **Step 2: Apply via Management API** (`equivalenza-supabase` PAT; then `NOTIFY pgrst, 'reload schema'`). Expected `[]` 201.
- [ ] **Step 3: Commit** `feat(send): proposals sent_at + recipient_email columns`

---

## Task 2: Resend attachment sender (service)

**Files:** Create `offer-generator/src/sender/send-docs.ts`

- [ ] **Step 1:** Inspect `offer-generator/src/sender/index.ts` for the exact Resend HTTP call (endpoint `https://api.resend.com/emails`, `Authorization: Bearer RESEND_API_KEY`, **`User-Agent: Allone-Sales/1.0`** — required vs Cloudflare 1010, `RESEND_FROM_ADDRESS` default). Reuse the same call shape.
- [ ] **Step 2: Implement**

```ts
import { logger } from "../utils/logger.js";

export interface DocAttachment {
  url: string;
  filename: string;
}
export interface SendDocsOpts {
  to: string;
  fromName?: string;
  subject: string;
  html: string;
  attachments: DocAttachment[];
}
export interface SendDocsResult {
  ok: boolean;
  resendId?: string;
  error?: string;
}

export async function sendDocsEmail(
  opts: SendDocsOpts,
): Promise<SendDocsResult> {
  const key = process.env.RESEND_API_KEY || "";
  const from =
    process.env.RESEND_FROM_ADDRESS || "Allone Labs <hello@allonelabs.com>";
  if (!key) return { ok: false, error: "RESEND_API_KEY not set" };
  if (!opts.to) return { ok: false, error: "recipient (to) required" };

  // Fetch each PDF and base64-encode for Resend's attachments field.
  const attachments: { filename: string; content: string }[] = [];
  for (const a of opts.attachments) {
    const r = await fetch(a.url);
    if (!r.ok)
      return { ok: false, error: `attachment fetch ${r.status}: ${a.url}` };
    const buf = Buffer.from(await r.arrayBuffer());
    attachments.push({ filename: a.filename, content: buf.toString("base64") });
  }
  const fromAddress = opts.fromName
    ? `${opts.fromName} <${from.replace(/^.*<|>$/g, "")}>`
    : from;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Allone-Sales/1.0",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
      attachments,
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    logger.error("sendDocsEmail: Resend failed", {
      status: res.status,
      text: text.slice(0, 200),
    });
    return { ok: false, error: `Resend ${res.status}: ${text.slice(0, 200)}` };
  }
  let json: { id?: string };
  try {
    json = JSON.parse(text);
  } catch {
    json = {};
  }
  return { ok: true, resendId: json.id };
}
```

- [ ] **Step 3: Typecheck. Commit with Task 3.**

---

## Task 3: Send route (service)

**Files:** modify `offer-generator/src/routes/docs.ts`

- [ ] **Step 1:** Add `POST /api/docs/send` body `{to, from_name?, subject, html, attachments:[{url,filename}]}` → call `sendDocsEmail` → return `{ok, resendId}` or 502 `{error}`. Behind existing `apiKeyAuth` (router already mounted after it). Validate `to`, `subject`, and a non-empty `attachments`/`html`.
- [ ] **Step 2: Typecheck + `pnpm build`. Commit** `feat(send): /api/docs/send (Resend with PDF attachments)`
- [ ] **Step 3: Deploy** `cd offer-generator && export FLY_API_TOKEN=$(security find-generic-password -s fly-api-token -w) && fly deploy -a allone-offer-generator --regions fra`. Smoke: POST with one real stored PDF url + a test `to` (use a safe address you control) → expect `{ok:true}`. (Controller will use a deliverable test address.)

---

## Task 4: CRM repo + send API

**Files:** modify `src/lib/offers/types.ts`, `src/lib/offers/repo.ts`; create `src/app/api/sales/proposals/[id]/send/route.ts`

- [ ] **Step 1: types** — `Proposal` += `sent_at?: string|null; recipient_email?: string|null;` and a non-column `lead_email?: string|null` for display.
- [ ] **Step 2: repo** — in `listProposals`/`getProposal`, select `*, leads(email)` and flatten to `lead_email` (Supabase returns the join nested; map it). Keep existing fields.
- [ ] **Step 3: API** `src/app/api/sales/proposals/[id]/send/route.ts` `POST` (requireSalesAuth, await params):
  - Body `{to, subject, html, docs}` where `docs` = `{offer?:boolean, contract?:boolean, invoice?:boolean}`.
  - Load proposal; require `status==='approved' || status==='sent'` (allow re-send) else 409. Resolve `to` = body.to || proposal.recipient_email || lead.email; if none → 400 "recipient email required".
  - Build `attachments` from the selected docs that have URLs: offer→`{url: offer_pdf_url, filename: "${doc_number}-offer.pdf"}`, contract→`{url: contract_pdf_url, filename:"${doc_number}-contract.pdf"}`, invoice→`{url: invoice_pdf_url, filename:"${doc_number}-INV.pdf"}`. If none selected/available → 400.
  - Proxy service `POST {OFFER_API_URL}/api/docs/send` (Bearer) with `{to, subject, html, attachments}`. On non-ok → 502 with text (no DB write).
  - On success: `updateProposal(id, {status:'sent', sent_at: new Date().toISOString(), recipient_email: to})`. Return `{proposal}`.
- [ ] **Step 4: Typecheck. Commit** `feat(send): proposal send API (compose → Resend attachments → status=sent)`

---

## Task 5: CRM send UI

**Files:** modify `src/app/sales/proposals/ProposalsContent.tsx`

- [ ] **Step 1:** On each proposal that is **approved** (or already sent), add a **"Send to client"** panel (collapsible) with:
  - a recipient email input, prefilled from `proposal.recipient_email || proposal.lead_email || ""`;
  - an editable **subject** (default Georgian, e.g. `${proposal.client_name} — შეთავაზება / Allone Labs`);
  - an editable **body** textarea (default Georgian cover note);
  - **checkboxes** for the documents that exist on this proposal (offer / contract / invoice) — only show a checkbox if its `*_pdf_url` is set; offer checked by default;
  - a **Send** button → `POST /api/sales/proposals/<id>/send` with `{to, subject, html: <body as simple HTML>, docs:{...}}`; show a clean inline Georgian error on 502/400; on success show "გაიგზავნა ✓", the `sent_at`, and disable the form (re-send still possible via a small "ხელახლა გაგზავნა" link).
    No `any`; type the fetch response. Wrap the body text in minimal HTML (`<p>` per line) before sending.
- [ ] **Step 2: Build** `NODE_OPTIONS="--max-old-space-size=2048" pnpm build`; manual smoke: approve+generate docs on a test proposal with a lead that has YOUR email, send offer-only to yourself, confirm the email arrives with the PDF attached and `status='sent'`. Commit `feat(send): send-to-client compose/review UI on approved proposals`

---

## Self-Review notes

- **Outward-facing:** real email to a real client. Draft-then-send (compose+review, explicit Send) is the safety gate; nothing auto-sends. Recipient is shown and editable before send.
- **No partial writes:** the proposal only flips to `sent` after Resend returns ok (502 otherwise).
- **Attachments:** PDFs fetched from Storage + base64'd in the service (Resend `attachments:[{filename,content}]`). Custom `User-Agent` reused (Cloudflare 1010 gotcha from `reference_resend_allonelabs`).
- **No LLM** → works regardless of the claude-bridge.
- **Re-send** allowed (status stays/ returns to sent; sent_at updates) so a salesperson can resend or send the contract/invoice in a later email.
- **Branch + deploy:** feature branch (master auto-deploys); Task 3 redeploys the Fly service (verify health). Use a deliverable test address for the live send smoke (not a fake one — Resend will accept fakes but they bounce).

```

```
