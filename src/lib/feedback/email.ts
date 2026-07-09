import { translate } from "@/lib/i18n/dict";
import { feedbackConfig } from "./config";
import type { Locale } from "./types";

export function emailConfigured(): boolean {
  return feedbackConfig.email.configured;
}

interface OnboardingOpts {
  to: string;
  companyName: string;
  portalUrl: string;
  locale: Locale;
}

// Onboarding email in the client's chosen language, sent via the CRM's Resend setup.
// Degrades gracefully (logs instead of throwing) when RESEND_API_KEY is absent.
export async function sendOnboardingEmail(
  opts: OnboardingOpts,
): Promise<{ sent: boolean; reason?: string }> {
  const { to, companyName, portalUrl, locale } = opts;
  const subject = translate(locale, "feedback.email.onboarding.subject", { company: companyName });
  const html = onboardingHtml(locale, companyName, portalUrl);
  const text = onboardingText(locale, companyName, portalUrl);

  const apiKey = feedbackConfig.email.apiKey;
  if (!apiKey) {
    console.log(`[feedback] RESEND_API_KEY not set — would email onboarding to ${to}: ${subject}`);
    return { sent: false, reason: "not_configured" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        // Cloudflare in front of Resend rejects default runtime UAs (see src/lib/email.ts).
        "User-Agent": "allone-crm-feedback",
      },
      body: JSON.stringify({ from: feedbackConfig.email.from, to: [to], subject, html, text }),
    });
    if (!res.ok) {
      console.warn(`[feedback] Resend onboarding failed ${res.status}: ${await res.text()}`);
      return { sent: false, reason: `resend_${res.status}` };
    }
    return { sent: true };
  } catch (e) {
    console.warn("[feedback] Resend onboarding network error", e);
    return { sent: false, reason: "network" };
  }
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function onboardingText(locale: Locale, company: string, portalUrl: string): string {
  return [
    translate(locale, "feedback.email.onboarding.greeting", { company }),
    "",
    translate(locale, "feedback.email.onboarding.intro"),
    "",
    translate(locale, "feedback.email.onboarding.linknote"),
    portalUrl,
    "",
    translate(locale, "feedback.email.onboarding.keepPrivate"),
    "— AllOne",
  ].join("\n");
}

function onboardingHtml(locale: Locale, company: string, portalUrl: string): string {
  const greeting = esc(translate(locale, "feedback.email.onboarding.greeting", { company }));
  const intro = esc(translate(locale, "feedback.email.onboarding.intro"));
  const cta = esc(translate(locale, "feedback.email.onboarding.cta"));
  const linknote = esc(translate(locale, "feedback.email.onboarding.linknote"));
  const keepPrivate = esc(translate(locale, "feedback.email.onboarding.keepPrivate"));
  const footer = esc(translate(locale, "feedback.email.onboarding.footer"));
  const url = esc(portalUrl);
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 0;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5;">
<tr><td style="background:#111111;padding:26px 32px;">
  <div style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:.3px;">AllOne</div>
  <div style="color:#a1a1aa;font-size:13px;margin-top:4px;">Feedback Portal</div>
</td></tr>
<tr><td style="padding:32px;">
  <h1 style="margin:0 0 10px;font-size:22px;color:#111111;">${greeting}</h1>
  <p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:#52525b;">${intro}</p>
  <a href="${url}" style="display:inline-block;background:#111111;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:13px 26px;border-radius:8px;">${cta} &rarr;</a>
  <p style="margin:24px 0 6px;font-size:13px;line-height:1.6;color:#52525b;">${linknote}</p>
  <p style="margin:0 0 22px;font-size:13px;color:#111111;word-break:break-all;">${url}</p>
  <p style="margin:0;font-size:13px;line-height:1.6;color:#a1a1aa;">${keepPrivate}</p>
</td></tr>
<tr><td style="background:#fafafa;padding:20px 32px;border-top:1px solid #e5e5e5;">
  <p style="margin:0;font-size:12px;color:#a1a1aa;">&copy; ${footer}</p>
</td></tr>
</table></td></tr></table></body></html>`;
}
