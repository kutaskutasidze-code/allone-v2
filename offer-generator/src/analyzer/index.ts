// Static-HTML site analyzer. Fetches the page, runs Cheerio + heuristic
// checks for the technical audit, then calls Anthropic to summarize the
// company facts (name, industry, products). Returns AnalysisData shaped
// for both the enricher and the audit-summary downstream.
//
// Heavier checks (Lighthouse-style perf, real DOM accessibility) would
// need Puppeteer; we approximate them statically here so the service can
// run in a slim container. When we move to a Puppeteer-based deeper pass,
// keep the same AnalysisData contract so call sites don't change.

import * as cheerio from "cheerio";
import { logger } from "../utils/logger.js";
import { bridgeChat, bridgeConfigured } from "../utils/bridge.js";
import type { AnalysisData, Issue, IssueSeverity } from "../types/analysis.js";

const FETCH_TIMEOUT_MS = 15_000;
const UA =
  "Mozilla/5.0 (compatible; AlloneAnalyzer/1.0; +https://allonelabs.com)";

export type ProgressFn = (msg: string) => Promise<void> | void;

export async function analyzeWebsite(
  url: string,
  onProgress: ProgressFn = async () => {},
): Promise<AnalysisData> {
  await onProgress(`Fetching ${url}`);

  const fetchRes = await fetch(url, {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    redirect: "follow",
  });
  const finalUrl = fetchRes.url || url;
  const html = await fetchRes.text();
  const headers = fetchRes.headers;
  const $ = cheerio.load(html);

  await onProgress("Extracting company facts");
  const company = await extractCompanyFacts($, finalUrl, html);

  await onProgress("Detecting tech stack");
  const techStack = detectTechStack($, headers, html);

  await onProgress("Running technical checks");
  const technical = runTechnicalChecks($, headers, html, finalUrl);

  const scores = computeScores(technical);

  return {
    url: finalUrl,
    company,
    techStack,
    technical,
    scores,
  };
}

// ── Company facts ────────────────────────────────────────────────────
//
// Cheap path first: title, meta description, og: tags, JSON-LD
// Organization schema. If any of these have real content we use them
// directly. Anthropic only runs to *enrich* (fill gaps + extract
// products) so the cost stays bounded.

async function extractCompanyFacts(
  $: cheerio.CheerioAPI,
  url: string,
  rawHtml: string,
): Promise<AnalysisData["company"]> {
  // Quick wins
  const ogSiteName = $('meta[property="og:site_name"]').attr("content")?.trim();
  const ogTitle = $('meta[property="og:title"]').attr("content")?.trim();
  const ogDesc = $('meta[property="og:description"]').attr("content")?.trim();
  const metaDesc = $('meta[name="description"]').attr("content")?.trim();
  const docTitle = $("title").first().text().trim();

  // JSON-LD Organization
  let ldOrg: { name?: string; description?: string; industry?: string } = {};
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).text());
      const arr = Array.isArray(json) ? json : [json];
      for (const node of arr) {
        const t = node["@type"];
        const isOrg =
          t === "Organization" ||
          t === "Corporation" ||
          t === "LocalBusiness" ||
          (Array.isArray(t) && t.some((x) => x.includes("Organization")));
        if (isOrg && !ldOrg.name) {
          ldOrg = { name: node.name, description: node.description };
        }
      }
    } catch {
      /* ignore malformed ld+json */
    }
  });

  const seedName = ldOrg.name || ogSiteName || ogTitle || hostFromUrl(url);
  const seedDesc = ldOrg.description || ogDesc || metaDesc || docTitle;

  // Page body text (capped) for the LLM
  const bodyText = $("body").text().replace(/\s+/g, " ").trim().slice(0, 6000);

  // If the bridge isn't configured, return the seed values as-is.
  if (!bridgeConfigured()) {
    return {
      name: seedName || undefined,
      industry: undefined,
      description: seedDesc || undefined,
      products: [],
    };
  }

  // Company-fact enrichment via the claude-bridge (subscription-billed, no
  // Anthropic API credits). Output ONLY JSON.
  try {
    const reply = await bridgeChat(
      "You extract company facts from a website's text. Output ONLY JSON with this shape: " +
        '{ "name": string|null, "industry": string|null, "description": string|null, "products": string[] }. ' +
        "description should be 1-2 sentences. industry should be a noun phrase like 'photography studio' or 'B2B SaaS'. " +
        "products is up to 8 concise nouns/services the company sells. No commentary.",
      `URL: ${url}\nSeed name: ${seedName}\nSeed description: ${seedDesc}\n\n--- PAGE TEXT ---\n${bodyText}`,
    );
    const cleaned = reply.slice(reply.indexOf("{"), reply.lastIndexOf("}") + 1);
    const parsed = JSON.parse(cleaned) as Partial<AnalysisData["company"]> & {
      name?: string | null;
      industry?: string | null;
      description?: string | null;
      products?: unknown;
    };
    return {
      name: parsed.name ?? seedName ?? undefined,
      industry: parsed.industry ?? undefined,
      description: parsed.description ?? seedDesc ?? undefined,
      products: Array.isArray(parsed.products)
        ? (parsed.products as unknown[])
            .filter((x): x is string => typeof x === "string")
            .slice(0, 8)
        : [],
    };
  } catch (err) {
    logger.warn("analyzer: bridge enrichment failed; falling back to seeds", {
      error: err instanceof Error ? err.message : String(err),
      url,
    });
  }

  return {
    name: seedName || undefined,
    industry: undefined,
    description: seedDesc || undefined,
    products: [],
  };
}

