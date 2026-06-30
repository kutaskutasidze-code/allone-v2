# Recruiter pipeline — Increments 2 & 3

Builds on Increment 1 (rank → Plane card → CRM mirror). Adds **auto-reject email**
and the **meeting flow** (propose slots → human approval in Plane → calendar invite).

## Kill-switch

Nothing is emailed to a candidate unless `RECRUITER_SENDING_ENABLED=true`. Default
is dry-run: the pipeline ranks, drafts emails, proposes slots, and creates Plane
cards, but sends zero candidate email. Flip the flag (env var, no redeploy needed —
it's read at request time) only after Increment 1 has burned in.

## Increment 2 — auto-send rejections

On a web application INSERT, after ranking:

- decision `reject`, not held (confidence ≥ threshold, email present), and
  `RECRUITER_SENDING_ENABLED=true` → the drafted rejection (already written by
  Claude **in the candidate's language**) is sent via Resend.
- The row records `ai_emailed_at` + `ai_email_status` (`sent` / `failed:<reason>`).
- Idempotent: the `ai_ranked_at` guard means an application is processed once, so a
  candidate is emailed at most once.
- `meeting` candidates are **not** emailed here — that waits for human approval.

## Increment 3 — meeting flow

1. **Propose.** A `meeting` decision gets `RECRUITER_SLOT_COUNT` (default 3)
   proposed slots — the next weekdays at `RECRUITER_SLOT_HOUR` (default 11:00)
   Tbilisi time. They're stored in `proposed_slots`, `meeting_status='proposed'`,
   `status='shortlisted'`, and listed in the Plane card body. The card is created
   in the **Todo** state (= awaiting approval). **No candidate email yet.**

2. **Approve (human).** In Plane, drag the candidate's card from **Todo** into
   **In Progress**. That's the approval signal.

3. **Book (cron).** `/api/recruiter/cron/poll-meetings` runs every 5 min (Vercel
   cron, GET, `Authorization: Bearer $CRON_SECRET`). For each card now in the
   _started_ group whose application is still `meeting_status='proposed'`:
   - books the **earliest** proposed slot,
   - emails the candidate an invitation **with an `.ics` attachment** (in their
     language) — only if sending is enabled,
   - sets `meeting_status='booked'`, `meeting_starts_at`, `status='interview'`,
   - moves the Plane card to **Done** and adds a "Meeting booked" comment.
     Idempotent: a booked application is skipped on later runs.

   To pick a slot other than the earliest, edit the meeting after booking (reply to
   the invite) — multi-slot selection from Plane is a later refinement.

## Env vars (set on the CRM Vercel project + `.env.local`)

| Var                         | Purpose                         | Default                                   |
| --------------------------- | ------------------------------- | ----------------------------------------- |
| `RECRUITER_SENDING_ENABLED` | global send kill-switch         | `false`                                   |
| `RESEND_API_KEY`            | outbound mail (reuses site key) | —                                         |
| `RECRUITER_FROM`            | candidate-mail From             | `AllOne Careers <careers@allonelabs.com>` |
| `RECRUITER_ORGANIZER_EMAIL` | invite organizer / reply-to     | `info@allonelabs.com`                     |
| `RECRUITER_SLOT_COUNT`      | proposed slots                  | `3`                                       |
| `RECRUITER_SLOT_HOUR`       | local hour for slots            | `11`                                      |
| `RECRUITER_MEETING_MINUTES` | meeting length                  | `30`                                      |
| `CRON_SECRET`               | Vercel cron auth (already set)  | —                                         |

## Deliberately deferred

- **Google Calendar free/busy + native event creation.** We send a standards-based
  `.ics` invite instead (works with Google/Apple/Outlook) — no undecided Google
  account needed. Wire real free/busy later if desired.
- **Outbound logging to the `emails` table** (that table belongs to `allone-mail`;
  send status currently lives on the application row).
- **Email-channel intake** (CVs arriving via mail.allonelabs.com) — that's
  Increment 4.
