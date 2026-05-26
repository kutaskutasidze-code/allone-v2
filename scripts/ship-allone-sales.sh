#!/usr/bin/env bash
# ship-allone-sales — one-shot setup for the sales+demo pipeline.
# Applies migrations, registers the Telegram webhook, runs the seeds, and
# prints what's left for the human to do manually.
#
# Usage:
#   bash scripts/ship-allone-sales.sh
#
# Env required (sourced from .env.local if not already set):
#   SUPABASE_DB_URL              postgres://... for the sales project
#   DEMO_SUPABASE_DB_URL         postgres://... for the dedicated demos project
#   TELEGRAM_BOT_TOKEN           from @BotFather
#   TELEGRAM_WEBHOOK_SECRET      any random string
#   PUBLIC_SITE_URL              https://allonelabs.com (or preview URL)

set -euo pipefail

cd "$(dirname "$0")/.."

note() { printf "\n\033[1;34m▸\033[0m %s\n" "$*"; }
warn() { printf "\033[1;33m⚠\033[0m %s\n" "$*"; }
ok()   { printf "\033[1;32m✓\033[0m %s\n" "$*"; }

# Pull env from .env.local if not already set.
if [ -f .env.local ]; then
  set -a
  # shellcheck disable=SC1091
  . .env.local
  set +a
fi

# ─────────────────────────────────────────────────────────────────────────────
# Sales-side migrations
# ─────────────────────────────────────────────────────────────────────────────

note "Applying sales-side Supabase migrations…"
if [ -z "${SUPABASE_DB_URL:-}" ]; then
  warn "SUPABASE_DB_URL not set — skipping sales-side migrations. Run them via Supabase Dashboard SQL editor."
else
  for f in supabase/migrations/20260525*.sql supabase/migrations/20260527*.sql; do
    [ -f "$f" ] || continue
    note "  $f"
    psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f "$f" >/dev/null && ok "$(basename "$f")"
  done
fi

# ─────────────────────────────────────────────────────────────────────────────
# Demos-project schema
# ─────────────────────────────────────────────────────────────────────────────

note "Applying demos-project schema…"
if [ -z "${DEMO_SUPABASE_DB_URL:-}" ]; then
  warn "DEMO_SUPABASE_DB_URL not set — skipping demos-project migration."
else
  psql "$DEMO_SUPABASE_DB_URL" -v ON_ERROR_STOP=1 \
    -f supabase/demos-project/migrations/20260526000000_demos_schema.sql >/dev/null \
    && ok "demos-project schema applied"
fi

# ─────────────────────────────────────────────────────────────────────────────
# Reference + email template seeds (offer-generator)
# ─────────────────────────────────────────────────────────────────────────────

if [ -d offer-generator ]; then
  note "Seeding email templates…"
  ( cd offer-generator && pnpm tsx scripts/seed-email-templates.ts ) && ok "email templates seeded"

  if [ "${SKIP_REF_SEED:-0}" = "1" ]; then
    warn "SKIP_REF_SEED=1 — skipping reference seed (it takes 5-10 min to clone)"
  else
    note "Seeding reference templates (takes 5-10 minutes — clones Singita + Allbirds)…"
    ( cd offer-generator && pnpm tsx scripts/seed-references.ts ) && ok "reference templates seeded"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# Telegram webhook
# ─────────────────────────────────────────────────────────────────────────────

note "Registering Telegram webhook…"
if [ -z "${TELEGRAM_BOT_TOKEN:-}" ] || [ -z "${TELEGRAM_WEBHOOK_SECRET:-}" ] || [ -z "${PUBLIC_SITE_URL:-}" ]; then
  warn "Missing TELEGRAM_BOT_TOKEN / TELEGRAM_WEBHOOK_SECRET / PUBLIC_SITE_URL — skipping."
  warn "Manual setup:"
  warn "  curl -X POST 'https://api.telegram.org/bot<TOKEN>/setWebhook' \\"
  warn "       -d url=<PUBLIC_SITE_URL>/api/telegram/webhook \\"
  warn "       -d secret_token=<SECRET>"
else
  response=$(curl -sS -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
    -d "url=${PUBLIC_SITE_URL}/api/telegram/webhook" \
    -d "secret_token=${TELEGRAM_WEBHOOK_SECRET}")
  if echo "$response" | grep -q '"ok":true'; then
    ok "Telegram webhook registered → ${PUBLIC_SITE_URL}/api/telegram/webhook"
  else
    warn "Telegram setWebhook response: $response"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# Manual leftovers
# ─────────────────────────────────────────────────────────────────────────────

note "Done. Manual steps that this script cannot do for you:"
cat <<'EOF'
  1. Set role='admin' on the sales_users rows that should get team rollups:
       UPDATE sales_users SET role='admin' WHERE email='YOU@allonelabs.com';

  2. Confirm Vercel Production env has:
       ANTHROPIC_API_KEY, RESEND_API_KEY, TELEGRAM_BOT_TOKEN,
       TELEGRAM_BOT_USERNAME, TELEGRAM_WEBHOOK_SECRET, CRON_SECRET,
       OFFER_API_URL, OFFER_API_KEY, PUBLIC_SITE_URL,
       VERCEL_TOKEN (for the demo deployer),
       DEMO_SUPABASE_URL, DEMO_SUPABASE_SERVICE_ROLE_KEY,
       NEXT_PUBLIC_DEMO_SUPABASE_URL, NEXT_PUBLIC_DEMO_SUPABASE_ANON_KEY.

  3. Open /sales → Connect Telegram. The bot will DM you a hello and the
     daily/weekly/monthly cadence kicks in at the next scheduled tick.
EOF
