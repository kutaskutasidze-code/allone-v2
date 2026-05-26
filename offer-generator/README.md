# allone-offer-generator

Node Express service that backs:

1. **Commercial offers** — `/api/offers/*` — analyzes a target site, generates
   a Claude-authored proposal, renders PDF via Puppeteer, uploads to Supabase
   Storage. (Original purpose of the service.)
2. **Sales → personalized demo pipeline** — `/api/demos/*` + `/api/references/*` —
   clones a same-segment reference site (via `site-xray`), skins it to the
   lead's branding (via `xfly`), wires the BF admin shell, deploys to Vercel,
   audits the lead's existing site, drafts an email, surfaces for one-click
   human-review send. (Spec: `docs/superpowers/specs/2026-05-25-sales-demo-pipeline-design.md`.)

## Running locally

```bash
pnpm install
cp .env.example .env.local        # then fill in the values below
pnpm dev                          # tsx watch src/index.ts on port 3100
```

## Environment variables

| var                              | purpose                                                                        | required?  |
| -------------------------------- | ------------------------------------------------------------------------------ | ---------- |
| `PORT`                           | listen port (default 3100)                                                     | no         |
| `API_SECRET_KEY`                 | shared secret for the apiKeyAuth middleware                                    | **yes**    |
| `ANTHROPIC_API_KEY`              | offer analyzer + enricher classifier                                           | **yes**    |
| `SUPABASE_URL`                   | sales/website project                                                          | **yes**    |
| `SUPABASE_SERVICE_ROLE_KEY`      | sales/website service key                                                      | **yes**    |
| `XRAY_BIN_DIR`                   | path to `site-xray` checkout (default `~/Projects/site-xray`)                  | no         |
| `BF_SHELL_PATH`                  | path to BF `shell-zone` (default `~/Desktop/Claude/business-forge/shell-zone`) | no         |
| `REFS_ROOT`                      | where pre-cloned references live (default `~/Vault/refs`)                      | no         |
| `VERCEL_TOKEN`                   | `vercel-api-token` Keychain entry                                              | demos only |
| `VERCEL_TEAM`                    | default `allonelabs`                                                           | no         |
| `DEMO_SUPABASE_URL`              | dedicated Supabase project for demo orgs (NOT the sales project)               | demos only |
| `DEMO_SUPABASE_SERVICE_ROLE_KEY` | service key for the demos project                                              | demos only |
| `SHARED_ADMIN_URL`               | shared admin SPA URL — every demo links here with `?demo=<jobId>`              | demos only |
| `RESEND_API_KEY`                 | for sending drafts via Resend HTTP API                                         | send slice |
| `RESEND_FROM_ADDRESS`            | default From header                                                            | no         |
| `PUBLIC_SITE_URL`                | base for `/api/track/...` injected into outgoing emails                        | send slice |

## Demos: getting from zero to a working demo

1. Apply the migration on the sales-side Supabase project:
   `supabase/migrations/20260525000000_sales_demo_pipeline.sql`.
2. Provision a separate Supabase project for demo data; set
   `DEMO_SUPABASE_URL` + `DEMO_SUPABASE_SERVICE_ROLE_KEY`. Create the demo-side
   tables (`demo_orgs`, `hotels`, `contacts`, `orders`, `audit_log` for
   tourism; `products`, `customers`, `stock_movements` for ecom).
3. Seed reference templates:
   ```bash
   pnpm tsx scripts/seed-references.ts
   ```
4. Seed cold-outreach email templates:
   ```bash
   pnpm tsx scripts/seed-email-templates.ts
   ```
5. Smoke clone+skin end to end:
   ```bash
   pnpm tsx scripts/test-clone-skin.ts https://wada-ama.org https://acme-clinic.com info@acme-clinic.com
   ```
6. Create a lead via the sales UI — pipeline auto-runs. Poll `/sales/leads/[id]`
   in your browser; the 4-panel review surfaces once `status=draft_ready`.

## Demo lifecycle (TL;DR)

- Lead created → `enqueueDemoJob` posts to `/api/demos` → pipeline runs.
- Pipeline writes `demo_jobs.phase_history` after each phase for resumability.
- Sales user reviews on `/sales/leads/[id]`, clicks **Send** → email goes out
  via Resend with `/api/track/...` wrappers around demo URLs.
- Engagement events extend `expires_at` by 14 days each.
- Vercel cron pings `/api/internal/demo-teardown` hourly (config in
  `allone-website/vercel.json`); the Next.js route forwards here to
  `POST /api/internal/teardown` which runs `runTeardownPass`.
- When a lead is marked `lost` in the sales UI, `teardownDemosForLead` fires
  immediately.

## Manual teardown / one-shot

```bash
pnpm tsx scripts/run-teardown.ts
```

Returns JSON `{ scanned, torn_down, failed, errors }`. Exit code 1 if any
teardowns failed.

## Module map

```
src/
  analyzer/        existing — perf / seo / a11y / security / html / company-research / tech
  generator/       existing — Claude-authored offer content
  pdf/             existing — Puppeteer render
  storage/         existing — Supabase upload
  enricher/        AnalysisData → CompanySpec + segment classifier
  references/      pickReference, refreshReference, listReferences, createReference
  cloner/          spawns site-xray's xray-pipeline.js + xray-api-validate.js
  skinner/         spawns xfly.js + xfly-check.js
  admin-wirer/     seeds demo_orgs row + segment data + injects /admin pill
    seeds/         tourism.ts (hotels/orders/contacts/audit), ecom.ts (products/orders)
  deployer/        spawns vercel CLI for deploy + projects rm
  email-drafter/   template picker + {{var}} substitution, drafts table writes
  sender/          Resend HTTP send + tracking URL injection
  demo-pipeline.ts orchestrates the phases sequentially with parallel audit
  teardown-cron.ts scans expired demo_jobs, tears down Vercel + unseeds
  routes/
    health.ts
    offers.ts       commercial offers (existing)
    references.ts   demos pipeline
    demos.ts        demos pipeline
    drafts.ts       demos pipeline
    internal.ts     demos pipeline (cron)
  database/
    client.ts        sales/website project
    demos-client.ts  dedicated demos project (NEW)
    offers.repo.ts
    demo-jobs.repo.ts
    references.repo.ts
    email-drafts.repo.ts
```

## Known gaps before going live

- `DEMO_SUPABASE_URL` + the demo-side tables must be provisioned manually.
- BF admin shell auto-deploy is out of scope for v1: we ship the shared
  `SHARED_ADMIN_URL` model and link every demo with `?demo=<jobId>`. Stand up
  the admin SPA separately and wire it to query `demo_orgs` for per-demo
  brand + data.
- Auth-replay (`xray --bake-session`) is not used in the v1 pipeline. If a
  reference template needs auth state to clone properly, capture it manually
  and store it in the reference's pre-cloned dir.
- Email send latency: Resend is fast, but tracking URLs add a hop. Make sure
  `PUBLIC_SITE_URL` resolves on the public internet before going live.
