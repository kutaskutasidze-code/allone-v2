# Multi-stage build for the allone-offer-generator service.
# Final image runs Node 20 + Chromium + the vendored site-xray scripts the
# cloner shells out to.

# ── Stage 1: install deps + compile TypeScript ─────────────────────
FROM node:20-bookworm-slim AS build
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

# offer-generator package
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src
COPY scripts ./scripts
RUN pnpm build

# ── Stage 2: runtime ──────────────────────────────────────────────
FROM node:20-bookworm-slim AS runtime
WORKDIR /app

# Chromium + fonts (Puppeteer needs the .so libs even when we use the
# system chromium binary). bookworm-slim has these in apt.
RUN apt-get update && apt-get install -y --no-install-recommends \
      chromium \
      ca-certificates \
      curl \
      fonts-liberation \
      fonts-noto-color-emoji \
      libnss3 \
      libatk-bridge2.0-0 \
      libcups2 \
      libxkbcommon0 \
      libxcomposite1 \
      libxdamage1 \
      libxfixes3 \
      libxrandr2 \
      libgbm1 \
      libgtk-3-0 \
      libpango-1.0-0 \
      libcairo2 \
      libasound2 \
    && rm -rf /var/lib/apt/lists/*

# Vercel CLI — used by the deployer module to push each demo to Vercel.
RUN npm install -g vercel@latest

# Tell Puppeteer to use the apt-installed Chromium instead of trying to
# download its own (saves ~300MB).
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
# Site-xray scripts live in /opt/site-xray; offer-generator points its
# XRAY_BIN_DIR at it via env (set in fly.toml).
ENV XRAY_BIN_DIR=/opt/site-xray

RUN corepack enable && corepack prepare pnpm@9 --activate

# Vendor site-xray scripts. The build context (.dockerignore) excludes
# the heavy clone-output folders so this stays under ~150MB.
COPY vendor/site-xray /opt/site-xray
RUN cd /opt/site-xray && pnpm install --frozen-lockfile --prod || \
    cd /opt/site-xray && npm install --omit=dev

# offer-generator runtime deps
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./

ENV NODE_ENV=production
ENV PORT=3100
EXPOSE 3100

CMD ["node", "dist/index.js"]
