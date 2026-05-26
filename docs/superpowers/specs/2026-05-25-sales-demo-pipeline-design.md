# Sales → Personalized Demo Pipeline — Design

**Date:** 2026-05-25
**Status:** Approved (verbal, this conversation)
**Owner:** Luka Adamia

## Problem

When a lead enters the sales pipeline, the highest-conviction first touch is a working personalized demo + an audit of their existing site + a commercial offer. Today every piece exists as a separate tool, none of them stitched together:

- `allonelabs.com/sales` has leads, campaigns, email templates — no demo wiring.
- `~/Projects/site-xray` (v55 + xfly + v54 backend gap-fill) clones any site and skins it to a target brand. CLI only.
- `~/Projects/founder-brain/src/xray.ts` is the canonical TS wrapper that spawns xray CLIs and streams progress.
- `allone-website/offer-generator/` is a sibling Node service that already does company analysis (perf, SEO, security, accessibility, tech, html, company-research) + Claude-driven offer content + Puppeteer PDF + Supabase upload. Backed by `commercial_offers` table.
- `allone-website/src/emails/` has manually maintained per-service HTML email templates (chatbot, custom-ai, consulting, catalogue, …) in EN + KA.

What is missing is the **seam**: a job that takes a `lead` row and produces a deployed demo URL + an audit + a drafted email pointing at both, then surfaces it for a one-click human-review send.

## Goal

When a lead is created, automatically:

1. Enrich the lead with `company.json` (name, color, logo, services, contact) from their existing site.
2. Classify their segment (tourism / ecom / law-firm / dental / …).
3. Pick a best-in-segment reference website (Awwwards-tier, pre-cloned in our library).
4. Skin that clone with the lead's branding via `xfly`.
5. Wire the BF admin shell into the demo with seeded fake data appropriate to the segment.
6. Deploy the whole demo to Vercel under `demos.allonelabs.com`.
7. Run an audit of the lead's existing site in parallel.
8. Draft an email from a deterministic template (no LLM in message body) with variables swapped: name, audit findings, demo URL, commercial offer.
9. Surface the result on `/sales/leads/[id]` for the assigned sales user to review and send.

## Non-goals

- **No LLM in the email body.** Templates with variable substitution only.
- **No auto-send.** Always human review. Catches broken demos before they ship to prospects.
- **No new admin UIs on the cloned sites themselves.** The "admin" in this pipeline is the BF shell rendered against demo-scoped data, not pages built into the clone.
- **Dedicated `demos` Supabase project, shared across all demo orgs.** All demos live in ONE separate Supabase project (NOT `cywmdjldapzrnabsoosd`), row-scoped by `demo_org_id`. Reasons: sales PII and demo seed data must not co-mingle; per-demo project provisioning is too slow/expensive; sharing one demo project keeps Vercel build-time wiring trivial. Teardown is row deletion + Vercel project delete. Project rotation gives free mass-teardown if needed. Decided 2026-05-26.
- **No real-time progress** in the sales UI for this first cut. Polling every 3s on the leads detail page is enough.

## Architecture

### Existing pieces reused, not rebuilt

| Concern                     | Component                                                                                  | Status  |
| --------------------------- | ------------------------------------------------------------------------------------------ | ------- |
| Auth gate for /sales        | `src/lib/sales-auth.ts` + `sales_users` table                                              | shipped |
| Lead CRUD                   | `src/app/sales/leads/*`                                                                    | shipped |
| Email template library      | `src/emails/*.html` + `email_templates` table                                              | shipped |
| Website analyzer            | `offer-generator/src/analyzer/*` (perf, SEO, security, a11y, tech, html, company-research) | shipped |
| Offer content generation    | `offer-generator/src/generator/*`                                                          | shipped |
| PDF rendering               | `offer-generator/src/pdf/*`                                                                | shipped |
| Job state pattern           | `commercial_offers` table (status, current_step, progress, error_message)                  | shipped |
| xray clone                  | `~/Projects/site-xray/xray-pipeline.js` v55 + v54 gap-fill                                 | shipped |
| xfly skin                   | `~/Projects/site-xray/xfly.js` (with `--map`, `--phrase-map`, `--assets`)                  | shipped |
| TS wrapper pattern for xray | `~/Projects/founder-brain/src/xray.ts`                                                     | shipped |
| BF admin shell              | `~/Desktop/Claude/business-forge/shell-zone`                                               | shipped |

### New pieces

**Service layout** — extend `offer-generator/` rather than create a sibling. It is already a Node Express service with the right primitives (job state machine, polling UI, Supabase repo pattern, Anthropic + Puppeteer in the dep tree). Add four modules:

