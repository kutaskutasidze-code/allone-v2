// ---------------------------------------------------------------------------
// Branded client email shell.
//
// The sales-typed message is premium, the attached PDFs are premium — but the
// email carrying them was unstyled. This wraps the message in an email-safe
// (table layout + inline styles only; no fl/grid, no <style>, no CSS vars —
// Gmail/Outlook strip those) branded frame that matches allonelabs.com:
// creamy paper, a typographic AllOne wordmark, brand-blue accents, a tidy
// "documents attached" note + thread button, and a „ოლუან" footer.
// ---------------------------------------------------------------------------

const BRAND = {
  paper: "#F1F0EE",
  card: "#ffffff",
  ink: "#0c1016",
  muted: "#4a5058",
  faint: "#6b7480",
  line: "#D9D7D1",
  accent: "#2776EA",
  // Web-safe stack — email clients can't reliably load Space Grotesk; Georgian
  // renders via the system Georgian font on the recipient's device.
  font: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Noto Sans Georgian',Helvetica,Arial,sans-serif",
};

const DOC_LABELS: Record<string, string> = {
  offer: "შეთავაზება",
  contract: "ხელშეკრულება",
  invoice: "ინვოისი",
};

export interface ClientEmailOpts {
  /** Sales-authored message body (already HTML; newlines may be <br> or <p>). */
  bodyHtml: string;
  /** Document number, e.g. AL-2026-036. */
  docNumber?: string | null;
  /** Which documents are attached (for the "attached" note). */
  docKinds?: string[];
  /** In-chat thread URL, if this proposal came from a bot response. */
  threadUrl?: string | null;
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

export function renderClientEmail(opts: ClientEmailOpts): string {
  const { bodyHtml, docNumber, docKinds = [], threadUrl } = opts;

  const attachedNote =
    docKinds.length > 0
      ? `<p style="margin:0 0 4px;font:600 11px/1.5 ${BRAND.font};letter-spacing:.12em;text-transform:uppercase;color:${BRAND.faint};">თანდართული დოკუმენტები</p>
         <p style="margin:0;font:400 14px/1.6 ${BRAND.font};color:${BRAND.ink};">${docKinds
           .map((k) => DOC_LABELS[k] ?? k)
           .join(" · ")}</p>`
      : "";

  const threadButton = threadUrl
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 0;">
         <tr><td style="border-radius:8px;background:${BRAND.accent};">
           <a href="${escapeAttr(threadUrl)}" style="display:inline-block;padding:12px 22px;font:600 14px/1 ${BRAND.font};color:#ffffff;text-decoration:none;border-radius:8px;">ნახეთ ჩატში →</a>
         </td></tr>
       </table>`
    : "";

  const docMeta = docNumber
    ? `<span style="font:600 11px/1 ${BRAND.font};letter-spacing:.14em;color:${BRAND.accent};">${escapeAttr(
        docNumber,
      )}</span>`
    : "";

  return `<!doctype html>
<html lang="ka"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:${BRAND.paper};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.paper};padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;">

        <!-- header -->
        <tr><td style="padding:0 4px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="font:700 20px/1 ${BRAND.font};letter-spacing:.02em;color:${BRAND.ink};">AllOne<span style="color:${BRAND.accent};">.</span></td>
            <td align="right">${docMeta}</td>
          </tr></table>
        </td></tr>

        <!-- card -->
        <tr><td style="background:${BRAND.card};border:1px solid ${BRAND.line};border-radius:14px;padding:32px 32px 28px;">
          <div style="font:400 15px/1.7 ${BRAND.font};color:${BRAND.ink};">${bodyHtml}</div>
          ${
            attachedNote
              ? `<div style="margin-top:24px;padding-top:20px;border-top:1px solid ${BRAND.line};">${attachedNote}</div>`
              : ""
          }
          ${threadButton}
        </td></tr>

        <!-- footer -->
        <tr><td style="padding:20px 4px 0;">
          <p style="margin:0;font:400 12px/1.6 ${BRAND.font};color:${BRAND.faint};">
            შპს „ოლუან" · AllOne Labs · <a href="https://allonelabs.com" style="color:${BRAND.muted};text-decoration:none;">allonelabs.com</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
}
