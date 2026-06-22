interface EmailData {
  name: string;
  email: string;
  company?: string;
  service: string;
  message: string;
}

export async function sendEmail(data: EmailData): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log("\n========== NEW CONTACT FORM SUBMISSION ==========");
    console.log("Name:", data.name);
    console.log("Email:", data.email);
    if (data.company) console.log("Company:", data.company);
    console.log("Service:", getServiceLabel(data.service));
    console.log("Message:", data.message);
    console.log("=================================================\n");
    return;
  }

  const serviceLabel = getServiceLabel(data.service);
  const fromAddress =
    process.env.SMTP_FROM || "ALLONE Website <onboarding@resend.dev>";
  const toAddress = process.env.CONTACT_EMAIL || "info@allonelabs.com";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Contact Form Submission</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background-color: #0f172a; padding: 32px; border-radius: 16px 16px 0 0;">
          <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">
            ALLONE
          </h1>
          <p style="margin: 8px 0 0; color: #94a3b8; font-size: 14px;">
            New Contact Form Submission
          </p>
        </div>

        <div style="background-color: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <h2 style="margin: 0 0 24px; color: #0f172a; font-size: 20px; font-weight: 600;">
            Contact Details
          </h2>

          <div style="margin-bottom: 20px;">
            <p style="margin: 0 0 4px; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">
              Name
            </p>
            <p style="margin: 0; color: #0f172a; font-size: 16px; font-weight: 500;">
              ${escapeHtml(data.name)}
            </p>
          </div>

          <div style="margin-bottom: 20px;">
            <p style="margin: 0 0 4px; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">
              Email
            </p>
            <p style="margin: 0;">
              <a href="mailto:${escapeHtml(data.email)}" style="color: #06b6d4; font-size: 16px; text-decoration: none;">
                ${escapeHtml(data.email)}
              </a>
            </p>
          </div>

          ${
            data.company
              ? `
          <div style="margin-bottom: 20px;">
            <p style="margin: 0 0 4px; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">
              Company
            </p>
            <p style="margin: 0; color: #0f172a; font-size: 16px;">
              ${escapeHtml(data.company)}
            </p>
          </div>
          `
              : ""
          }

          <div style="margin-bottom: 20px;">
            <p style="margin: 0 0 4px; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">
              Service Interest
            </p>
            <p style="margin: 0; color: #0f172a; font-size: 16px;">
              ${escapeHtml(serviceLabel)}
            </p>
          </div>

          <div style="margin-bottom: 0; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0 0 8px; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">
              Message
            </p>
            <p style="margin: 0; color: #0f172a; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">
              ${escapeHtml(data.message)}
            </p>
          </div>
        </div>

        <p style="margin: 24px 0 0; color: #94a3b8; font-size: 12px; text-align: center;">
          This email was sent from the ALLONE website contact form.
        </p>
      </div>
    </body>
    </html>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [toAddress],
      reply_to: data.email,
      subject: `New Contact: ${data.name} - ${serviceLabel}`,
      html: htmlContent,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend API error: ${res.status} ${err}`);
  }
}

interface ApplicationEmailData {
  name: string;
  email: string;
  phone?: string | null;
  linkedin?: string | null;
  vacancyTitle: string;
  projects?: string | null;
  note?: string | null;
  hasCv: boolean;
}

export async function sendApplicationNotification(
  data: ApplicationEmailData,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log("\n========== NEW JOB APPLICATION ==========");
    console.log("Vacancy:", data.vacancyTitle);
    console.log("Name:", data.name);
    console.log("Email:", data.email);
    if (data.phone) console.log("Phone:", data.phone);
    if (data.linkedin) console.log("LinkedIn:", data.linkedin);
    if (data.projects) console.log("Projects:", data.projects);
    if (data.note) console.log("Note:", data.note);
    console.log("CV attached:", data.hasCv ? "yes" : "no");
    console.log("=========================================\n");
    return;
  }

  const fromAddress =
    process.env.SMTP_FROM || "ALLONE Website <onboarding@resend.dev>";
  const toAddress =
    process.env.CAREERS_EMAIL ||
    process.env.CONTACT_EMAIL ||
    "info@allonelabs.com";

  const block = (
    label: string,
    value: string | null | undefined,
    mono = false,
  ) =>
    value
      ? `<div style="margin-bottom: 20px;">
          <p style="margin: 0 0 4px; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">${label}</p>
          <p style="margin: 0; color: #0f172a; font-size: 16px; line-height: 1.6; white-space: pre-wrap;${mono ? " font-family: monospace;" : ""}">${escapeHtml(value)}</p>
        </div>`
      : "";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background-color: #0f172a; padding: 32px; border-radius: 16px 16px 0 0;">
          <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">ALLONE</h1>
          <p style="margin: 8px 0 0; color: #94a3b8; font-size: 14px;">New application — ${escapeHtml(data.vacancyTitle)}</p>
        </div>
        <div style="background-color: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
          ${block("Name", data.name)}
          <div style="margin-bottom: 20px;">
            <p style="margin: 0 0 4px; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Email</p>
            <p style="margin: 0;"><a href="mailto:${escapeHtml(data.email)}" style="color: #06b6d4; font-size: 16px; text-decoration: none;">${escapeHtml(data.email)}</a></p>
          </div>
          ${block("Phone", data.phone)}
          ${block("LinkedIn", data.linkedin)}
          ${block("Projects", data.projects)}
          ${block("Note", data.note)}
          <div style="margin: 0; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; color: #0f172a; font-size: 14px;">CV attached: <strong>${data.hasCv ? "yes" : "no"}</strong> — review and download it in the admin panel under Careers &rsaquo; Applications.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [toAddress],
      reply_to: data.email,
      subject: `New application: ${data.name} — ${data.vacancyTitle}`,
      html: htmlContent,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend API error: ${res.status} ${err}`);
  }
}

