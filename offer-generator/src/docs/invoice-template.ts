import type {
  OfferDraft,
  OfferScopeLine,
  OfferStage,
} from "../offer/anchors.js";
import { ISSUER, issuerName, type Recipient } from "./issuer.js";

export interface ProposalLike {
  client_name: string;
  doc_number: string;
  language: string;
  offer: OfferDraft;
  recipient?: Recipient;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmt(n: number): string {
  return n.toLocaleString("ka-GE");
}

const BLANK = "____";

function recipientField(value: string | undefined): string {
  return value ? esc(value) : BLANK;
}

function serviceRows(lines: OfferScopeLine[]): string {
  return lines
    .map(
      (l, i) => `
    <tr>
      <td class="tbl-num">${i + 1}</td>
      <td class="tbl-svc"><strong>${esc(l.label)}</strong>${l.description ? ` — ${esc(l.description)}` : ""}</td>
      <td class="tbl-price">${fmt(l.price)} ₾</td>
    </tr>`,
    )
    .join("");
}

function scheduleRows(stages: OfferStage[]): string {
  return stages
    .map(
      (s, i) => `
    <tr>
      <td class="sched-stage">${esc(s.label || `${toRoman(i + 1)} ეტაპი`)}</td>
      <td class="sched-desc">${esc(s.when)}</td>
      <td class="sched-amt">${fmt(s.amount)} ₾</td>
      <td class="sched-due">${esc(s.when)}</td>
    </tr>`,
    )
    .join("");
}

function toRoman(n: number): string {
  const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const syms = [
    "M",
    "CM",
    "D",
    "CD",
    "C",
    "XC",
    "L",
    "XL",
    "X",
    "IX",
    "V",
    "IV",
    "I",
  ];
  let result = "";
  let rem = n;
  for (let i = 0; i < vals.length; i++) {
    while (rem >= vals[i]!) {
      result += syms[i];
      rem -= vals[i]!;
    }
  }
  return result;
}

const CSS = `
  :root {
    --ink: #0a0a0a;
    --muted: #6b6b6b;
    --faint: #9a9a9a;
    --line: #e7e5e4;
    --bg: #ffffff;
    --soft: #f5f5f4;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: A4; margin: 0; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body {
    font-family: "Noto Sans Georgian", "Geist", system-ui, sans-serif;
    color: var(--ink);
    background: var(--bg);
    font-size: 11px;
    line-height: 1.65;
    letter-spacing: -0.01em;
  }
  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 18mm 18mm 16mm;
    position: relative;
    page-break-after: always;
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .page:last-child { page-break-after: auto; }

  /* title */
  .doc-title {
    font-size: 28px; font-weight: 800;
    letter-spacing: -0.03em; line-height: 1.1;
    margin-bottom: 4px;
  }
  .doc-subtitle {
    font-size: 18px; font-weight: 700;
    letter-spacing: -0.02em; margin-bottom: 10px;
  }
  .doc-meta-line {
    font-size: 11px; margin-bottom: 2px;
  }
  .doc-meta-line strong { font-weight: 600; }

  hr.divider {
    border: none; border-top: 1px solid var(--line);
    margin: 14px 0;
  }

  /* party blocks */
  .party-head {
    font-size: 16px; font-weight: 700;
    letter-spacing: -0.02em; margin-bottom: 8px;
  }
  .party-line { font-size: 11px; line-height: 1.7; }
  .party-line strong { font-weight: 600; }

  /* service table */
  .section-head {
    font-size: 16px; font-weight: 700;
    letter-spacing: -0.02em; margin-bottom: 10px;
  }
  .doc-table {
    width: 100%; border-collapse: collapse;
    border: 1px solid var(--line);
  }
  .doc-table thead tr { background: var(--soft); }
  .doc-table th {
    font-size: 9.5px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.08em;
    color: var(--faint); text-align: left;
    padding: 9px 12px; border-bottom: 1px solid var(--line);
  }
  .doc-table td {
    padding: 11px 12px; vertical-align: top;
    border-bottom: 1px solid var(--line);
  }
  .doc-table tbody tr:last-child td { border-bottom: none; }
  .tbl-num  { width: 5%; font-variant-numeric: tabular-nums; color: var(--faint); }
  .tbl-svc  { width: 75%; }
  .tbl-price {
    width: 20%; text-align: right;
    font-weight: 700; font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .total-row td {
    background: var(--soft); font-weight: 800; font-size: 12px;
    border-top: 1.5px solid var(--ink);
  }

  /* schedule table */
  .sched-stage { width: 14%; font-weight: 600; }
  .sched-desc  { width: 52%; color: var(--muted); }
  .sched-amt   { width: 18%; font-weight: 700; text-align: right;
                 font-variant-numeric: tabular-nums; white-space: nowrap; }
  .sched-due   { width: 16%; color: var(--muted); }
  th.th-stage  { width: 14%; }
  th.th-desc   { width: 52%; }
  th.th-amt    { width: 18%; text-align: right !important; }
  th.th-due    { width: 16%; }

  /* conditions */
  .conditions { margin-top: 14px; }
  .conditions ol { padding-left: 18px; }
  .conditions li { font-size: 11px; line-height: 1.7; margin-bottom: 2px; }

  /* signatures */
  .sig-section-head {
    font-size: 16px; font-weight: 700;
    letter-spacing: -0.02em; margin-bottom: 12px;
  }
  .sig-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 24px;
  }
  .sig-party-head {
    font-size: 13px; font-weight: 700;
    margin-bottom: 6px; letter-spacing: -0.01em;
  }
  .sig-line { font-size: 11px; line-height: 1.8; }
  .sig-line strong { font-weight: 600; }
  .sig-blank {
    display: inline-block; border-bottom: 1px solid var(--ink);
    min-width: 120px; margin-left: 6px; vertical-align: bottom;
  }

  /* footer */
  .doc-footer {
    margin-top: auto; padding-top: 12px;
    border-top: 1px solid var(--line);
    font-size: 10px; color: var(--faint);
    display: flex; justify-content: space-between;
  }
  .footer-italic { font-style: italic; }
`;

export function renderInvoiceHtml(
  proposal: ProposalLike,
  recipient: Recipient,
): string {
  const { doc_number, language, offer } = proposal;
  const invNumber = `${doc_number}-INV`;
  const today = new Date().toLocaleDateString("ka-GE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const issuer = issuerName(language);
  const clientName = recipient.name || esc(offer.client_name);

  const totalRow = `
    <tr class="total-row">
      <td></td>
      <td><strong>სულ ჯამი</strong></td>
      <td style="text-align:right;font-variant-numeric:tabular-nums;">${fmt(offer.price)} ₾</td>
    </tr>`;

  const schedTotalRow = `
    <tr class="total-row">
      <td></td>
      <td><strong>სულ ჯამი</strong></td>
      <td style="text-align:right;font-variant-numeric:tabular-nums;">${fmt(offer.price)} ₾</td>
      <td></td>
    </tr>`;

  return `<!doctype html>
<html lang="ka">
<head>
  <meta charset="utf-8" />
  <title>ინვოისი ${esc(invNumber)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&family=Noto+Sans+Georgian:wght@400;500;600;700;800&display=swap"
    rel="stylesheet"
  />
  <style>${CSS}</style>
</head>
<body>
<section class="page">

  <!-- TITLE -->
  <div class="doc-title">${esc(clientName)} — ინვოისი</div>
  <div class="doc-subtitle">ინვოისი / INVOICE</div>
  <div class="doc-meta-line"><strong>ინვოისის ნომერი:</strong> ${esc(invNumber)}&nbsp;&nbsp;&nbsp;<strong>გამოწერის თარიღი:</strong> ${today}&nbsp;&nbsp;&nbsp;<strong>პირველი გადახდის ვადა:</strong> ${offer.schedule[0] ? esc(offer.schedule[0].when) : BLANK}</div>

  <hr class="divider" />

  <!-- ISSUER -->
  <div class="party-head">შემსრულებელი / Issuer</div>
  <div class="party-line"><strong>${esc(issuer)}</strong> საიდენტიფიკაციო კოდი: <strong>${ISSUER.id_code}</strong> იურიდიული მისამართი: ${esc(ISSUER.address_ka)} წარმომადგენელი: დირექტორი <strong>${esc(ISSUER.director)}</strong></div>
  <div class="party-line"><strong>ბანკი:</strong> ${esc(ISSUER.bank)} <strong>ანგარიში (IBAN):</strong> ${ISSUER.iban}</div>
  <div class="party-line">ელფოსტა: ${esc(ISSUER.email)} ვებსაიტი: ${esc(ISSUER.website)}</div>

  <hr class="divider" />

  <!-- RECIPIENT -->
  <div class="party-head">დამკვეთი / Recipient</div>
  <div class="party-line"><strong>${esc(clientName)}</strong> საიდენტიფიკაციო კოდი: ${recipientField(recipient.id_code)}&nbsp;&nbsp;მისამართი: ${recipientField(recipient.address)}&nbsp;&nbsp;წარმომადგენელი: ${recipientField(recipient.representative)}</div>

  <hr class="divider" />

  <!-- SERVICE TABLE -->
  <div class="section-head">მომსახურების აღწერა</div>
  <table class="doc-table">
    <thead>
      <tr>
        <th class="tbl-num">#</th>
        <th>მომსახურება</th>
        <th style="text-align:right;">ღირებულება (₾)</th>
      </tr>
    </thead>
    <tbody>
      ${serviceRows(offer.scope_lines)}
      ${totalRow}
    </tbody>
  </table>

  <hr class="divider" />

  <!-- PAYMENT SCHEDULE -->
  <div class="section-head">გადახდის გრაფიკი</div>
  <table class="doc-table">
    <thead>
      <tr>
        <th class="th-stage">ეტაპი</th>
        <th class="th-desc">აღწერა</th>
        <th class="th-amt">თანხა (₾)</th>
        <th class="th-due">ვადა</th>
      </tr>
    </thead>
    <tbody>
      ${scheduleRows(offer.schedule)}
      ${schedTotalRow}
    </tbody>
  </table>

  <hr class="divider" />

  <!-- CONDITIONS -->
  <div class="section-head">პირობები</div>
  <div class="conditions">
    <ol>
      <li>ანგარიშსწორება ხორციელდება უნაღდო ანგარიშსწორების გზით, შემსრულებლის საბანკო ანგარიშზე.</li>
      <li>გადასახადების გადახდა ევალება შემსრულებელს საქართველოს კანონმდებლობის შესაბამისად.</li>
      <li>წინამდებარე ინვოისი წარმოადგენს ხელშეკრულების შემადგენელ ნაწილს (დოკუმენტი ${esc(doc_number)}).</li>
      <li>გადახდის შემდეგ შემსრულებელი გასცემს მიღება-ჩაბარების აქტს.</li>
    </ol>
  </div>

  <hr class="divider" />

  <!-- SIGNATURES -->
  <div class="sig-section-head">ხელმოწერები</div>
  <div class="sig-grid">
    <div>
      <div class="sig-party-head">შემსრულებელი</div>
      <div class="sig-line"><strong>${esc(issuer)}</strong> ს/კ: ${ISSUER.id_code} დირექტორი: ${esc(ISSUER.director)}</div>
      <div class="sig-line" style="margin-top:8px;">ხელმოწერა: <span class="sig-blank">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></div>
      <div class="sig-line" style="margin-top:6px;">თარიღი: <span class="sig-blank">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></div>
    </div>
    <div>
      <div class="sig-party-head">დამკვეთი</div>
      <div class="sig-line"><strong>${esc(clientName)}</strong></div>
      <div class="sig-line" style="margin-top:8px;">ხელმოწერა: <span class="sig-blank">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></div>
      <div class="sig-line" style="margin-top:6px;">თარიღი: <span class="sig-blank">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></div>
    </div>
  </div>

  <div class="doc-footer">
    <span>ეს ინვოისი არის ნაწილი ${today}-ს მომზადებული მომსახურების ხელშეკრულებისა (დოკუმენტი ${esc(doc_number)}).</span>
    <span class="footer-italic">მომზადდა Allone Labs-ის მიერ.</span>
  </div>

</section>
</body>
</html>`;
}
