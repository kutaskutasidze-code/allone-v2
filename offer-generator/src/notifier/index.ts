// Sends in-app + email notifications to a sales user when their demo
// pipeline reaches a reviewable state. Uses Resend HTTP directly (no SDK)
// so the offer-generator dep tree stays lean.

import { supabase } from "../database/client.js";
import { logger } from "../utils/logger.js";

const RESEND_API = "https://api.resend.com/emails";

export interface NotifyOpts {
  demoJobId: string;
}

export async function notifyDraftReady(
  opts: NotifyOpts,
): Promise<{ ok: boolean; error?: string }> {
  const { data: job, error } = await supabase
    .from("demo_jobs")
    .select("id, lead_id, sales_user_id, demo_url, audit_results")
    .eq("id", opts.demoJobId)
    .single();
  if (error || !job)
    return { ok: false, error: error?.message ?? "job not found" };
  if (!job.sales_user_id)
    return { ok: false, error: "no sales_user_id on demo_job" };

  const [{ data: salesUser }, { data: lead }] = await Promise.all([
    supabase
      .from("sales_users")
      .select("email, full_name")
      .eq("id", job.sales_user_id)
      .maybeSingle(),
    supabase
      .from("leads")
      .select("name, company")
      .eq("id", job.lead_id)
      .maybeSingle(),
  ]);
  if (!salesUser?.email) return { ok: false, error: "sales user has no email" };

  const resendKey = process.env.RESEND_API_KEY || "";
  if (!resendKey) {
    logger.warn(
      "notifyDraftReady: RESEND_API_KEY not set, skipping notification",
      {
        demoJobId: opts.demoJobId,
      },
    );
    return { ok: false, error: "RESEND_API_KEY not set" };
  }

  const from =
    process.env.RESEND_FROM_ADDRESS || "Allone Labs <hello@allonelabs.com>";
  const publicBase = (
    process.env.PUBLIC_SITE_URL ?? "https://allonelabs.com"
  ).replace(/\/$/, "");
  const reviewUrl = `${publicBase}/sales/leads/${job.lead_id}`;
  const auditScore = (
    job.audit_results as { scores?: { overall?: number } } | null
  )?.scores?.overall;
  const leadName = lead?.name ?? "a lead";
  const leadCompany = lead?.company ?? "their company";
  const recipient = (salesUser as { full_name?: string }).full_name ?? "there";

  const subject = `Demo ready for review — ${leadName} (${leadCompany})`;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f6f7f9;font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;color:#0f172a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
<tr><td style="padding:32px 40px;">
<p style="margin:0 0 18px 0;font-size:15px;line-height:1.6;">Hi ${escape(recipient)},</p>
<p style="margin:0 0 18px 0;font-size:15px;line-height:1.6;">The personalized demo for <strong>${escape(leadCompany)}</strong> (lead: ${escape(leadName)}) is ready for your review.</p>
${auditScore != null ? `<p style="margin:0 0 18px 0;font-size:14px;color:#475569;">Audit score: <strong style="color:#0f172a;">${auditScore}/100</strong></p>` : ""}
${job.demo_url ? `<p style="margin:0 0 24px 0;font-size:14px;line-height:1.6;">Demo URL: <a href="${job.demo_url}" style="color:#0f172a;font-weight:600;">${job.demo_url}</a></p>` : ""}
<p style="margin:0 0 24px 0;font-size:14px;line-height:1.6;">Open the lead to preview the demo, audit, and drafted email — then Send or edit before it goes out.</p>
<p style="margin:0;text-align:center;">
<a href="${reviewUrl}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;font-size:14px;">Review demo →</a>
</p>
</td></tr>
</table>
<p style="margin:14px 0 0 0;font-size:11px;color:#94a3b8;text-align:center;">Allone Labs · Sales pipeline notification</p>
</td></tr></table></body></html>`;

  try {
    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
        "User-Agent": "Allone-Sales/1.0",
      },
      body: JSON.stringify({
        from,
        to: [salesUser.email],
        subject,
        html,
        headers: { "User-Agent": "Allone-Sales/1.0", "X-Demo-Job-ID": job.id },
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      logger.error("notifyDraftReady: Resend send failed", {
        status: res.status,
        body: errText.slice(0, 400),
      });
      return { ok: false, error: `Resend ${res.status}` };
    }
    logger.info("notifyDraftReady: sent", {
      demoJobId: job.id,
      to: salesUser.email,
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
