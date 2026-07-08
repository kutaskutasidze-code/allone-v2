# Allone Website

> **On the `optimization` branch?** Read **`OPTIMIZATION.md`** first — it has the
> mission, the local dev setup for this machine (use `--webpack`, not Turbopack),
> test login, and the candidate optimization tracks with real signals. Step 0 is
> to sync this branch with `master` (it's a few commits behind).

## Build & Dev Commands
```bash
pnpm install          # Install dependencies (NOT npm — Vercel uses pnpm)
pnpm dev              # Dev server on port 3001
pnpm build            # Production build
pnpm lint             # ESLint
```

IMPORTANT: This project uses `pnpm`, not `npm`. Adding packages with `npm install` will desync the lockfile and break Vercel deploys. Always use `pnpm add`.

## Code Style
- Next.js App Router with `(main)` route group for public pages
- Tailwind CSS 4 for styling — use utility classes, avoid inline styles for layout
- Framer Motion for animations — use `motion` components, `useScroll`/`useTransform` for scroll-driven
- TypeScript strict mode — no `any` types
- `'use client'` directive required for components using hooks, motion, or browser APIs
- i18n: use `useI18n()` hook and `t('key')` for all user-facing text

## Shared vs Experiment Code
- IMPORTANT: Components in `src/components/` are shared across the live site. Do NOT modify them for experiments.
- For experiments, clone components into `src/app/(main)/hero-experiment/` and modify the copies.
- The live landing page is at `src/app/(main)/page.tsx` — do not change it during experiments.

## Fonts
- `font-display` — General Sans (headings)
- `font-body` — Plus Jakarta Sans (body text)
- `font-mono` — JetBrains Mono (code, labels)
- `font-heading` — Space Grotesk (angular headings)

## Key Patterns
- Glassy cards: `bg-white/15 backdrop-blur-2xl border border-white/30` with inset shadow
- Blue accent color: `#0ea5e9` (sky-500)
- Dark text: `#071D2F`
- Corner bracket decorations: 4 absolute-positioned divs with `border-t border-l` etc.
- Section borders: `border-[#0ea5e9]/25`

## Deployment
- Hosted on Vercel, auto-deploys from `master` branch
- Domain: allonelabs.com
- IMPORTANT: Run `pnpm build` before pushing to catch errors Vercel will hit

## Common Gotchas
- Tailwind v4 does not support escaped brackets in class names (e.g., `rounded-\[20px\]` in selectors). Use inline styles or direct class changes instead.
- The `(main)` layout wraps pages with Header, Footer, and providers — experiment pages inherit these.
- Canvas-based animations (MeshGradient) need `ResizeObserver` or per-frame size checks when inside scroll-expanding containers.
- `useTransform` with string CSS values (like `min(920px, calc(...))`) does not interpolate — use numeric pixel values from `useState` + `window.innerWidth`.

## Database
- Supabase project ref: `cywmdjldapzrnabsoosd`
- Schema in `supabase/schema.sql`, seed in `scripts/setup-db.mjs`
- Env vars in `.env.local` — never commit secrets