// ── Tech stack ───────────────────────────────────────────────────────

function detectTechStack(
  $: cheerio.CheerioAPI,
  headers: Headers,
  html: string,
): AnalysisData["techStack"] {
  const frameworks: string[] = [];
  const generator = $('meta[name="generator"]').attr("content") || "";
  const poweredBy = headers.get("x-powered-by") || "";
  const server = headers.get("server") || "";

  // Frameworks (substring sniff — generous but cheap)
  if (
    html.includes("__NEXT_DATA__") ||
    generator.toLowerCase().includes("next")
  )
    frameworks.push("Next.js");
  if (html.includes("data-reactroot") || html.includes('id="__next"'))
    frameworks.push("React");
  if (html.includes("nuxt-")) frameworks.push("Nuxt");
  if (html.includes("data-vue")) frameworks.push("Vue");
  if (html.includes("ng-version")) frameworks.push("Angular");
  if (html.includes("svelte-")) frameworks.push("Svelte");
  if (poweredBy.toLowerCase().includes("express")) frameworks.push("Express");

  // CMS
  let cms: string | null = null;
  if (
    /wp-content|wp-includes|generator.*wordpress/i.test(html) ||
    generator.toLowerCase().includes("wordpress")
  )
    cms = "WordPress";
  else if (/shopify\.com|cdn\.shopify/i.test(html)) cms = "Shopify";
  else if (/wix\.com|wixsite/i.test(html)) cms = "Wix";
  else if (/squarespace\.com|squarespace-cdn/i.test(html)) cms = "Squarespace";
  else if (/webflow\.com|webflow\.io/i.test(html)) cms = "Webflow";
  else if (generator.toLowerCase().includes("drupal")) cms = "Drupal";
  else if (generator.toLowerCase().includes("joomla")) cms = "Joomla";

  // Platform (the host the server identifies as)
  let platform: string | null = null;
  if (/vercel/i.test(server) || headers.has("x-vercel-id")) platform = "Vercel";
  else if (/netlify/i.test(server) || headers.has("x-nf-request-id"))
    platform = "Netlify";
  else if (/cloudflare/i.test(server) || headers.has("cf-ray"))
    platform = "Cloudflare";
  else if (/cloudfront/i.test(server)) platform = "AWS CloudFront";
  else if (/fly\.io/i.test(server)) platform = "Fly.io";
  else if (/nginx/i.test(server)) platform = "nginx";
  else if (/apache/i.test(server)) platform = "Apache";

  return {
    platform,
    frameworks: Array.from(new Set(frameworks)),
    cms,
  };
}

// ── Technical checks ─────────────────────────────────────────────────

