import * as cheerio from "cheerio";
import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config.js";
import { logger } from "../utils/logger.js";
import type { AnalysisData } from "../types/analysis.js";
import type { CompanySpec, Segment } from "../types/demo.js";

const SEGMENTS: Segment[] = [
  "tourism",
  "ecom",
  "law-firm",
  "dental",
  "agency",
  "other",
];

// Maps the offer-generator's existing AnalysisData into the CompanySpec shape
// xfly.js consumes. AnalysisData covers company name/description/products + a
// rough tech stack, but does NOT capture brand color or logo URL — for those
// we do a fresh fetch + cheerio scrape of the lead's homepage.
export async function enrichCompanySpec(
  leadEmail: string,
  leadName: string,
  leadCompany: string | null,
  analysis: AnalysisData | null,
): Promise<CompanySpec> {
  const spec: CompanySpec = {
    name:
      analysis?.company.name ||
      leadCompany ||
      deriveCompanyFromEmail(leadEmail) ||
      leadName,
    nameKa: analysis?.company.nameKa,
    tagline: analysis?.company.description?.slice(0, 100),
    about: analysis?.company.description,
    email: leadEmail,
    services: analysis?.company.products,
    domain:
      deriveDomainFromAnalysis(analysis) ??
      deriveDomainFromEmail(leadEmail) ??
      undefined,
  };

  if (analysis?.url) {
    try {
      const visual = await scrapeBrandSignals(analysis.url);
      if (visual.color) spec.color = visual.color;
      if (visual.logo) spec.logo = visual.logo;
      if (visual.phone && !spec.phone) spec.phone = visual.phone;
      if (visual.socials) spec.socials = visual.socials;
    } catch (err) {
      logger.warn("enricher: brand-signal scrape failed", {
        url: analysis.url,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return spec;
}

export async function classifySegment(
  analysis: AnalysisData | null,
  hint?: string,
): Promise<Segment> {
  if (!analysis && !hint) return "other";
  if (!config.anthropicApiKey) {
    logger.warn('classifySegment: no ANTHROPIC_API_KEY, returning "other"');
    return "other";
  }

  const client = new Anthropic({ apiKey: config.anthropicApiKey });
  const summary = [
    analysis?.company.name && `Company: ${analysis.company.name}`,
    analysis?.company.industry && `Industry: ${analysis.company.industry}`,
    analysis?.company.description &&
      `About: ${analysis.company.description.slice(0, 400)}`,
    analysis?.company.products?.length &&
      `Products: ${analysis.company.products.slice(0, 8).join(", ")}`,
    hint && `Hint: ${hint}`,
  ]
    .filter(Boolean)
    .join("\n");

  const allowed = SEGMENTS.join("|");
  const prompt = `Classify this business into exactly one segment from: ${allowed}.

${summary}

Respond with ONLY the segment name. If none clearly fit, respond "other".`;

  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 8,
      messages: [{ role: "user", content: prompt }],
    });
    const text = msg.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim()
      .toLowerCase();
    const match = SEGMENTS.find((s) => text.includes(s));
    return match ?? "other";
  } catch (err) {
    logger.warn("classifySegment: anthropic call failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return "other";
  }
}

interface BrandSignals {
  color?: string;
  logo?: string;
  phone?: string;
  socials?: CompanySpec["socials"];
}

async function scrapeBrandSignals(url: string): Promise<BrandSignals> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; AlloneEnricher/1.0)" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`fetch ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  const signals: BrandSignals = {};

  // theme-color meta tag is the cleanest brand-color signal when present.
  const themeColor = $('meta[name="theme-color"]').attr("content")?.trim();
  if (themeColor && /^#?[0-9a-f]{3,8}$/i.test(themeColor)) {
    signals.color = themeColor.startsWith("#") ? themeColor : `#${themeColor}`;
  }

  // Logo: first <img> matching class/alt /logo/i (and not a tracking pixel).
  const logoEl = $("img")
    .filter((_, el) => {
      const cls = ($(el).attr("class") ?? "").toLowerCase();
      const alt = ($(el).attr("alt") ?? "").toLowerCase();
      const src = ($(el).attr("src") ?? "").toLowerCase();
      const isLogo =
        /logo|brand|wordmark/.test(cls) ||
        /logo|brand/.test(alt) ||
        /logo|brand/.test(src);
      return isLogo && !src.includes("pixel") && !src.includes("tracking");
    })
    .first();
  const logoSrc = logoEl.attr("src");
  if (logoSrc) signals.logo = absolutize(logoSrc, url);

  // Phone: first tel: link or first visible-looking phone string.
  const telHref = $('a[href^="tel:"]').first().attr("href");
  if (telHref) signals.phone = telHref.replace(/^tel:/i, "").trim();

  // Socials
  const socials: NonNullable<CompanySpec["socials"]> = {};
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    if (!socials.linkedin && /linkedin\.com\//i.test(href))
      socials.linkedin = href;
    if (!socials.facebook && /facebook\.com\//i.test(href))
      socials.facebook = href;
    if (!socials.twitter && /(twitter\.com|x\.com)\//i.test(href))
      socials.twitter = href;
    if (!socials.instagram && /instagram\.com\//i.test(href))
      socials.instagram = href;
  });
  if (Object.keys(socials).length) signals.socials = socials;

  return signals;
}

function absolutize(href: string, base: string): string {
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

function deriveCompanyFromEmail(email: string): string | null {
  const domain = deriveDomainFromEmail(email);
  if (!domain) return null;
  const root = domain.split(".")[0];
  return root.charAt(0).toUpperCase() + root.slice(1);
}

function deriveDomainFromEmail(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at < 0) return null;
  return email.slice(at + 1).toLowerCase();
}

function deriveDomainFromAnalysis(
  analysis: AnalysisData | null,
): string | undefined {
  if (!analysis?.url) return undefined;
  try {
    return new URL(analysis.url).hostname;
  } catch {
    return undefined;
  }
}