function getServiceLabel(serviceId: string): string {
  const services: Record<string, string> = {
    chatbots: "AI Chatbots & Assistants",
    automation: "Workflow Automation",
    custom: "Custom AI Solutions",
    consulting: "AI Strategy & Consulting",
    other: "Other / Not Sure",
  };
  return services[serviceId] || serviceId || "Not specified";
}

function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}

interface SelfServeNotice {
  clientName: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  docNumber: string;
  price: number;
  offerUrl: string;
}

/**
 * Notify the team when an anonymous website visitor auto-generates an offer.
 * Best-effort: never throws — a notification failure must not fail the offer.
 */
export async function sendSelfServeOfferNotice(
  n: SelfServeNotice,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_EMAIL || "info@allonelabs.com";
  const from =
    process.env.SMTP_FROM || "ALLONE Website <onboarding@resend.dev>";
  if (!apiKey) {
    console.log(
      "[self-serve offer]",
      n.docNumber,
      n.offerUrl,
      n.contactEmail ?? n.contactPhone,
    );
    return;
  }
  // Every field below is visitor-controlled (extracted from anonymous chat),
  // so escape it — same rule as every other builder in this file.
  const esc = (v: string | null) => (v ? escapeHtml(v) : "—");
  const html = `
    <h2>New self-serve offer — ${escapeHtml(n.docNumber)}</h2>
    <p><strong>Client:</strong> ${esc(n.clientName)}</p>
    <p><strong>Contact:</strong> ${esc(n.contactName)} · ${esc(n.contactEmail)} · ${esc(n.contactPhone)}</p>
    <p><strong>Price:</strong> ${n.price} GEL</p>
    <p><a href="${escapeHtml(n.offerUrl)}">Open the offer thread →</a></p>
    <p style="color:#888">Auto-generated from allonelabs.com chat. Refine in /sales/proposals.</p>`;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        // Cloudflare in front of Resend rejects default runtime UAs (see memory).
        "User-Agent": "Mozilla/5.0 (compatible; AlloneBot/1.0)",
      },
      body: JSON.stringify({
        from,
        to,
        subject: `🌐 Self-serve offer ${n.docNumber} — ${n.clientName.replace(/[\r\n]+/g, " ").slice(0, 120)}`,
        html,
      }),
    });
    if (!res.ok)
      console.error(
        "[self-serve offer] resend failed",
        res.status,
        await res.text(),
      );
  } catch (err) {
    console.error("[self-serve offer] notify error", err);
  }
}
