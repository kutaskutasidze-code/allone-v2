# Recruitment CV Pipeline — Design Spec

**Date:** 2026-06-29
**Status:** Draft for review
**Home:** `allone-website` (the CRM) — new module + API routes + cron + DB columns + admin-UI extension. Not a separate service.

## 1. Goal

Automatically process every job application AllOne receives, from any channel:

1. Ingest the CV + application data in real time.
2. Rank the candidate against the relevant open role's JD (agentic evaluation).
3. Decide **meeting** or **reject**.
4. **Reject** → auto-send a polite rejection (in the candidate's language).
5. **Meeting** → propose interview times from the calendar, **held for human approval**, then send the invite + create the calendar event.
6. Surface everything in **Plane** (notification + approval hub) and mirror the ranking into the **CRM careers page**.

## 2. Context discovered

All three "channels" share **one Supabase project** (`cywmdjldapzrnabsoosd`), already used by both `allone-website` (CRM) and `allone-mail` (webmail):

| Table / bucket                  | Purpose                                                                                                                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vacancies`                     | Open roles. `slug, title, department, employment_type, location, summary, description_md, is_open, sort_order`. Source of JDs (auto-detects new roles).                                  |
| `job_applications`              | Web-form **and** CRM-careers-page applications (same table). `vacancy_id, vacancy_title, name, email, phone, cv_path, projects, note, status(new→reviewing→shortlisted/rejected/hired)`. |
| `emails`                        | Inbound/outbound mail; inbound rows may carry CV `attachments`.                                                                                                                          |
| bucket `applications` (private) | CV PDFs from the web/CRM form (signed-URL access).                                                                                                                                       |
| bucket `attachments`            | Files from inbound emails.                                                                                                                                                               |

The public apply routes (`/api/careers/*`) and the admin review UI (`/admin/careers/applications`) already live in `allone-website`. The "CRM careers page" the partner referred to is the admin UI over `job_applications` — **not a new source.**

## 3. Architecture (Approach C — hybrid)

Deterministic, guard-railed spine for the safety-critical steps (ingest, idempotency, sending, calendar, Plane writes); **agentic** per-candidate evaluation where judgment adds value.

```
                 ┌─────────────────────── one Supabase (cywmdjld…) ───────────────────────┐
 web form ─┐     │ job_applications  ──INSERT──┐                                            │
 CRM page ─┘────▶│                              │  Supabase DB Webhook ─▶ /api/recruiter/ingest/web
 email CV ──────▶│ emails (inbound+attachment) ─┘  Supabase DB Webhook ─▶ /api/recruiter/ingest/email
                 └─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼  (deterministic spine, idempotent)
        normalize → extract CV text → match role(vacancy) → AGENTIC EVAL (Claude+tools)
                                   │
                 ┌─────────────────┴───────────────────┐
            decision=reject                       decision=meeting
                 │                                       │
   auto-send rejection (Resend, lang)     propose slots from Google Calendar free/busy
   status=rejected + ai_* columns         status=shortlisted + proposed_slots + ai_* columns
   Plane card (Rejected)                  Plane card ("Awaiting time approval", slots)  ← NO candidate email yet
                                                   │
                                          (cron) watch Plane for approval
                                                   │ approved
                                          send invite (Resend, lang) + create Google Calendar event
                                          Plane card → "Meeting booked"
```

### 3.1 Ingestion (real-time)

- **Supabase Database Webhooks**: INSERT on `job_applications` → `POST /api/recruiter/ingest/web`; INSERT on `emails` (inbound, has attachments) → `POST /api/recruiter/ingest/email`. Both endpoints require a shared `RECRUITER_WEBHOOK_SECRET` header.
- The email endpoint filters for CV-bearing mail: an attachment with a CV extension (`.pdf/.doc/.docx`), and/or addressed to a careers/jobs/info mailbox, and/or body indicating an application. Non-applications are ignored.

### 3.2 Normalize → `Candidate`

`{ source: 'web'|'email', external_id, name, email, phone?, vacancy_id?, vacancy_slug?, cv_path/url, projects?, note?, raw_ref }`.
**Idempotency key** = `web:job_applications.id` or `email:emails.message_id`. A row already carrying `ai_ranked_at` (web) or a `recruiter_candidates` record (email) is skipped.

### 3.3 CV extraction

Download the CV (signed URL for the private `applications` bucket, public URL for `attachments`), parse text: `pdf-parse` for PDF, `mammoth` for DOCX. Truncate to a sane token budget. Corrupt/unsupported → flag, do not auto-send (held for review).

### 3.4 Role matching

- Web/CRM: `vacancy_id` is present → use it.
- Email: infer the role from the open-vacancies set (`vacancies where is_open`) via the evaluation step; default to the single open role when only one exists.

### 3.5 Agentic evaluation (the autonomy)

Claude (latest; recommend **Sonnet 4.6** for per-CV cost/quality, escalate to Opus 4.8 for ties) with tools: read the matched JD (`description_md`), read the CV text + `note` ("how you use AI") + `projects`, and **optionally follow one portfolio/GitHub link** found in the CV. Emits **structured output**:

```jsonc
{
  "score": 0-100,
  "decision": "meeting" | "reject",
  "confidence": 0.0-1.0,
  "language": "ISO-639-1",          // language to reply in
  "strengths": ["…"],
  "gaps": ["…"],
  "rationale": "…",
  "email_subject": "…",
  "email_body": "…"                 // reject copy, or meeting copy w/ {{slots}} placeholder
}
```

### 3.6 Decision + guardrails (deterministic)

- Auto-act only if `confidence ≥ CONF_THRESHOLD` **and** a valid candidate email parsed **and** `language` set.
- **Gray band / low confidence / parse failure** → create the Plane card + write `ai_*` columns, but set status `reviewing` and **do not send** — flagged "needs human review."
- **Idempotency** — skip if already processed.
- **`SENDING_ENABLED`** global kill-switch; ships **`false` (dry-run)** for burn-in (ranks + Plane cards + CRM columns, **zero candidate emails**) until you flip it on.
- **Dead-letter** table for failures; never send on partial failure; safe to re-run.

### 3.7 Reject path

Auto-send rejection via Resend (reuse `allone-mail` Resend creds / CRM `lib/email`), in the candidate's language, from a careers sender. Log as outbound in `emails`. Set `job_applications.status='rejected'` + `ai_*` columns. Plane card state **Rejected**.

### 3.8 Meeting path (human-gated)

1. Read the approver's **Google Calendar** free/busy; propose N slots (Tbilisi TZ, configurable working hours + buffer).
2. Write `status='shortlisted'`, `proposed_slots` JSON, `ai_*` columns. Create Plane card **"Awaiting time approval"** listing the slots, assigned to you. **No candidate email yet.**
3. A **cron** (every few minutes) polls Plane for approval (card moved to "Approved" / a slot chosen). On approval: send the invite email (candidate language, chosen time) + **create the Google Calendar event** (both attendees). Plane card → **"Meeting booked"**.

### 3.9 CRM mirror

Add ranking columns to `job_applications` (migration): `ai_score INT, ai_decision TEXT, ai_confidence NUMERIC, ai_language TEXT, ai_rationale TEXT, ai_strengths JSONB, ai_gaps JSONB, proposed_slots JSONB, plane_issue_id TEXT, ai_ranked_at TIMESTAMPTZ`. Extend the existing admin careers applications page to show score/decision/status inline. Plane stays the hub + approval surface; CRM is a synced read-only mirror of the AI result.

### 3.10 Plane

Create a **"Recruitment"** project in workspace `allone` (self-hosted `plane.allonelabs.com`). One issue per candidate. States: **Needs-review / Awaiting-time-approval / Meeting-booked / Rejected**. Labels: role, source, decision. Assignee: you. Issue body: contact, role, score, strengths, gaps, rationale, CV link, email-sent status, proposed slots.

## 4. Data model additions

- Migration: `ai_*` + `proposed_slots` + `plane_issue_id` columns on `job_applications` (above).
- New table `recruiter_candidates` for the **email** channel (which has no `job_applications` row) + dead-letter: `{ id, source, external_id UNIQUE, email, status, ai_score, ai_decision, plane_issue_id, error, created_at, updated_at }`.
- Optional: extend `job_applications.status` CHECK to add `interview` (vs reusing `shortlisted`) — TBD in plan.

## 5. Config / secrets (service env + Keychain)

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (cywmdjld…), `RESEND_API_KEY`, `PLANE_BASE_URL`, `PLANE_API_KEY` (move out of plaintext → Keychain `plane-api-token`), `PLANE_WORKSPACE=allone`, `GOOGLE_CALENDAR_*` (OAuth/refresh token for the approver's calendar), Claude provider creds, `RECRUITER_WEBHOOK_SECRET`, `CONF_THRESHOLD`, `SENDING_ENABLED`, `BOOKING_TZ=Asia/Tbilisi`.

## 6. Error handling

Retries with backoff on transient LLM/Plane/Resend/Calendar errors; dead-letter on terminal failure; idempotent reprocessing; never email on partial failure; structured logging per candidate.

## 7. Testing

Fixture CVs: strong / weak / wrong-role / non-English / missing-email / corrupt-PDF. Assert: correct decision bucket; **zero candidate emails in dry-run**; idempotency (same application twice → one Plane card, one email, one calendar event); language match; held-on-low-confidence; meeting path does not email before approval.

## 8. Rollout

1. Migration + columns + `recruiter_candidates` (no behavior change).
2. Ingestion + eval + Plane cards + CRM mirror, **dry-run** (no sends). Burn-in on real applicants; you validate ranking quality.
3. Flip `SENDING_ENABLED=true` → rejections auto-send.
4. Wire Google Calendar + meeting approval loop.
5. Enable email channel (`emails` webhook).

## 9. Open items (need confirmation)

- **Build home:** confirm building **inside `allone-website` (CRM)** vs a separate `allone-recruiter` service (spec assumes the CRM).
- **Claude provider:** reuse the existing **claude-bridge** (subscription-billed) for the eval, or the **Anthropic API** with structured outputs (cleaner for forced schema). Recommend Anthropic API for the structured verdict; bridge acceptable.
- **Calendar account:** which Google account's calendar is the source of truth (e.g., `luka.adamia@allonelabs.com`)?
- **"…also it should \_\_\_":** the original request was cut off; one requirement is still unknown.
- **Status enum:** add `interview` or reuse `shortlisted` for the meeting stage.
