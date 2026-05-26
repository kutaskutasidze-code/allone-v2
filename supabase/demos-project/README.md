# `supabase/demos-project/`

> **Migrations in this directory apply to the DEDICATED DEMOS Supabase project,
> NOT the sales/website project (`cywmdjldapzrnabsoosd`).**

The sales→personalized demo pipeline writes seeded demo data into a separate
Supabase project so it cannot co-mingle with sales PII. Decision recorded
2026-05-26 in `docs/superpowers/specs/2026-05-25-sales-demo-pipeline-design.md`.

## Setup

1. Create a fresh Supabase project at supabase.com (Allone Labs team).
2. Note the project ref + URL + service role key.
3. Set in `offer-generator/.env`:
   ```
   DEMO_SUPABASE_URL=https://<demo-ref>.supabase.co
   DEMO_SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
   ```
4. Set on allone-website's Vercel env (for the shared admin route):
   ```
   NEXT_PUBLIC_DEMO_SUPABASE_URL=https://<demo-ref>.supabase.co
   DEMO_SUPABASE_ANON_KEY=<anon-key>
   ```
5. Apply the migrations against the demo project. Easiest:
   ```bash
   PGSERVICE=demos supabase db push --db-url "postgresql://postgres.<demo-ref>:<password>@aws-...pooler.supabase.com:6543/postgres" \
     --workdir supabase/demos-project
   ```
   Or paste each `.sql` file into the project's SQL editor.

## What lives here

Tables for the seeded segments (extend as we add more):

- **`demo_orgs`** — one row per active demo, carries brand color/logo/segment.
  Read by the shared admin via `?demo=<demoJobId>` to resolve org → brand.
- **Tourism** — `hotels`, `contacts`, `orders`, `audit_log` (matches
  travelplace-bf's schema shape).
- **Ecom** — `products`, `customers`, `orders`, `stock_movements` (matches
  BF ecom-forge shape; `orders` is shared with tourism since both use it).

RLS is enabled but permissive within the demos project — every row is fake
data and the project itself is the boundary.
