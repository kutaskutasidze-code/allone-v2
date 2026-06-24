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

const LOGO = `<svg class="logo" xmlns="http://www.w3.org/2000/svg" viewBox="13 -52 1364 425" fill="currentColor" aria-label="AllOne"><g transform="translate(0,372) scale(0.1,-0.1)"><path d="M3210 1340 l0 -1100 200 0 200 0 0 1100 0 1100 -200 0 -200 0 0 -1100z"/><path d="M4220 1340 l0 -1100 205 0 205 0 0 1100 0 1100 -205 0 -205 0 0 -1100z"/><path d="M6215 2399 c-524 -48 -835 -208 -981 -504 -83 -169 -88 -202 -89 -580 0 -311 1 -335 23 -420 12 -49 43 -132 68 -184 39 -80 60 -108 138 -185 132 -132 262 -201 482 -257 212 -53 324 -64 684 -63 283 0 343 3 465 22 432 67 686 213 818 470 86 166 107 288 107 612 0 242 -13 367 -51 480 -120 364 -456 560 -1044 610 -139 11 -489 11 -620 -1z m617 -390 c382 -41 573 -179 624 -449 22 -117 15 -478 -11 -560 -74 -237 -257 -357 -610 -400 -129 -16 -472 -16 -600 0 -55 6 -141 22 -192 35 -246 63 -384 194 -429 407 -21 99 -15 509 9 579 47 140 128 235 252 294 85 41 233 81 350 94 117 13 488 13 607 0z"/><path d="M785 1319 c-313 -583 -572 -1064 -573 -1070 -2 -5 87 -9 226 -9 l230 0 108 210 109 210 679 -3 680 -2 107 -205 108 -205 231 -3 231 -2 -41 77 c-22 43 -280 524 -573 1068 l-532 990 -210 2 -210 3 -570 -1061z m1039 143 c135 -260 246 -477 246 -482 0 -6 -180 -10 -505 -10 -367 0 -505 3 -505 11 0 22 503 970 510 962 4 -4 118 -221 254 -481z"/><path d="M9570 1804 c-228 -26 -336 -51 -443 -105 -121 -62 -205 -129 -274 -223 l-43 -58 0 176 0 176 -185 0 -185 0 0 -765 0 -765 205 0 205 0 0 388 c0 413 4 450 52 550 37 77 121 158 212 202 145 72 209 83 461 84 200 1 227 -1 298 -22 177 -51 256 -124 310 -285 20 -58 21 -88 25 -489 l4 -428 205 0 205 0 -5 482 c-4 541 -6 551 -78 706 -30 66 -54 99 -111 156 -110 108 -237 167 -431 201 -87 15 -359 27 -427 19z"/><path d="M11950 1804 c-375 -35 -565 -97 -710 -231 -85 -79 -142 -185 -165 -306 -21 -109 -20 -431 0 -535 51 -256 238 -419 558 -488 195 -42 627 -59 878 -34 460 45 694 179 754 431 8 35 15 85 15 112 l0 47 -210 0 -210 0 0 -30 c0 -50 -36 -108 -88 -141 -118 -75 -306 -103 -642 -96 -260 6 -339 18 -451 69 -115 52 -179 138 -194 261 l-7 57 901 0 901 0 0 143 c0 158 -11 241 -41 322 -92 245 -338 375 -789 415 -105 9 -415 11 -500 4z m505 -329 c169 -26 265 -65 332 -138 42 -45 82 -144 68 -167 -4 -7 -238 -10 -687 -10 l-681 0 7 42 c9 54 52 133 91 165 60 51 183 95 318 112 111 15 444 12 552 -4z"/></g><g transform="translate(964,-44) scale(1.0)"><g transform="translate(-32.3,256.8) scale(0.1,-0.1)"><path d="M1302 2512 c234 -189 328 -392 272 -583 -84 -285 -514 -557 -1158 -733 -149 -41 -140 -43 182 -52 858 -23 1837 165 2225 428 l57 39 -16 32 c-63 120 -386 332 -904 591 -241 120 -618 295 -720 334 -8 3 20 -22 62 -56z"/><path d="M3017 2296 c-208 -75 -272 -329 -124 -493 121 -133 350 -123 458 21 178 236 -59 570 -334 472z"/></g></g></svg>`;

