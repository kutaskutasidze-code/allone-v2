// Seedable email_templates rows for the sales → demo pipeline.
// One row per (segment × lead_source × language). Start lean: one universal
// "cold" template covering all segments in English + Georgian; extend as
// segments earn dedicated copy.

export interface SeedableTemplate {
  name: string;
  description: string;
  subject: string;
  body: string;
  target_service:
    | "chatbots"
    | "custom_ai"
    | "automation"
    | "website"
    | "consulting"
    | "general";
  language: "en" | "ka";
  segment: string | null;
  lead_source: string | null;
  swap_variables: string[];
}

const SHARED_VARS = [
  "lead.name",
  "lead.company",
  "lead.first_name",
  "audit.top_issue_summary",
  "audit.score_overall",
  "demo.url",
  "demo.admin_url",
  "offer.url",
  "sender.name",
  "sender.email",
  "sender.title",
];

const COLD_EN_BODY = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>A working demo of your next site</title></head>
<body style="margin:0;padding:0;background:#f6f7f9;font-family:-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',Roboto,sans-serif;color:#0f172a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
<tr><td style="padding:36px 40px 8px 40px;">
<p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;">Hi {{lead.first_name}},</p>
<p style="margin:0 0 18px 0;font-size:15px;line-height:1.6;">I took a look at {{lead.company}}'s current site and built you a working version of what we'd ship — branded with your colors, your name, your services.</p>
<p style="margin:0 0 28px 0;font-size:15px;line-height:1.6;">It's not a mockup. The admin works. Try it.</p>
</td></tr>
<tr><td align="center" style="padding:0 40px 28px 40px;">
<a href="{{demo.url}}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;font-size:15px;">Open your demo →</a>
</td></tr>
<tr><td style="padding:0 40px 8px 40px;border-top:1px solid #e5e7eb;padding-top:24px;">
<p style="margin:0 0 12px 0;font-size:13px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:.04em;">What we noticed about your current site</p>
<p style="margin:0 0 18px 0;font-size:14px;line-height:1.6;color:#334155;">{{audit.top_issue_summary}}</p>
<p style="margin:0 0 8px 0;font-size:13px;color:#64748b;">Overall score: <strong style="color:#0f172a;">{{audit.score_overall}}/100</strong>. The full audit is in the proposal — link below.</p>
</td></tr>
<tr><td style="padding:24px 40px 36px 40px;">
<p style="margin:0 0 6px 0;font-size:15px;line-height:1.6;">Here's our full commercial proposal: <a href="{{offer.url}}" style="color:#0f172a;font-weight:600;">view proposal</a></p>
<p style="margin:24px 0 4px 0;font-size:14px;line-height:1.6;">— {{sender.name}}</p>
<p style="margin:0;font-size:13px;color:#64748b;">{{sender.title}} · <a href="mailto:{{sender.email}}" style="color:#64748b;">{{sender.email}}</a></p>
</td></tr>
</table>
<p style="margin:14px 0 0 0;font-size:11px;color:#94a3b8;text-align:center;">Allone Labs · Tbilisi</p>
</td></tr></table></body></html>`;

const COLD_KA_BODY = COLD_EN_BODY.replace(
  "Open your demo →",
  "გახსენით თქვენი დემო →",
)
  .replace("Hi {{lead.first_name}},", "გამარჯობა {{lead.first_name}},")
  .replace(
    "I took a look at {{lead.company}}'s current site and built you a working version of what we'd ship — branded with your colors, your name, your services.",
    "მე ვნახე {{lead.company}}-ის მიმდინარე საიტი და თქვენთვის ავაგე სამუშაო ვერსია იმისა, რასაც გავუშვებდით — თქვენი ფერებით, თქვენი სახელით, თქვენი სერვისებით.",
  )
  .replace(
    "It's not a mockup. The admin works. Try it.",
    "ეს მაკეტი არ არის. ადმინ პანელი მუშაობს. სცადეთ.",
  )
  .replace(
    "What we noticed about your current site",
    "რა შევნიშნეთ თქვენი ახლანდელი საიტი",
  )
  .replace("Overall score:", "საერთო ქულა:")
  .replace(
    "The full audit is in the proposal — link below.",
    "სრული აუდიტი არის წინადადებაში — ბმული ქვემოთ.",
  )
  .replace(
    "Here's our full commercial proposal:",
    "აქ არის ჩვენი სრული კომერციული წინადადება:",
  )
  .replace("view proposal", "ნახეთ წინადადება");

export const SEEDABLE_TEMPLATES: SeedableTemplate[] = [
  {
    name: "demo-pipeline-cold-en",
    description:
      "Default cold outreach for sales→demo pipeline (EN). Used when no more-specific (segment, source, language) row matches.",
    subject: "{{lead.first_name}}, a working demo of {{lead.company}}.com",
    body: COLD_EN_BODY,
    target_service: "general",
    language: "en",
    segment: null,
    lead_source: "cold",
    swap_variables: SHARED_VARS,
  },
  {
    name: "demo-pipeline-cold-ka",
    description: "Default cold outreach for sales→demo pipeline (KA).",
    subject: "{{lead.first_name}}, {{lead.company}}-ის სამუშაო დემო",
    body: COLD_KA_BODY,
    target_service: "general",
    language: "ka",
    segment: null,
    lead_source: "cold",
    swap_variables: SHARED_VARS,
  },
];
