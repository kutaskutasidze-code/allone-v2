# Plan 5 — In-Chat Document Delivery

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]` checkboxes.

**Goal:** The questionnaire chat becomes a persistent thread. After the client submits, they land on a private thread URL (also saved in their browser + linked in the email). When sales clicks **Send to client**, the selected documents (offer / contract / invoice) appear **inside that chat** as view/download bubbles — live — in addition to the email. This is what the client actually wanted: the bot is the delivery channel, not just email.

**Architecture:** `questionnaire_responses.id` (UUID, unguessable) is the thread key. Submit returns it; the bot redirects to `/b/<slug>/c/<rid>` and stores `rid` in localStorage (so reopening `/b/<slug>` resumes the thread). A public, rid-keyed endpoint `GET /api/bots/<slug>/thread/<rid>` returns `{status, intro, documents:[{kind,label,url}]}` — the docs delivered so far. Delivery happens in the existing **Send to client** action: the proposal gets a `chat_documents jsonb` array (the sent docs) and the email body gets a "view in chat" link. The thread page polls every 5s and renders new document bubbles. rid is unguessable and the endpoint returns only already-public Storage URLs + status — same trust model as the public submit.

**Tech Stack:** Next 16 CRM (App Router), Supabase service-role. No LLM, no new service work.

**Depends on:** Plans 1–4 (bots, proposals, offer/contract/invoice PDFs, send — all live).

---

## File Structure

- `supabase/migrations/20260617040000_proposals_chat_documents.sql` — add `chat_documents jsonb default '[]'`.
- `src/lib/bots/repo.ts` — `insertResponse` returns the new id; add `getResponse(id)`.
- `src/app/api/bots/[slug]/submit/route.ts` — return `{ok:true, response_id}`.
- `src/app/b/[slug]/BotChat.tsx` — on submit, store rid in localStorage + redirect to thread; on mount, if a stored rid exists for this slug, redirect.
- `src/app/b/[slug]/c/[rid]/page.tsx` — thread loader (config + response + proposal).
- `src/app/b/[slug]/c/[rid]/ThreadChat.tsx` — client thread UI (polls, renders doc bubbles).
- `src/app/api/bots/[slug]/thread/[rid]/route.ts` — public `GET` thread status.
- `src/lib/offers/types.ts` — `Proposal` += `chat_documents?: {kind:string;label:string;url:string}[]`.
- `src/lib/offers/repo.ts` (offers) — `getProposalByResponseId(rid)`; `updateProposal` patch already generic.
- `src/app/api/sales/proposals/[id]/send/route.ts` — also write `chat_documents` + append "view in chat" link to the email html.

---

## Task 1: Migration

**Files:** Create `supabase/migrations/20260617040000_proposals_chat_documents.sql`

- [ ] **Step 1:** `ALTER TABLE proposals ADD COLUMN IF NOT EXISTS chat_documents jsonb NOT NULL DEFAULT '[]'::jsonb;`
- [ ] **Step 2:** Apply via Management API (`equivalenza-supabase` PAT) + `NOTIFY pgrst, 'reload schema'`. Expect `[]` 201.
- [ ] **Step 3:** Commit `feat(chat): proposals.chat_documents column`

---

## Task 2: Submit returns response_id (bots repo + route)

**Files:** `src/lib/bots/repo.ts`, `src/app/api/bots/[slug]/submit/route.ts`

- [ ] **Step 1:** In `repo.ts`, change `insertResponse(row)` to `.insert(row).select("id").single()` and return `string` (the id). Add `getResponse(id: string)` → select `*` from `questionnaire_responses` where id, `maybeSingle()`.
- [ ] **Step 2:** In the submit route, capture `const id = await insertResponse(row)` and return `NextResponse.json({ ok: true, response_id: id })`. Keep the 50KB guard + try/catch.
- [ ] **Step 3:** `npx tsc --noEmit`. Commit `feat(chat): submit returns response_id`

---

## Task 3: Bot redirects to a persistent thread

**Files:** `src/app/b/[slug]/BotChat.tsx`

- [ ] **Step 1:** After a successful submit, read `response_id` from the JSON; `localStorage.setItem('bot_thread_'+slug, response_id)`; then `window.location.assign('/b/'+slug+'/c/'+response_id)`.
- [ ] **Step 2:** On mount (useEffect), if `localStorage.getItem('bot_thread_'+slug)` exists, redirect to that thread (so reopening the bot resumes instead of re-asking). Guard so it doesn't loop on the thread page (this is the bot page only).
- [ ] **Step 3:** Build. Commit `feat(chat): persist + resume thread after submit`

---

## Task 4: Thread status endpoint (public, rid-keyed)

**Files:** `src/app/api/bots/[slug]/thread/[rid]/route.ts`; `src/lib/offers/repo.ts`

- [ ] **Step 1:** offers `repo.ts`: add `getProposalByResponseId(rid: string)` → select `*` from proposals where `source_response_id = rid` order by created_at desc, `maybeSingle()`.
- [ ] **Step 2:** `GET /api/bots/[slug]/thread/[rid]` (`runtime nodejs`, `dynamic force-dynamic`, `await params`): load the response via bots `getResponse(rid)`; if missing or its `bot_slug !== slug` → 404. Load `getProposalByResponseId(rid)`. Return:

```ts
{
  status: proposal?.status ?? "received", // received | draft | approved | sent
  intro: proposal && proposal.chat_documents?.length
    ? "თქვენი დოკუმენტები მზადაა — იხილეთ ქვემოთ."
    : "მადლობა! თქვენი მოთხოვნა მიღებულია. შეთავაზებას მალე მოგაწვდით აქვე.",
  documents: proposal?.chat_documents ?? [],
}
```

Only `chat_documents` (already-public URLs) are exposed — never the raw proposal.

- [ ] **Step 3:** `npx tsc --noEmit`. Commit `feat(chat): public thread status endpoint`

---

## Task 5: Thread page + chat UI (polls)

**Files:** `src/app/b/[slug]/c/[rid]/page.tsx`, `src/app/b/[slug]/c/[rid]/ThreadChat.tsx`

- [ ] **Step 1:** `page.tsx` (server, `dynamic force-dynamic`, `await params`): `getBotConfigBySlug(slug)` + `getResponse(rid)`; if response missing or `bot_slug !== slug` → `notFound()`. Render `<ThreadChat slug={slug} rid={rid} title={cfg.title} />`.
- [ ] **Step 2:** `ThreadChat.tsx` (`"use client"`): chat-styled page reusing the bot's visual style. On mount + every 5s, `GET /api/bots/${slug}/thread/${rid}` → render: a bot bubble with `intro`, then one **document bubble per `documents[]`** — each showing the label (e.g. „შეთავაზება", „ხელშეკრულება", „ინვოისი") with an **"ნახვა"** link (`target=_blank`, opens the PDF) and a **"ჩამოტვირთვა"** link (`download` attr). Stop polling once `status==='sent'` and documents are present (or keep a slow 15s poll). No `any`.
- [ ] **Step 3:** Build. Manual: open a thread URL with a rid that has a sent proposal → see the doc bubbles. Commit `feat(chat): client thread page with live document bubbles`

---

## Task 6: Send delivers to chat too

**Files:** `src/app/api/sales/proposals/[id]/send/route.ts`

- [ ] **Step 1:** When building the send, also build `chat_documents` = the SAME selected docs as `[{kind:'offer'|'contract'|'invoice', label:'შეთავაზება'|'ხელშეკრულება'|'ინვოისი', url}]` (only those selected + having a url).
- [ ] **Step 2:** Append a "view in chat" link to the email `html` before sending: resolve the bot slug from the response (`getResponse(proposal.source_response_id).bot_slug`); if present, append `<p><a href="https://allonelabs.com/b/<slug>/c/<source_response_id>">ნახეთ ჩატში →</a></p>`. (Use `process.env.NEXT_PUBLIC_SITE_URL` or `https://allonelabs.com` as base.)
- [ ] **Step 3:** On the success path (after Resend ok), include `chat_documents` in the `updateProposal` patch alongside `status:'sent', sent_at, recipient_email`. So chat delivery + email happen in the one Send action. If `source_response_id` is null (manual proposal with no bot), skip the chat link/docs gracefully — email still sends.
- [ ] **Step 4:** `npx tsc --noEmit` + `pnpm build`. Commit `feat(chat): Send to client also posts documents into the client's chat thread`

---

## Self-Review notes

- **This closes the actual requirement:** documents land in the client's chat (view/download), not only email. One "Send to client" does both.
- **Trust model:** thread endpoint is public but rid is an unguessable UUID and it returns only already-public Storage URLs + a status string — same as the public submit/render URLs.
- **Resume:** localStorage + the dedicated thread URL + the email link give three return paths (decision: persistent link + email link).
- **No LLM / no service change** → not blocked by the bridge; pure CRM + DB.
- **Graceful for manual proposals:** if a proposal has no `source_response_id` (not from a bot), send still emails; chat delivery is simply skipped.
- **Polling:** 5s while pending, slow to 15s once delivered; cheap (one indexed query). Not websockets — adequate for this volume.
- **Branch + deploy:** feature branch (master auto-deploys); no Fly redeploy needed (CRM-only). Migration via Management API.

```

```