const CSS = `
  :root {
    --ink: #0c1016;
    --ink-2: #11181C;
    --muted: #4a5058;
    --faint: #6b7480;
    --line: #D9D7D1;
    --bg: #F1F0EE;
    --soft: #E8E7E2;
    --accent: #2776EA;
    --head: 'Space Grotesk','Noto Sans Georgian',system-ui,sans-serif;
    --mono: 'JetBrains Mono','Noto Sans Georgian',ui-monospace,SFMono-Regular,Menlo,monospace;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: A4; margin: 0; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body {
    font-family: "Geist", "Noto Sans Georgian", system-ui, sans-serif;
    color: var(--ink-2);
    background: var(--bg);
    font-size: 10.5px;
    line-height: 1.5;
    letter-spacing: -0.005em;
  }
  .brand-head {
    display: flex; align-items: center; justify-content: space-between;
    padding-bottom: 10px; border-bottom: 1px solid var(--line); margin-bottom: 12px;
  }
  .brand-head .logo { height: 26px; width: auto; color: var(--ink); display: block; }
  .brand-head .kind {
    font-family: var(--mono); font-size: 9px; letter-spacing: .18em;
    text-transform: uppercase; color: var(--accent); font-weight: 600;
  }
  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 12mm 16mm 10mm;
    position: relative;
    page-break-after: always;
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .page:last-child { page-break-after: auto; }

  /* title */
  .doc-title {
    font-family: var(--head); font-size: 28px; font-weight: 700;
    letter-spacing: -0.025em; line-height: 1.05; color: var(--ink);
    margin-bottom: 4px;
  }
  .doc-subtitle {
    font-family: var(--head); font-size: 18px; font-weight: 700;
    letter-spacing: -0.02em; margin-bottom: 6px; color: var(--ink);
  }
  .doc-meta-line {
    font-family: var(--mono); font-size: 10px; color: var(--faint);
    letter-spacing: .02em; margin-bottom: 3px;
  }
  .doc-meta-line strong { font-weight: 600; color: var(--ink); }

  hr.divider {
    border: none; border-top: 1px solid var(--line);
    margin: 9px 0;
  }

  /* party blocks */
  .party-head {
    font-family: var(--head); font-size: 16px; font-weight: 700;
    letter-spacing: -0.02em; margin-bottom: 5px; color: var(--ink);
  }
  .party-line { font-size: 10.5px; line-height: 1.5; }
  .party-line strong { font-weight: 600; }

  /* service table */
  .section-head {
    font-size: 15px; font-weight: 700;
    letter-spacing: -0.02em; margin-bottom: 6px;
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
    padding: 6px 12px; border-bottom: 1px solid var(--line);
  }
  .doc-table td {
    padding: 7px 12px; vertical-align: top;
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
  .conditions { margin-top: 9px; }
  .conditions ol { padding-left: 18px; }
  .conditions li { font-size: 10.5px; line-height: 1.5; margin-bottom: 1px; }

  /* signatures */
  .sig-section-head {
    font-size: 16px; font-weight: 700;
    letter-spacing: -0.02em; margin-bottom: 8px;
  }
  .sig-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 24px;
  }
  .sig-party-head {
    font-size: 13px; font-weight: 700;
    margin-bottom: 6px; letter-spacing: -0.01em;
  }
  .sig-line { font-size: 10.5px; line-height: 1.5; }
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
  const clientName = recipient.name || offer.client_name;

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
    href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&family=Noto+Sans+Georgian:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
    rel="stylesheet"
  />
  <style>${CSS}</style>
</head>
<body>
<section class="page">

  <div class="brand-head">
    ${LOGO}
    <span class="kind">ინვოისი · ${esc(invNumber)}</span>
  </div>

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
