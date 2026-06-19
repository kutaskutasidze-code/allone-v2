# Website Chat Widget → Self-Serve Offer — Design

**Date:** 2026-06-20
**Status:** Approved (design), pending implementation plan
**Repos touched:** `allone-website` (backend + offer pipeline), `allone-studio` (static site widget)

## Goal

Add a chat widget to the public marketing site **allonelabs.com** (the `allone-studio`
static site) that:

1. Answers FAQ / client-service questions about Allone Labs.
2. When a visitor shows buying intent, runs the **same intake → offer flow** as the
   existing sales bot at `app.allonelabs.com/b/<slug>`.
3. Produces an **instant public offer link** the visitor can open to see the offer HTML + PDF.

The widget must visually match the `allone-studio` site: angular (zero border-radius),
monochrome with `#2776EA` blue accent, Space Grotesk headings / Geist body, square
floating launcher bottom-right.

## Decisions (locked)

| Decision                 | Choice                                                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Offer machinery location | **Reuse the existing `allone-website` pipeline.** The widget is a thin client; nothing in the offer pipeline is rebuilt.  |
| Offer gate               | **Instant auto-offer link.** Bot auto-drafts + publishes; visitor gets the link in-chat. Luka is notified to refine.      |
| Widget style             | **Match the site exactly** — angular, monochrome, `#2776EA`.                                                              |
| Brain                    | The existing two-stage bot brain (Gemini primary, claude-bridge fallback) via the existing `/api/bots/[slug]/chat` route. |

## Architecture

```
allonelabs.com (allone-studio, static)        app.allonelabs.com (allone-website, Next.js)
┌──────────────────────────┐                  ┌─────────────────────────────────────────┐
│ chat-widget.js + .css    │   CORS fetch     │ POST /api/bots/allone-web/chat  (extend) │
│ floating launcher → panel│ ───────────────▶ │ POST /api/bots/allone-web/submit (reuse) │
│ angular, #2776EA, Geist  │                  │ POST /api/bots/allone-web/self-offer (NEW)│
└──────────────────────────┘                  │      ↓ offer-generator (Fly) draft+render │
        visitor gets link ◀───────────────────│      ↓ proposals row (status 'sent')      │
   app.allonelabs.com/b/allone-web/c/<rid>    │      ↓ Resend notify Luka                 │
   (existing thread renders offer HTML + PDF) └─────────────────────────────────────────┘
```

### Components

**1. Widget (new, in `allone-studio`)**

- `chat-widget.js` — vanilla JS (no framework; the site is static HTML). Self-contained
  IIFE that injects the launcher + panel, manages conversation state in memory, calls the
  cross-origin API, and renders the offer link on completion.
- `chat-widget.css` — scoped styles (all selectors namespaced, e.g. `.alo-chat-*`) so the
  site's global `border-radius:0 !important` and other resets don't fight the widget, and
  the widget doesn't leak into the site.
- Included on the site's HTML pages via `<link rel="stylesheet">` + `<script defer>`.
- Config (API base URL, bot slug) inlined as a small `window.ALO_CHAT` object or data
  attributes on the script tag.

**2. Bot brain (extend existing `allone-website`)**

- A new `bot_configs` row with slug **`allone-web`**, containing:
  - `intro` — the widget's opening line.
  - `knowledge` (NEW optional column) — an Allone FAQ / capabilities block injected into
    the system prompt so the bot can answer client-service questions before intake.
  - `questions` — the intake topics (business/needs, features, budget, timeline, assets,
    **contact**).
- Extend `/api/bots/[slug]/chat`: when `bot_config.knowledge` is present, prepend it to the
  system prompt. The bot's behavior becomes: answer FAQ first, then naturally pivot to
  intake, then emit `<<COMPLETE>>` (unchanged completion mechanism).
- **Mandatory contact capture:** the intake must obtain a name + at least one of
  email / phone before completing (needed for self-serve follow-up). The system prompt
  instructs the bot not to emit `<<COMPLETE>>` until contact is captured; the self-offer
  route also validates contact presence and, if missing, returns a "needs contact" signal
  the widget uses to ask once more.

**3. Self-offer route (new, `allone-website`)**

