import { logger } from "../utils/logger.js";

export interface DocAttachment {
  url: string;
  filename: string;
}

export interface SendDocsOpts {
  to: string;
  fromName?: string;
  subject: string;
  html: string;
  attachments: DocAttachment[];
}

export interface SendDocsResult {
  ok: boolean;
  resendId?: string;
  error?: string;
}

const RESEND_API = "https://api.resend.com/emails";

export async function sendDocsEmail(
  opts: SendDocsOpts,
): Promise<SendDocsResult> {
  const key = process.env.RESEND_API_KEY ?? "";
  const from =
    process.env.RESEND_FROM_ADDRESS ?? "Allone Labs <hello@allonelabs.com>";

  if (!key) return { ok: false, error: "RESEND_API_KEY not set" };
  if (!opts.to) return { ok: false, error: "recipient (to) required" };

  // Fetch each PDF and base64-encode for Resend's attachments field.
  const attachments: { filename: string; content: string }[] = [];
  for (const a of opts.attachments) {
    let r: Response;
    try {
      r = await fetch(a.url);
    } catch (err) {
      return {
        ok: false,
        error: `attachment fetch error: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
    if (!r.ok) {
      return { ok: false, error: `attachment fetch ${r.status}: ${a.url}` };
    }
    const buf = Buffer.from(await r.arrayBuffer());
    attachments.push({ filename: a.filename, content: buf.toString("base64") });
  }

  // Extract the bare email address from the RESEND_FROM_ADDRESS env var so we
  // can substitute a display name while keeping the sending domain.
  const bareEmail = from.replace(/^.*<|>$/g, "").trim();
  const fromAddress = opts.fromName ? `${opts.fromName} <${bareEmail}>` : from;

  const payload = {
    from: fromAddress,
    to: [opts.to],
    subject: opts.subject,
    html: opts.html,
    attachments,
  };

  let res: Response;
  try {
    res = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Allone-Sales/1.0",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    return {
      ok: false,
      error: `Resend fetch error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  const text = await res.text();
  if (!res.ok) {
    logger.error("sendDocsEmail: Resend failed", {
      status: res.status,
      text: text.slice(0, 200),
    });
    return { ok: false, error: `Resend ${res.status}: ${text.slice(0, 200)}` };
  }

  let json: { id?: string } = {};
  try {
    json = JSON.parse(text) as { id?: string };
  } catch {
    // response wasn't JSON — id will be undefined
  }

  logger.info("sendDocsEmail: sent", {
    to: opts.to,
    subject: opts.subject,
    attachmentCount: attachments.length,
    resendId: json.id,
  });

  return { ok: true, resendId: json.id };
}
