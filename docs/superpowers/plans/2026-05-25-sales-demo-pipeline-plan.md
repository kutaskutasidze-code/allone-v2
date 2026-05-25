# Sales → Personalized Demo Pipeline — Build Plan

**Spec:** `docs/superpowers/specs/2026-05-25-sales-demo-pipeline-design.md`
**Branch:** `feat/sales-demo-pipeline`
**Pattern:** Ship in vertical slices that always leave the system runnable.

## Slice order (each slice = one PR-able checkpoint)

### Slice 1 — Data model

**Goal:** Tables exist, RLS locked, migrations run cleanly.
**Deliverables:**

- `supabase/migrations/20260525000000_sales_demo_pipeline.sql` — all 6 schema changes from spec.
- Smoke: `pnpm supabase migration up` succeeds; `SELECT count(*) FROM demo_jobs` returns 0.

### Slice 2 — offer-generator module skeletons

**Goal:** New modules compile and export typed stubs; no behavior yet.
**Deliverables:**

- `offer-generator/src/enricher/index.ts` — `enrichCompanySpec(leadId, analysisResult): Promise<CompanySpec>`
- `offer-generator/src/references/index.ts` — `pickReference(segment): Promise<ReferenceTemplate>`, `refreshReference(id)`
- `offer-generator/src/cloner/index.ts` — `cloneSite(url, outDir, onProgress)` — wraps `xray-pipeline.js`
- `offer-generator/src/skinner/index.ts` — `skinClone(refPath, companySpec, outDir)` — wraps `xfly.js`
- `offer-generator/src/admin-wirer/index.ts` — `wireAdmin(outDir, demoOrgId, segment)`
- `offer-generator/src/deployer/index.ts` — `deployToVercel(dir, projectName): Promise<{url, projectId}>`
- `offer-generator/src/email-drafter/index.ts` — `draftEmail(leadId, demoJobId, variables): Promise<EmailDraft>`
- `offer-generator/src/demo-pipeline.ts` — sequential orchestrator skeleton; only updates phase_history.
- `offer-generator/src/database/demo-jobs.repo.ts` + `references.repo.ts` + `email-drafts.repo.ts`
- Smoke: `pnpm build` (in offer-generator) succeeds; existing offer pipeline still works.

### Slice 3 — cloner + skinner (real subprocess wiring)

**Goal:** Given a URL + a companySpec, produce a deployable directory.
**Deliverables:**

- `cloner/index.ts` spawns `node /Users/macintoshi/Projects/site-xray/xray-pipeline.js <url> --out <dir> --no-ai-fix`, streams stdout, parses phase log lines into structured events.
- `skinner/index.ts` spawns `node /Users/macintoshi/Projects/site-xray/xfly.js --template <refDir> --company <jsonFile> --out <outDir>`, then runs `xfly-check.js` and parses the score.
- `enricher/index.ts` maps offer-generator's existing `company-researcher` + `html-analyzer` output into the `CompanySpec` shape xfly expects (`{name, tagline, phone, email, services[], domain, color, logo}`).
- Smoke test: end-to-end CLI script `pnpm tsx scripts/test-clone-skin.ts <ref-url> <target-url>` produces a working dir at `/tmp/demo-test/`.

### Slice 4 — references library + seed

**Goal:** `reference_templates` populated with at least 2 segments worth of pre-clones.
**Deliverables:**

- `references/index.ts` `pickReference` queries `reference_templates WHERE segment=$1 AND is_active ORDER BY aesthetic_tier DESC, last_refreshed_at DESC LIMIT 1`.
- `references/index.ts` `refreshReference(id)` re-runs xray-pipeline against `source_url`, updates `pre_cloned_path` + `last_refreshed_at`.
- One-shot seed script: `pnpm tsx scripts/seed-references.ts` — pre-clones 2 manually chosen reference URLs (one tourism, one ecom) into `~/Vault/refs/<segment>/<slug>/`, inserts rows.
- API: `POST /api/admin/references` (allone-website Next.js), `GET /api/admin/references?segment=`.

### Slice 5 — deployer + Vercel teardown

**Goal:** A demo dir becomes a live URL; expired demos can be destroyed.
**Deliverables:**

- `deployer/index.ts` shells `vercel deploy <dir> --prod --token $VERCEL_TOKEN --scope allonelabs --name demo-<slug>`, captures URL and project ID.
- `teardown-cron.ts` runs `vercel projects rm <id> --yes` for each expired demo_job.
- Manual smoke: run deployer against the dir from Slice 3, confirm `<slug>.vercel.app` resolves; run teardown, confirm 404.

### Slice 6 — admin-wirer (BF shell + seeded demo data)

**Goal:** Demo includes `/admin` route with logged-in BF shell against demo-scoped data.
**Deliverables:**

- `admin-wirer/index.ts` copies BF `shell-zone` snapshot into `<demoDir>/admin/`, writes per-demo `.env` with `DEMO_ORG_ID` + Supabase creds, runs build.
- Segment-aware seed: `admin-wirer/seeds/tourism.ts`, `seeds/ecom.ts` — each generates fake `hotels`/`orders` or `products`/`orders` rows scoped to `demo_org_id`.
- BF shell `core/org-rls` must already support reading `DEMO_ORG_ID` from env — if not, smallest-possible patch upstream in BF.
- Smoke: deploy a Slice 5 demo with admin wired; log in via demo-org JWT; see seeded data.