- `POST /api/bots/[slug]/self-offer` — body `{ response_id }`.
  1. Load the `questionnaire_responses` row; validate it belongs to this bot slug and has
     contact info.
  2. Call offer-generator `POST /api/offers/draft` → `OfferDraft` JSON.
  3. Call offer-generator `POST /api/offers/render` → PDF in Supabase Storage → public URL.
  4. Insert a `proposals` row: `status:'sent'`, `source:'website-self-serve'`,
     `offer`, `price`, `doc_number`, `offer_pdf_url`, `chat_documents`,
     `source_response_id`.
  5. Fire a Resend email to Luka (lead summary + offer link). Best-effort; failure does not
     fail the request.
  6. Return `{ offer_url: "https://app.allonelabs.com/b/<slug>/c/<rid>", pdf_url }`.
- The **offer link is the existing thread page** `/b/<slug>/c/<rid>`, which already renders
  the interactive offer (`AutolabOffer`) + PDF and supports continued chat. No new render
  surface needed.

**4. CORS (new, `allone-website`)**

- The three routes the widget calls (`chat`, `submit`, `self-offer`) must return CORS
  headers allowing origin `https://allonelabs.com` (and `https://www.allonelabs.com`).
  Handle `OPTIONS` preflight. Allowlist only those origins.

**5. Notification (new, `allone-website`)**

- Resend email to Luka on each self-serve offer (key in Keychain `resend-allonelabs`;
  set a browser User-Agent header per known Cloudflare quirk). Distinct subject so
  self-serve leads are obvious.

## Data flow (happy path)

1. Visitor opens widget on allonelabs.com → widget seeds the conversation, bot greets.
2. Visitor asks questions → `/chat` answers from `knowledge`.
3. Buying intent → bot pivots to intake, gathers business/needs/budget/timeline/assets +
   contact, one short question at a time.
4. Bot emits `<<COMPLETE>>` → existing extraction returns structured `answers`.
5. Widget `POST /submit` → `response_id`.
6. Widget `POST /self-offer` → auto-draft + render → `{ offer_url, pdf_url }`.
7. Widget shows "Your offer is ready → View offer" linking to `offer_url`.
8. Luka receives the Resend notification; the proposal appears in `/sales/proposals`
   tagged `website-self-serve` for refinement.

## Error handling

- **claude-bridge / offer-generator down:** `/self-offer` returns a soft failure; the
  `questionnaire_responses` row is already saved and Luka is notified, so no lead is lost.
  Widget shows: "Thanks — we've got your details and will email your offer shortly."
- **Missing contact at completion:** `/self-offer` returns `needs_contact`; widget asks the
  bot to collect it, then retries.
- **Rate limiting / abuse:** per-session (client-generated id) + per-IP limit on
  `/self-offer`. All rows tagged `source:'website-self-serve'` so auto-offers are
  distinguishable in the CRM. (Exact limits decided in the plan.)
- **CORS preflight failures:** explicit `OPTIONS` handler; origin allowlist.

## Language

The bot mirrors the visitor's language — **English by default** (allonelabs.com is English),
Georgian if the visitor writes Georgian. The `knowledge` block is provided in both languages
or instructs the bot to translate FAQ content as needed.

## Reuse vs new (surface summary)

| Piece                                          | Status                               |
| ---------------------------------------------- | ------------------------------------ |
| `/api/bots/[slug]/chat`                        | **Extend** (inject `knowledge`)      |
| `/api/bots/[slug]/submit`                      | **Reuse as-is**                      |
| `/b/[slug]/c/[rid]` thread + `AutolabOffer`    | **Reuse as-is** (the offer link)     |
| offer-generator draft + render + PDF + Storage | **Reuse as-is**                      |
| `bot_configs` `allone-web` row                 | **New** (data, + `knowledge` column) |
| `/api/bots/[slug]/self-offer`                  | **New**                              |
| CORS on widget-facing routes                   | **New**                              |
| Resend notification                            | **New**                              |
| `chat-widget.js` / `.css` in allone-studio     | **New**                              |

## Out of scope (v1)

- Contract / invoice / payment steps in the self-serve flow (offer only; existing CRM
  handles downstream).
- Streaming responses (request/response per turn is sufficient).
- Persisting widget conversation server-side before `/submit` (kept client-side until intake
  completes, matching the existing BotChat behavior).
- Internationalized widget chrome beyond EN/KA mirroring.

## Open items for the plan

- Exact rate-limit thresholds and storage (in-memory vs Supabase counter).
- Whether `knowledge` is a new `bot_configs` column or reuses an existing jsonb field.
- Final FAQ/knowledge copy (Luka to supply or approve).
- Which allone-studio HTML pages get the widget include (all pages vs landing only).
