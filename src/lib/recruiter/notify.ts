// Outbound candidate mail for the recruiter pipeline (Increments 2 & 3).
// Uses the same Resend HTTP API the rest of the site uses. Sending is gated by
// the caller (recruiterConfig.sendingEnabled); this module just sends.

import { recruiterConfig } from "./config";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Wrap a plain-text body (in the candidate's own language) in a minimal,
// brand-light HTML shell. Paragraphs split on blank lines, single newlines → <br>.
export function wrapPlainText(body: string): string {
  const paras = body
    .trim()
    .split(/\n\s*\n/)
    .map(
      (p) =>
        `<p style="margin:0 0 16px;color:#0f172a;font-size:15px;line-height:1.6;">${escapeHtml(
          p,
        ).replace(/\n/g, "<br/>")}</p>`,
    )
    .join("");
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Tahoma,sans-serif;"><div style="max-width:560px;margin:0 auto;padding:32px 20px;"><div style="background:#fff;padding:32px;border-radius:14px;">${paras}<p style="margin:24px 0 0;color:#94a3b8;font-size:12px;">AllOne Labs · Tbilisi</p></div></div></body></html>`;
}

export type SendResult = { sent: boolean; id?: string; reason?: string };

export async function sendCandidateEmail(args: {
  to: string;
  subject: string;
  body: string; // plain text, in the candidate's language
  ics?: string; // optional .ics invite content
}): Promise<SendResult> {
  const apiKey = recruiterConfig.resendApiKey();
  if (!apiKey) {
    // Dev / no-key: log instead of sending so flows are testable locally.
    console.log(
      `[recruiter] (no RESEND_API_KEY) would email ${args.to}: ${args.subject}`,
    );
    return { sent: false, reason: "no_api_key" };
  }

  const payload: Record<string, unknown> = {
    from: recruiterConfig.fromAddress,
    to: [args.to],
    reply_to: recruiterConfig.organizerEmail,
    subject: args.subject,
    html: wrapPlainText(args.body),
    text: args.body,
  };
  if (args.ics) {
    payload.attachments = [
      {
        filename: "invite.ics",
        content: Buffer.from(args.ics, "utf8").toString("base64"),
        content_type: "text/calendar; method=REQUEST",
      },
    ];
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    return {
      sent: false,
      reason: `resend_${res.status}: ${err.slice(0, 200)}`,
    };
  }
  const data = (await res.json().catch(() => ({}))) as { id?: string };
  return { sent: true, id: data.id };
}