function runTechnicalChecks(
  $: cheerio.CheerioAPI,
  headers: Headers,
  html: string,
  url: string,
): AnalysisData["technical"] {
  const htmlIssues: Issue[] = [];
  const seoIssues: Issue[] = [];
  const performanceIssues: Issue[] = [];
  const securityIssues: Issue[] = [];
  const accessibilityIssues: Issue[] = [];
  const additionalIssues: Issue[] = [];

  // HTML hygiene
  if (!$("html").attr("lang")) {
    htmlIssues.push(
      issue(
        "warning",
        "html",
        "Missing <html lang> attribute",
        'Add lang to <html>, e.g. <html lang="en">.',
      ),
    );
  }
  if ($("head meta[charset]").length === 0) {
    htmlIssues.push(
      issue(
        "warning",
        "html",
        "No <meta charset> declared",
        'Add <meta charset="utf-8"> as the first child of <head>.',
      ),
    );
  }
  if ($('head meta[name="viewport"]').length === 0) {
    htmlIssues.push(
      issue(
        "critical",
        "html",
        "Missing viewport meta — site will render badly on mobile",
        'Add <meta name="viewport" content="width=device-width, initial-scale=1">.',
      ),
    );
  }

  // SEO
  const title = $("title").first().text().trim();
  if (!title) {
    seoIssues.push(
      issue(
        "critical",
        "seo",
        "Missing <title> tag",
        "Add a <title> with 30-60 characters describing the page.",
      ),
    );
  } else if (title.length < 10 || title.length > 70) {
    seoIssues.push(
      issue(
        "warning",
        "seo",
        `Title length is suboptimal (${title.length} chars)`,
        "Aim for 50-60 characters of unique, descriptive copy.",
      ),
    );
  }
  const desc = $('meta[name="description"]').attr("content")?.trim();
  if (!desc) {
    seoIssues.push(
      issue(
        "warning",
        "seo",
        "Missing meta description",
        'Add <meta name="description" content="..."> with 120-160 chars.',
      ),
    );
  } else if (desc.length < 50 || desc.length > 180) {
    seoIssues.push(
      issue(
        "info",
        "seo",
        `Meta description length is suboptimal (${desc.length} chars)`,
        "Aim for 120-160 characters.",
      ),
    );
  }
  if ($('link[rel="canonical"]').length === 0) {
    seoIssues.push(
      issue(
        "info",
        "seo",
        "No canonical URL specified",
        'Add <link rel="canonical" href="..."> to prevent duplicate-content issues.',
      ),
    );
  }
  if ($('meta[property^="og:"]').length < 3) {
    seoIssues.push(
      issue(
        "info",
        "seo",
        "Sparse Open Graph metadata",
        "Add og:title, og:description, og:image so the site previews properly when shared.",
      ),
    );
  }

  // Performance (static heuristics)
  const inlineStyleSize = $("style").text().length;
  if (inlineStyleSize > 50_000) {
    performanceIssues.push(
      issue(
        "warning",
        "performance",
        `${(inlineStyleSize / 1024).toFixed(0)}KB of inline CSS`,
        "Move large stylesheets to external files so the browser can cache them.",
      ),
    );
  }
  const blockingScripts = $(
    "head script[src]:not([defer]):not([async])",
  ).length;
  if (blockingScripts > 2) {
    performanceIssues.push(
      issue(
        "warning",
        "performance",
        `${blockingScripts} render-blocking scripts in <head>`,
        "Add defer or async to non-critical scripts.",
      ),
    );
  }
  const imgs = $("img").toArray();
  const noLoading = imgs.filter((el) => !$(el).attr("loading")).length;
  if (imgs.length > 6 && noLoading > 3) {
    performanceIssues.push(
      issue(
        "info",
        "performance",
        `${noLoading} <img> tags without loading=\"lazy\"`,
        'Add loading="lazy" to below-the-fold images to defer their network requests.',
      ),
    );
  }
  if (html.length > 500_000) {
    performanceIssues.push(
      issue(
        "warning",
        "performance",
        `HTML payload is ${(html.length / 1024).toFixed(0)}KB`,
        "Shrink the served HTML; lazy-load components and trim unused markup.",
      ),
    );
  }

  // Security
  if (!url.startsWith("https://")) {
    securityIssues.push(
      issue(
        "critical",
        "security",
        "Site is not served over HTTPS",
        "Get a TLS certificate (Let's Encrypt is free) and force https:// redirects.",
      ),
    );
  }
  if (!headers.get("strict-transport-security")) {
    securityIssues.push(
      issue(
        "warning",
        "security",
        "No Strict-Transport-Security (HSTS) header",
        "Send Strict-Transport-Security: max-age=31536000; includeSubDomains to force HTTPS for return visitors.",
      ),
    );
  }
  if (!headers.get("x-content-type-options")) {
    securityIssues.push(
      issue(
        "info",
        "security",
        "Missing X-Content-Type-Options header",
        "Send X-Content-Type-Options: nosniff to prevent MIME-sniffing attacks.",
      ),
    );
  }
  if (!headers.get("content-security-policy")) {
    securityIssues.push(
      issue(
        "info",
        "security",
        "No Content-Security-Policy",
        "Add a CSP header to limit which scripts the browser is willing to execute.",
      ),
    );
  }

  // Accessibility
  const imgsNoAlt = imgs.filter((el) => {
    const alt = $(el).attr("alt");
    return alt === undefined; // empty alt="" is OK (decorative)
  }).length;
  if (imgsNoAlt > 0) {
    accessibilityIssues.push(
      issue(
        "warning",
        "a11y",
        `${imgsNoAlt} <img> tags missing alt`,
        'Add alt text describing each image. Use alt="" for purely decorative images.',
      ),
    );
  }
  if ($("h1").length === 0) {
    accessibilityIssues.push(
      issue(
        "warning",
        "a11y",
        "No <h1> on the page",
        "Every page should have exactly one <h1> that names what the page is about.",
      ),
    );
  }
  if ($("h1").length > 1) {
    accessibilityIssues.push(
      issue(
        "info",
        "a11y",
        "Multiple <h1> tags found",
        "Use one <h1> per page; demote the rest to <h2>/<h3>.",
      ),
    );
  }
  const inputsNoLabel = $("input, textarea, select")
    .toArray()
    .filter((el) => {
      const $el = $(el);
      const id = $el.attr("id");
      const ariaLabel = $el.attr("aria-label");
      const ariaLabelled = $el.attr("aria-labelledby");
      const hasLabel = id && $(`label[for="${id}"]`).length > 0;
      return !ariaLabel && !ariaLabelled && !hasLabel;
    }).length;
  if (inputsNoLabel > 0) {
    accessibilityIssues.push(
      issue(
        "warning",
        "a11y",
        `${inputsNoLabel} form inputs without an accessible label`,
        "Wrap inputs in <label> or add aria-label.",
      ),
    );
  }

  return {
    htmlIssues,
    seoIssues,
    performanceIssues,
    securityIssues,
    accessibilityIssues,
    additionalIssues,
  };
}