### Slice 7 — email-drafter + drafts table

**Goal:** Pipeline produces a saved draft pointing at the deployed URL + audit findings.
**Deliverables:**

- `email-drafter/index.ts` selects `email_templates` row by `(segment, lead_source)`, substitutes `{{lead.name}}`, `{{lead.company}}`, `{{audit.top_3}}`, `{{demo.url}}`, `{{offer.url}}` (offer PDF from existing commercial_offers if present).
- One new email template seed per segment: `tourism-cold.html`, `ecom-cold.html` etc. with `swap_variables` declared.
- Writes to `email_drafts` table, status=draft, links `demo_job_id` and `lead_id`.
- API: `GET /api/admin/demos/:id/draft` returns the draft for the sales UI.

### Slice 8 — orchestrator (the demo-pipeline.ts seam)

**Goal:** `runDemoPipeline(demoJobId)` executes all phases with state checkpoints + parallel audit.
**Deliverables:**

- `demo-pipeline.ts` calls enricher → in parallel { skinner+deployer chain | analyzer } → wirer → email-drafter, updating `demo_jobs.current_phase` + `phase_history` after each.
- New Express route in offer-generator: `POST /demos/:id/run` enqueues and runs.
- New Next.js API in allone-website: `POST /api/admin/demos` creates `demo_jobs` row + calls offer-generator's `/demos/:id/run`.
- Failure handler writes `error_message` + `failed` status; retry endpoint resumes from `current_phase`.
- End-to-end smoke: create a lead, POST to `/api/admin/demos`, poll until `draft_ready`, verify demo URL + draft.

### Slice 9 — Sales UI panels on /sales/leads/[id]

**Goal:** One-screen review interface.
**Deliverables:**

- `src/components/sales/DemoPanel.tsx` — iframe + open-in-tab + regenerate.
- `src/components/sales/AuditPanel.tsx` — top findings list.
- `src/components/sales/DraftPanel.tsx` — editable subject + body, save-on-blur.
- `src/components/sales/LeadContextPanel.tsx` — existing-site screenshot + lead meta.
- `src/app/sales/leads/[id]/page.tsx` extended with 4-panel layout when `demo_jobs.status='draft_ready'`.
- Bottom bar with `Send`, `Save draft`, `Discard`, `Regenerate`.
- Polls `/api/admin/demos/:id` every 3s while status is in-progress; stops on terminal state.

### Slice 10 — Send + tracking

**Goal:** Sales user clicks Send; email goes out; opens + clicks tracked.
**Deliverables:**

- `POST /api/admin/demos/:id/draft/send` — sends email via existing Resend integration; injects open beacon + click-tracking wrapper around `{demo.url}`.
- `GET /api/track/demo/:job_id/open.gif` — 1x1 GIF response, inserts `demo_engagements` row.
- `GET /api/track/demo/:job_id/click` — 302 to actual demo URL, inserts engagement row.
- Trigger from spec already handles expiry extension.
- Smoke: send to self, open in mail client, click; verify `demo_engagements` rows and updated `expires_at`.

### Slice 11 — Auto-trigger from lead create

**Goal:** New lead → demo job auto-enqueued.
**Deliverables:**

- Supabase trigger or Next.js API hook in `POST /api/sales/leads` that calls offer-generator's enqueue endpoint with the new `lead_id`.
- Bypass for leads imported in bulk (so we don't burn cost on bad data).
- Smoke: create a lead via the existing UI; observe demo_jobs row appears with status=queued.

### Slice 12 — Teardown + lifecycle hardening

**Goal:** Stable steady-state; nothing leaks.
**Deliverables:**

- `teardown-cron.ts` deployed as cron in offer-generator host.
- Sales-side "lost" status → immediate teardown.
- Cost panel hook into founder-brain (optional) so pipeline cost shows up in `brain cost`.
- Operational README in `offer-generator/README.md`.

## Cross-cutting

- **Tests:** vitest in offer-generator for each module. Smoke tests over real subprocess calls in `tests/integration/` gated by `RUN_INTEGRATION=1`.
- **Logging:** offer-generator already uses winston; reuse logger for all new modules.
- **Env:** new vars — `VERCEL_TOKEN` (Keychain `vercel-api-token`), `XRAY_BIN_DIR` (default `~/Projects/site-xray`), `BF_SHELL_PATH` (default `~/Desktop/Claude/business-forge/shell-zone`), `REFS_ROOT` (default `~/Vault/refs`).
- **Commits:** one per slice; push at every 2-3 slices; tag `demo-pipeline-v1` after Slice 10.

## Where to start now

Slice 1 (migration) → Slice 2 (module skeletons + first commit checkpoint). After that, Slice 3 is the riskiest cell — proving the cloner+skinner subprocess wiring against a real reference URL. Land Slice 3 with a smoke script before sinking time into 4-7.

## Out of scope for v1

- Multi-language demos (KA/RU). Demo is in the language of the reference + lead's locale via xfly's existing logic.
- AI-tailored offer content. v1 uses existing `commercial_offers` PDF if present, links to it from email. Generation triggered manually by sales user from existing admin/offers UI.
- Slack/Linear notifications on `draft_ready`. v1 = in-app + email-to-self.
- A/B testing of email templates. v1 = one template per (segment, source).
