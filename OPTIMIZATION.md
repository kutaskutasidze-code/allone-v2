# Optimization branch — working context

> Handoff notes for the `optimization` branch. Read this before starting.
> General project conventions live in `CLAUDE.md`; this file is only the
> optimization-specific context.

## Mission

Improve the performance of the app (allonelabs.com — Next.js 16 / App Router).
The **specific focus is not locked in yet** — pick a track from
[Candidate tracks](#candidate-tracks) below (or confirm with the owner). The
signals in that section were gathered from a quick pass so you can start with
real data instead of guessing.

## Status & first steps

- This branch was cut from `master` **before** the dark-mode work merged, so it
  is **3 commits behind** `origin/master`.
- **Step 0: sync with master first.** It now contains the dark-mode fixes *and*
  a build fix (`src/lib/supabase/admin.ts` now stubs the admin Supabase client
  when env is absent — without it, `next build` crashes on Vercel Preview). You
  want both before profiling.
  ```bash
  git fetch origin
  git rebase origin/master        # or: git merge origin/master
  ```
- There is an existing **`origin/perf-optimized`** branch — check what prior
  optimization work exists there and reconcile before duplicating effort:
  ```bash
  git log origin/perf-optimized --oneline -20
  git diff master...origin/perf-optimized --stat
  ```

## Local dev environment (this machine — Windows 11)

This was a fresh clone; the toolchain was set up from scratch. Key gotchas:

- **Node** v24.18.0 (installed via `winget install OpenJS.NodeJS.LTS`).
  **pnpm** 11.10.0 (installed via `npm i -g pnpm`). Both are on PATH only after
  loading machine+user PATH in a new shell.
- **`pnpm dev` / `pnpm build` do NOT work directly** here: pnpm's
  `verify-deps-before-run` re-runs `pnpm install`, which exits 1 because of
  ignored native build scripts (`esbuild`, `sharp`, `unrs-resolver`). Either run
  `pnpm approve-builds` once, or invoke Next directly (what we've been doing).
- **Do NOT use Turbopack on this machine.** The default `next dev`/`next build`
  (Turbopack) **panics on Windows**: `FATAL: create symlink to …/jsdom` (Windows
  blocks symlinks without Developer Mode). This 500s any page that transitively
  imports `jsdom` (e.g. `/sales/dashboard`, `/sales/leads`). **Always pass
  `--webpack`.** (Alternative: enable Windows Developer Mode to allow symlinks.)

### Run / build / test commands (verified working)

```bash
# from C:\Users\gigiu\allone-website
node ./node_modules/next/dist/bin/next dev  --webpack -p 3001   # dev  → http://localhost:3001
node ./node_modules/next/dist/bin/next build --webpack          # prod build (compile ~47s, static gen ~3s)
node ./node_modules/eslint/bin/eslint.js <files>                # lint (pnpm lint hits the same pre-check issue)
```

- **`.env.local`** exists (gitignored) with real Supabase creds:
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable),
  `SUPABASE_SERVICE_ROLE_KEY` (secret). Supabase project ref
  `cywmdjldapzrnabsoosd`.
- **Sales panel test login** (for driving `/sales/*`, which is auth-gated):
  `tato.dzagnidze@allonelabs.com` / `Allone2026!` at `/sales/login`.
- **Screenshots / browser driving:** Playwright via the Edge channel needs no
  browser download — `require('@playwright/test').chromium.launch({ channel: 'msedge' })`.
  Throwaway harness scripts go in the scratchpad, not the repo.

## Candidate tracks

Numbers below are from a quick scan (`grep`/`wc`), not a profiler. Get exact
per-route **First Load JS** by wiring up `@next/bundle-analyzer` (Next 16's
`--webpack` build output shows the route tree but not sizes).

### A. Client bundle / runtime (most likely biggest win)
- **`framer-motion` is imported in 69 files** — by far the heaviest client dep
  footprint. Audit for `LazyMotion`/`m` (tree-shakeable) vs full `motion`, and
  code-split animation-only components.
- **3D/heavy visuals:** `three` (7 files) + `@react-three/*` + `@splinetool/*`.
  Confirm these are `dynamic(() => …, { ssr: false })` and load only on the
  page(s) that need them (landing/hero), not in shared bundles.
- **`recharts` (6 files)** — lazy-load on analytics/dashboard routes.
- **88 of 551 source files are `"use client"`** — audit for over-clientization;
  push data-only components back to Server Components.
- **Large components to split:** `bf-shell/AppChatPane.tsx` (2501 lines),
  `sales/proposals/ProposalsContent.tsx` (1244), `(main)/landing/page.tsx` (1321).

### B. i18n payload
- **`src/lib/i18n/dict.ts` is 3766 lines** (largest file in the repo). If the
  whole dictionary ships to the client, that's a large payload — consider
  splitting by namespace/route and lazy-loading the active locale.

### C. Heavy server-only deps (keep them off the client)
- `exceljs`, `pdf-lib`, `mammoth`, `unpdf`, `pdf-parse` are large. Each is used
  in only 1–2 files today — verify none leak into a client bundle (they should
  stay in route handlers / server actions only).

### D. Data / Supabase
- Look for N+1 queries and `select('*')` over-fetching, especially in
  `lib/sales-chat-tools.ts` (1135 lines) and the admin/sales leads pages.
- Review caching: which routes are `ƒ` (dynamic, SSR every request) vs `○`
  (static) in the build output — add `revalidate`/caching where safe.

### E. Build / dev tooling (DX, not runtime)
- The Turbopack-on-Windows symlink panic (above). Fixing it (Developer Mode or a
  Turbopack/pnpm config) would restore faster local builds.

## Related context (already shipped to `master`)

- **PR #3 — "Fix dark mode across the sales panel"** (merged, live). Reworked the
  `/sales` + `/admin` dark theme: activates the `.dark` class in sync with
  `data-theme`, adds dark flips for the ALLONE tokens, badge/alert overrides, and
  a build fix for the admin Supabase client. Relevant if optimization touches the
  shell or `globals.css`.