function issue(
  severity: IssueSeverity,
  category: string,
  description: string,
  recommendation: string,
): Issue {
  return { severity, category, description, recommendation };
}

// ── Scoring ──────────────────────────────────────────────────────────
//
// Start at 100 in each category, subtract weight by severity. Floor at 0.
// Overall is the unweighted mean of the five — simple and explainable to
// the rep reading the audit.

function computeScores(
  technical: AnalysisData["technical"],
): AnalysisData["scores"] {
  const html = scoreFor(technical.htmlIssues);
  const seo = scoreFor(technical.seoIssues);
  const performance = scoreFor(technical.performanceIssues);
  const security = scoreFor(technical.securityIssues);
  const accessibility = scoreFor(technical.accessibilityIssues);
  // The AuditSummary contract has html in technical but only exposes the
  // five named buckets in scores. We fold html into seo's denominator if
  // present (it's small) and surface the rest as-is.
  const overall = Math.round(
    (seo * 0.25 +
      performance * 0.25 +
      security * 0.25 +
      accessibility * 0.15 +
      html * 0.1) /
      1,
  );
  return { seo, performance, security, accessibility, overall };
}

function scoreFor(issues: Issue[]): number {
  let score = 100;
  for (const i of issues) {
    if (i.severity === "critical") score -= 25;
    else if (i.severity === "warning") score -= 10;
    else score -= 3;
  }
  return Math.max(0, score);
}

function hostFromUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}