```
offer-generator/src/
├─ analyzer/             ← reused (audit phase)
├─ generator/            ← reused (offer content)
├─ pdf/                  ← reused (offer PDF)
├─ storage/              ← reused (Supabase upload)
├─ enricher/             ← NEW — extract company.json from analyzer outputs
├─ references/           ← NEW — pick + manage reference_templates
├─ cloner/               ← NEW — wraps site-xray CLI, streams events
├─ skinner/              ← NEW — wraps xfly CLI
├─ admin-wirer/          ← NEW — clones BF shell into demo dir, seeds demo data
├─ deployer/             ← NEW — vercel CLI wrapper, returns deployed URL
├─ email-drafter/        ← NEW — template-variable swap from existing src/emails
├─ pipeline.ts           ← extend to orchestrate demo phases
├─ demo-pipeline.ts      ← NEW — sibling orchestrator for demo jobs
└─ teardown-cron.ts      ← NEW — destroys expired demos
```

**The xray + xfly subprocesses run inside the offer-generator host.** offer-generator is already Express + Puppeteer + long-running pipeline; adding more Node subprocesses fits. Deployment target: same host as offer-generator (Railway or wherever it lands; not Vercel functions — pipeline runs minutes).

### Pipeline state machine (`demo_jobs`)

```
queued
  │
  ▼
enriching       ← analyzer (existing) + enricher (new) → leads.company_spec
  │
  ├─────────────────────────┐
  ▼                         ▼
skinning                   auditing     ← runs in parallel
  │                         │
  ▼                         │
wiring_admin                │
  │                         │
  ▼                         │
deploying ─────── joins ────┘
  │
  ▼
drafting        ← email-drafter
  │
  ▼
draft_ready     ← sales user notified
  │
  ▼ (sales user clicks Send)
sent
  │
  └─ (expires_at fires) ──► expired ──► (teardown cron) ──► deleted
```

Failure at any phase → `failed`, with `phase_history` capturing what ran. Sales user can "Retry from phase N".

### Data model

```sql
-- migration: 20260525000000_sales_demo_pipeline.sql

-- 1. extend leads
ALTER TABLE leads
  ADD COLUMN segment text,
  ADD COLUMN company_spec jsonb,
  ADD COLUMN enrichment_status text DEFAULT 'pending';

-- 2. demo_jobs — one per lead per pipeline run
CREATE TABLE demo_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  sales_user_id uuid REFERENCES sales_users(id),
  status text NOT NULL DEFAULT 'queued',
  current_phase text,
  progress int DEFAULT 0,
  phase_history jsonb DEFAULT '[]'::jsonb,
  demo_url text,
  demo_vercel_project_id text,
  demo_supabase_org_id uuid,
  reference_template_id uuid REFERENCES reference_templates(id),
  audit_results jsonb,
  email_draft_id uuid,
  error_message text,
  expires_at timestamptz DEFAULT (now() + interval '14 days'),
  engagement_count int DEFAULT 0,            -- email opens + demo clicks; extends expiry
  last_engaged_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_demo_jobs_status ON demo_jobs(status);
CREATE INDEX idx_demo_jobs_lead ON demo_jobs(lead_id);
CREATE INDEX idx_demo_jobs_expires ON demo_jobs(expires_at) WHERE status NOT IN ('expired','deleted');

-- 3. reference_templates — pre-cloned best-in-segment sites
CREATE TABLE reference_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  segment text NOT NULL,
  source_url text NOT NULL,
  source_label text,                          -- "Awwwards SOTD 2025-04", human label
  pre_cloned_path text NOT NULL,              -- absolute path on the host running pipeline
  aesthetic_tier int NOT NULL DEFAULT 3,      -- 1-5, sort key within segment
  xfly_check_score int,                       -- last quality score for this template
  ref_map_path text,                          -- optional --map json
  last_refreshed_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_reference_templates_segment ON reference_templates(segment) WHERE is_active;

-- 4. email_drafts — staged emails awaiting sales-user send
CREATE TABLE email_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  demo_job_id uuid REFERENCES demo_jobs(id) ON DELETE SET NULL,
  sales_user_id uuid REFERENCES sales_users(id),
  email_template_id uuid REFERENCES email_templates(id),
  subject text NOT NULL,
  body_html text NOT NULL,
  body_text text,
  variables jsonb,                            -- what was substituted, for audit
  status text NOT NULL DEFAULT 'draft',       -- draft | sent | revoked
  created_at timestamptz DEFAULT now(),
  sent_at timestamptz
);
CREATE INDEX idx_email_drafts_status ON email_drafts(status);
CREATE INDEX idx_email_drafts_lead ON email_drafts(lead_id);

-- 5. extend email_templates for segment + source filtering
ALTER TABLE email_templates
  ADD COLUMN segment text,
  ADD COLUMN lead_source text,
  ADD COLUMN swap_variables jsonb;

-- 6. demo_engagements — tracks opens/clicks; feeds engagement_count + last_engaged_at
CREATE TABLE demo_engagements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  demo_job_id uuid NOT NULL REFERENCES demo_jobs(id) ON DELETE CASCADE,
  event_type text NOT NULL,                   -- 'email_open' | 'demo_view' | 'admin_view'
  occurred_at timestamptz DEFAULT now(),
  metadata jsonb
);
CREATE INDEX idx_demo_engagements_job ON demo_engagements(demo_job_id);

-- 7. RLS — every demo table boundary-locked, service role only for pipeline writes
ALTER TABLE demo_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reference_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_engagements ENABLE ROW LEVEL SECURITY;
-- policies follow existing sales_users pattern: sales_users with role IN ('admin','sales') can SELECT/UPDATE
-- service role bypasses RLS for pipeline writes (existing pattern from commercial_offers)
```

