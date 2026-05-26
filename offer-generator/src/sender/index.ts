// Sends a drafted email via Resend (HTTP, no SDK to keep deps lean) after
// rewriting demo URLs through the per-job tracking endpoints so opens +
// clicks land in demo_engagements.

import { config } from "../config.js";
import { logger } from "../utils/logger.js";
import { supabase } from "../database/client.js";
import {
  getEmailDraft,
  markEmailDraftSent,
} from "../database/email-drafts.repo.js";

const RESEND_API = "https://api.resend.com/emails";

export interface SendResult {
  ok: boolean;
  resendId?: string;
  error?: string;
}

export interface SendOpts {
  draftId: string;
  publicBaseUrl?: string; // where /api/track/demo/:job/{open.gif,click} live
}

export async function sendEmailDraft(opts: SendOpts): Promise<SendResult> {
  const resendKey = process.env.RESEND_API_KEY || "";
  const from =
    process.env.RESEND_FROM_ADDRESS || "Allone Labs <hello@allonelabs.com>";
  if (!resendKey) return { ok: false, error: "RESEND_API_KEY not set" };

  const draft = await getEmailDraft(opts.draftId);
  if (!draft) return { ok: false, error: "draft not found" };
  if (draft.status === "sent")
    return { ok: false, error: "draft already sent" };

  // Resolve recipient + sender from joined tables.
  const { data: lead, error: leadErr } = await supabase
    .from("leads")
    .select("email, name")
    .eq("id", draft.lead_id)
    .single();
  if (leadErr || !lead?.email)
    return { ok: false, error: "lead email missing" };

  // Optional sender override per draft.sales_user_id.
  let senderEmail: string | null = null;
  let senderName: string | null = null;
  if (draft.sales_user_id) {
    const { data: salesUser } = await supabase
      .from("sales_users")
      .select("email, full_name")
      .eq("id", draft.sales_user_id)
      .maybeSingle();
    if (salesUser?.email) {
      senderEmail = salesUser.email;
      senderName = (salesUser as any).full_name ?? null;
    }
  }
  const fromAddress = senderEmail
    ? `${senderName ?? "Allone Labs"} <${senderEmail}>`
    : from;

  const base = (
    opts.publicBaseUrl ??
    process.env.PUBLIC_SITE_URL ??
    "https://allonelabs.com"
  ).replace(/\/$/, "");
  const jobId = draft.demo_job_id ?? "";
  const html = injectTracking(draft.body_html, base, jobId);

  const payload = {
    from: fromAddress,
    to: [lead.email],
    subject: draft.subject,
    html,
    text: draft.body_text ?? undefined,
    headers: {
      "User-Agent": "Allone-Sales/1.0", // memory: Resend needs custom UA vs CF 1010
      "X-Demo-Job-ID": jobId,
    },
  };

  try {
    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
        "User-Agent": "Allone-Sales/1.0",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errText = await res.text();
      logger.error("Resend send failed", {
        status: res.status,
        body: errText.slice(0, 400),
      });
      return {
        ok: false,
        error: `Resend ${res.status}: ${errText.slice(0, 200)}`,
      };
    }
    const json = (await res.json()) as { id?: string };
    await markEmailDraftSent(opts.draftId);
    // Also update demo_jobs.status → sent
    if (jobId) {
      await supabase
        .from("demo_jobs")
        .update({ status: "sent" })
        .eq("id", jobId);
    }
    return { ok: true, resendId: json.id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// Rewrite <a href="..."> targets through /api/track/demo/<job>/click?to=<url>
// and append an invisible <img src="...open.gif"> before </body>.
export function injectTracking(
  html: string,
  base: string,
  jobId: string,
): string {
  if (!jobId) return html;
  let out = html.replace(/href=("|')(https?:\/\/[^"']+)\1/gi, (_m, q, url) => {
    if (url.includes(`/api/track/demo/`)) return `href=${q}${url}${q}`;
    const wrapped = `${base}/api/track/demo/${encodeURIComponent(jobId)}/click?to=${encodeURIComponent(
      url,
    )}`;
    return `href=${q}${wrapped}${q}`;
  });
  const beacon = `<img src="${base}/api/track/demo/${encodeURIComponent(
    jobId,
  )}/open.gif" alt="" width="1" height="1" style="display:none;border:0;" />`;
  if (out.includes("</body>")) {
    out = out.replace("</body>", `${beacon}\n</body>`);
  } else {
    out += beacon;
  }
  return out;
}
