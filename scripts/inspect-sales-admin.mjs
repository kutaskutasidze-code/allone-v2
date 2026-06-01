// Render-test for /sales and /admin against production (allonelabs.com).
// Generates a Supabase magic link for an admin user, follows it to capture
// access/refresh tokens, then visits each surface with the cookie set on
// the production domain and reports what actually rendered.

import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "luka.adamia@allonelabs.com";
const BASE = process.env.BASE_URL || "https://www.allonelabs.com";
const OUT = process.env.OUT_DIR || "/tmp/allone-shots";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

await fs.mkdir(OUT, { recursive: true });

// 1. Generate magic link
const linkRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
  method: "POST",
  headers: {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    type: "magiclink",
    email: ADMIN_EMAIL,
    options: { redirect_to: `${BASE}/sales` },
  }),
});
const linkJson = await linkRes.json();
const actionLink = linkJson?.properties?.action_link || linkJson?.action_link;
if (!actionLink) {
  console.error("No action_link:", JSON.stringify(linkJson));
  process.exit(2);
}
console.log("magic link generated for", ADMIN_EMAIL);

// 2. Hit /verify endpoint and capture the redirect target with tokens
const verifyRes = await fetch(actionLink, { redirect: "manual" });
const loc = verifyRes.headers.get("location");
if (!loc) {
  console.error(
    "No redirect from verify:",
    verifyRes.status,
    await verifyRes.text(),
  );
  process.exit(3);
}
console.log("verify redirected to (truncated):", loc.slice(0, 80) + "…");

// Tokens are in the URL fragment after #
const tokenFragment = loc.split("#")[1] || "";
const tokens = Object.fromEntries(new URLSearchParams(tokenFragment));
const accessToken = tokens.access_token;
const refreshToken = tokens.refresh_token;
if (!accessToken) {
  console.error("No access_token in:", loc);
  process.exit(4);
}
console.log("access_token captured (", accessToken.length, "chars)");

// 3. Launch browser + set the Supabase auth cookie on allonelabs.com
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 RenderTest",
});
const page = await ctx.newPage();

// @supabase/ssr stores the session as a base64-encoded JSON string in a
// cookie named "sb-<project-ref>-auth-token". Value is prefixed with
// "base64-" and chunked across .0/.1/... cookies when > ~3180 chars.
const projectRef = new URL(SUPABASE_URL).hostname.split(".")[0];
const cookieBase = `sb-${projectRef}-auth-token`;
const jwtPayload = JSON.parse(
  Buffer.from(accessToken.split(".")[1], "base64url").toString("utf8"),
);
const sessionObj = {
  access_token: accessToken,
  token_type: "bearer",
  expires_in: parseInt(tokens.expires_in || "3600", 10),
  expires_at:
    parseInt(tokens.expires_at || "0", 10) ||
    Math.floor(Date.now() / 1000) + parseInt(tokens.expires_in || "3600", 10),
  refresh_token: refreshToken,
  user: {
    id: jwtPayload.sub,
    aud: jwtPayload.aud,
    email: jwtPayload.email,
    role: jwtPayload.role,
    user_metadata: jwtPayload.user_metadata || {},
    app_metadata: jwtPayload.app_metadata || {},
  },
};
const encoded =
  "base64-" + Buffer.from(JSON.stringify(sessionObj)).toString("base64");
const CHUNK = 3180;
const parts = [];
for (let i = 0; i < encoded.length; i += CHUNK)
  parts.push(encoded.slice(i, i + CHUNK));
const cookiesToSet =
  parts.length === 1
    ? [{ name: cookieBase, value: parts[0] }]
    : parts.map((value, i) => ({ name: `${cookieBase}.${i}`, value }));
await ctx.addCookies(
  cookiesToSet.map((c) => ({
    name: c.name,
    value: c.value,
    domain: new URL(BASE).hostname,
    path: "/",
    httpOnly: false,
    secure: true,
    sameSite: "Lax",
  })),
);
console.log("cookies set:", cookiesToSet.map((c) => c.name).join(", "));

// 4. Visit each surface, screenshot, capture text + errors
const routes = [
  "/sales",
  "/sales/dashboard",
  "/sales/leads",
  "/sales/demos",
  "/admin",
  "/admin/dashboard",
];
const report = [];
page.on("console", (msg) => {
  if (msg.type() === "error" || msg.type() === "warning") {
    report.push({ type: msg.type(), text: msg.text() });
  }
});
const failedRequests = [];
page.on("response", (resp) => {
  if (resp.status() === 404) {
    failedRequests.push({ url: resp.url(), status: resp.status() });
  }
});

for (const route of routes) {
  const url = BASE + route;
  console.log("\n→", url);
  const consoleErrors = [];
  const tempListener = (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  };
  page.on("console", tempListener);
  let finalUrl = null;
  let title = null;
  let bodyText = null;
  let httpStatus = null;
  try {
    const resp = await page.goto(url, {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    httpStatus = resp?.status();
    finalUrl = page.url();
    title = await page.title();
    bodyText = await page.evaluate(() => {
      const main = document.querySelector("main") || document.body;
      return (main.innerText || "").slice(0, 1500);
    });
    const slug = route.replace(/[^a-z0-9]/gi, "_") || "root";
    await page.screenshot({
      path: path.join(OUT, `${slug}.png`),
      fullPage: true,
    });
  } catch (err) {
    bodyText = `[error] ${err.message}`;
  }
  page.off("console", tempListener);
  const routeFailures = failedRequests.splice(0);
  report.push({
    route,
    finalUrl,
    httpStatus,
    title,
    bodyText,
    consoleErrors,
    failedRequests: routeFailures,
  });
}

await browser.close();

console.log("\n=== REPORT ===\n");
for (const r of report) {
  if (!("route" in r)) {
    console.log(`[${r.type}] ${r.text}`);
    continue;
  }
  console.log(`route: ${r.route}`);
  console.log(`  finalUrl: ${r.finalUrl}`);
  console.log(`  status: ${r.httpStatus}`);
  console.log(`  title: ${r.title}`);
  if (r.consoleErrors.length) {
    console.log(`  console errors:`);
    r.consoleErrors
      .slice(0, 5)
      .forEach((e) => console.log(`    - ${e.slice(0, 200)}`));
  }
  if (r.failedRequests && r.failedRequests.length) {
    console.log(`  404s (${r.failedRequests.length}):`);
    r.failedRequests.slice(0, 8).forEach((f) => console.log(`    - ${f.url}`));
  }
  if (r.bodyText) {
    const preview = r.bodyText
      .split("\n")
      .filter((l) => l.trim())
      .slice(0, 12)
      .join(" | ");
    console.log(`  body: ${preview.slice(0, 400)}…`);
  }
  console.log();
}
console.log(`screenshots in ${OUT}`);