### API surface

```
POST   /api/admin/demos                      → enqueue (auto-fires on lead create later)
GET    /api/admin/demos/:id                  → status + URLs + audit + draft
GET    /api/admin/demos?lead_id=...          → list for a lead
POST   /api/admin/demos/:id/retry            → retry from failed phase
DELETE /api/admin/demos/:id                  → manual teardown
POST   /api/admin/demos/:id/draft/send       → sales user clicks Send
POST   /api/admin/demos/:id/draft/revoke     → discard draft

POST   /api/admin/references                 → add reference template (admin tool)
GET    /api/admin/references?segment=...     → list by segment
POST   /api/admin/references/:id/refresh     → re-xray to update pre_cloned_path

GET    /api/track/demo/:job_id/open.gif      → email open beacon (1x1 transparent)
GET    /api/track/demo/:job_id/click         → demo URL click → 302 to actual URL
```

### Sales user UI — `/sales/leads/[id]`

Four panels, one screen, one decision:

1. **Demo preview** — iframe of demo URL, "Open in new tab" link, regenerate button.
2. **Audit summary** — top 3-5 findings from `audit_results`, each with severity + one-line fix.
3. **Email draft** — subject + body, editable in place (saves to `email_drafts.body_html`). Variables highlighted.
4. **Lead context** — name, company, source, existing-site screenshot for visual comparison.

Bottom action bar: `Send` (primary) / `Save draft` / `Discard` / `Regenerate demo`.

### Engagement-driven expiry extension

When `demo_engagements` records an event, trigger fires:

```sql
CREATE FUNCTION extend_demo_expiry() RETURNS trigger AS $$
BEGIN
  UPDATE demo_jobs
  SET engagement_count = engagement_count + 1,
      last_engaged_at = NEW.occurred_at,
      expires_at = greatest(expires_at, NEW.occurred_at + interval '14 days')
  WHERE id = NEW.demo_job_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER demo_engagement_extends_expiry
  AFTER INSERT ON demo_engagements
  FOR EACH ROW EXECUTE FUNCTION extend_demo_expiry();
```

### Teardown cron

Every hour, `teardown-cron.ts` runs:

```
SELECT id, demo_vercel_project_id, demo_supabase_org_id
FROM demo_jobs
WHERE status = 'sent' AND expires_at < now() AND status != 'deleted';
```

For each row: delete Vercel project via `vercel projects rm`, delete demo org rows from Supabase, set `status = 'deleted'`.

## Risks + mitigations

| Risk                                                                                                 | Mitigation                                                                                                                                                            |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| xray --ship auto-fix can self-blind validator (memory: `feedback_xray_v54_ship_after_autofix.md`)    | Pipeline runs `xray-validate.js` after `--ai-fix` and requires score ≥ 90 before proceeding; on fail, skip ai-fix and ship the cleaner pre-fix output.                |
| Vercel project sprawl from per-demo deploys                                                          | 14-day teardown cron + auto-delete on lead.status = 'lost'.                                                                                                           |
| Demo URL broken when prospect opens email (race between deploy + send)                               | Sales-user review gate (chosen design) catches this. Pipeline also runs `xray-api-validate.js --strict` post-deploy and only sets `draft_ready` if all phases green.  |
| Same-segment reference selection requires ongoing curation                                           | Start with 5 segments we sell into (tourism, ecom, law-firm, dental, agency). Admin UI for adding refs. Monthly `--refresh` cron.                                     |
| Single Supabase project for all demo orgs → cross-tenant data leak via misconfigured RLS             | RLS `USING (false)` defaults on every demo table (memory: `feedback_rls_as_boundary.md`). Demo org access via security-definer RPC scoped by `demo_org_id` JWT claim. |
| Outbound email tested with real `to:` → spam-trap risk (memory: `feedback_outbound_email_safety.md`) | Resend integration uses sales_user's email as `to:` during smoke tests; real recipient only on explicit Send click. Custom User-Agent on Resend calls.                |
| LLM-classified segment misfires → wrong reference template                                           | Sales user sees the segment + reference name in the review UI; one-click "Pick different template".                                                                   |

## Open questions deferred to next iteration

- **Lead-source-triggered routing** (cold vs warm) — start with all leads going through full pipeline; refine if cost demands it.
- **Multi-lingual email templates** — `src/emails/` already has `-ge` variants for KA; drafter picks based on `leads.locale`.
- **Demo with real product (chat-brain memory, voice chat) vs static seeded data** — start with seeded data; layer in chat-brain in v2 once base pipeline is shipped.

## Migration order

See companion plan: `docs/superpowers/plans/2026-05-25-sales-demo-pipeline-plan.md`.
