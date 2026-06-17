import type { OfferDraft, OfferScopeLine, OfferStage } from "./anchors.js";

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

function scopeRows(lines: OfferScopeLine[]): string {
  return lines
    .map(
      (l) => `
      <tr>
        <td class="scope-label">${esc(l.label)}</td>
        <td class="scope-desc">${esc(l.description)}</td>
        <td class="scope-price">${fmt(l.price)} ₾</td>
      </tr>`,
    )
    .join("");
}

function scheduleRows(stages: OfferStage[]): string {
  return stages
    .map(
      (s) => `
      <tr>
        <td class="sched-label">${esc(s.label)}</td>
        <td class="sched-when">${esc(s.when)}</td>
        <td class="sched-amount">${fmt(s.amount)} ₾</td>
      </tr>`,
    )
    .join("");
}

function addonRows(lines: OfferScopeLine[]): string {
  return lines
    .map(
      (l) => `
      <tr class="addon-row">
        <td class="scope-label">${esc(l.label)}</td>
        <td class="scope-desc">${esc(l.description)}</td>
        <td class="scope-price">${fmt(l.price)} ₾</td>
      </tr>`,
    )
    .join("");
}

export function renderOfferHtml(offer: OfferDraft, docNumber?: string): string {
  const docNum = docNumber ?? offer.client_name;
  const today = new Date().toLocaleDateString("ka-GE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const addonsBlock =
    offer.addons && offer.addons.length > 0
      ? `
      <div class="section">
        <div class="section-head">
          <span class="section-num">03</span>
          <h2>სურვილისამებრ დამატებები</h2>
        </div>
        <table class="scope-table">
          <thead>
            <tr>
              <th class="th-label">სერვისი</th>
              <th class="th-desc">აღწერა</th>
              <th class="th-price">ღირებულება</th>
            </tr>
          </thead>
          <tbody>
            ${addonRows(offer.addons)}
          </tbody>
        </table>
      </div>`
      : "";

  return `<!doctype html>
<html lang="ka">
<head>
  <meta charset="utf-8" />
  <title>კომერციული შეთავაზება — ${esc(offer.client_name)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&family=Noto+Sans+Georgian:wght@400;500;600;700;800&display=swap"
    rel="stylesheet"
  />
  <style>
    :root {
      --ink: #0a0a0a;
      --muted: #6b6b6b;
      --faint: #9a9a9a;
      --line: #e7e5e4;
      --bg: #ffffff;
      --soft: #f5f5f4;
      --accent: #0a0a0a;
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
      padding: 20mm 18mm;
      position: relative;
      page-break-after: always;
      display: flex;
      flex-direction: column;
    }
    .page:last-child { page-break-after: auto; }

    /* typography */
    .eyebrow {
      font-size: 10px; font-weight: 600;
      letter-spacing: 0.18em; text-transform: uppercase;
      color: var(--faint);
    }
    h1 {
      font-size: 38px; font-weight: 800;
      line-height: 1.05; letter-spacing: -0.03em;
    }
    h2 {
      font-size: 17px; font-weight: 700;
      letter-spacing: -0.02em; margin-bottom: 4px;
    }
    h3 { font-size: 12px; font-weight: 700; letter-spacing: -0.01em; }
    p { color: var(--muted); }
    .lead { font-size: 13px; line-height: 1.7; color: #2a2a2a; }

    /* brand bar */
    .brandbar {
      display: flex; align-items: center;
      justify-content: space-between;
      padding-bottom: 14px;
      border-bottom: 1px solid var(--line);
      margin-bottom: 0;
    }
    .wordmark {
      display: flex; align-items: center; gap: 9px;
      font-weight: 700; font-size: 13px; letter-spacing: -0.02em;
    }
    .logo {
      width: 24px; height: 24px; border-radius: 6px;
      background: var(--accent); color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 13px;
    }
    .badge {
      font-size: 9.5px; font-weight: 600;
      letter-spacing: 0.04em; color: var(--muted);
      border: 1px solid var(--line); border-radius: 999px;
      padding: 4px 11px;
    }

    /* cover */
    .cover-mid {
      flex: 1; display: flex; flex-direction: column;
      justify-content: center; gap: 20px;
      padding-top: 24px;
    }
    .cover-foot {
      display: flex; justify-content: space-between;
      align-items: flex-end;
      border-top: 1px solid var(--line);
      padding-top: 14px;
      color: var(--faint); font-size: 10px;
    }
    .doc-meta { font-size: 10px; color: var(--faint); line-height: 1.8; }
    .doc-meta strong { color: var(--muted); }

    /* sections */
    .section { margin-top: 24px; }
    .section-head {
      display: flex; align-items: baseline;
      gap: 10px; margin-bottom: 12px;
    }
    .section-num {
      font-size: 11px; font-weight: 700;
      color: var(--faint); font-variant-numeric: tabular-nums;
    }

    /* scope table */
    .scope-table {
      width: 100%; border-collapse: collapse;
      border: 1px solid var(--line); border-radius: 10px;
      overflow: hidden;
    }
    .scope-table thead tr {
      background: var(--soft);
      border-bottom: 1px solid var(--line);
    }
    .scope-table th {
      font-size: 9.5px; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.08em;
      color: var(--faint); text-align: left;
      padding: 10px 14px;
    }
    .scope-table td { padding: 12px 14px; vertical-align: top; }
    .scope-table tbody tr { border-bottom: 1px solid var(--line); }
    .scope-table tbody tr:last-child { border-bottom: none; }
    .th-label { width: 28%; }
    .th-desc  { width: 52%; }
    .th-price { width: 20%; text-align: right !important; }
    .scope-label { font-weight: 600; font-size: 11px; color: var(--ink); }
    .scope-desc  { font-size: 10.5px; color: var(--muted); }
    .scope-price { text-align: right; font-weight: 700; font-size: 11px;
                   font-variant-numeric: tabular-nums; white-space: nowrap; }
    .addon-row td { color: var(--muted); }
    .addon-row .scope-label { font-weight: 500; }
    .total-row td {
      background: var(--soft);
      padding: 12px 14px; font-weight: 800;
      font-size: 13px; border-top: 1.5px solid var(--ink);
    }

    /* price / investment box */
    .price-box {
      border: 1.5px solid var(--ink); border-radius: 14px; overflow: hidden;
    }
    .price-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 15px 20px; border-bottom: 1px solid var(--line);
    }
    .price-row:last-child { border-bottom: none; }
    .price-row .label h3 { font-size: 13px; }
    .price-row .label p  { font-size: 10px; margin-top: 1px; }
    .price-val {
      font-size: 20px; font-weight: 800; letter-spacing: -0.02em;
      font-variant-numeric: tabular-nums; color: var(--ink);
    }
    .price-val .cur { font-size: 14px; font-weight: 600; }

    /* schedule table */
    .sched-table {
      width: 100%; border-collapse: collapse;
      border: 1px solid var(--line); border-radius: 10px; overflow: hidden;
    }
    .sched-table thead tr {
      background: var(--soft); border-bottom: 1px solid var(--line);
    }
    .sched-table th {
      font-size: 9.5px; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.08em;
      color: var(--faint); text-align: left; padding: 10px 14px;
    }
    .sched-table td { padding: 12px 14px; border-bottom: 1px solid var(--line); }
    .sched-table tbody tr:last-child td { border-bottom: none; }
    .sched-label  { font-weight: 600; font-size: 11px; width: 30%; }
    .sched-when   { font-size: 10.5px; color: var(--muted); width: 50%; }
    .sched-amount {
      font-weight: 700; font-size: 11px; text-align: right;
      font-variant-numeric: tabular-nums; white-space: nowrap; width: 20%;
    }

    /* info pills */
    .info-row {
      display: flex; gap: 16px; margin-top: 8px;
    }
    .info-pill {
      flex: 1; border: 1px solid var(--line); border-radius: 10px;
      padding: 12px 16px;
    }
    .info-pill .pill-label {
      font-size: 9.5px; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.08em;
      color: var(--faint); margin-bottom: 4px;
    }
    .info-pill .pill-val {
      font-size: 13px; font-weight: 700; color: var(--ink);
    }

    /* footer */
    .footer-note {
      position: absolute; bottom: 12mm; left: 18mm; right: 18mm;
      font-size: 9px; color: var(--faint);
      display: flex; justify-content: space-between;
      border-top: 1px solid var(--line); padding-top: 8px;
    }

    /* why allone */
    .why-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
    }
    .why-item {
      border: 1px solid var(--line); border-radius: 10px;
      padding: 14px 16px;
    }
    .why-item h3 { font-size: 11.5px; margin-bottom: 3px; }
    .why-item p  { font-size: 10px; }

    /* CTA footer */
    .cta {
      margin-top: auto; border-top: 1px solid var(--line);
      padding-top: 16px;
      display: flex; justify-content: space-between; align-items: flex-end;
    }
    .cta .big {
      font-size: 15px; font-weight: 700; letter-spacing: -0.02em;
    }
    .cta .contact {
      text-align: right; font-size: 11px; color: var(--muted); line-height: 1.8;
    }
  </style>
</head>
<body>

<!-- ========== PAGE 1 — COVER ========== -->
<section class="page">
  <div class="brandbar">
    <div class="wordmark"><span class="logo">A</span> Allone Labs</div>
    <span class="badge">კომერციული შეთავაზება</span>
  </div>

  <div class="cover-mid">
    <div>
      <div class="eyebrow">AllOnce · ციფრული გარდაქმნა</div>
      <h1>${esc(offer.client_name)}<br />— AllOnce<br />შეთავაზება</h1>
    </div>
    <p class="lead">${esc(offer.summary)}</p>
    <div class="doc-meta">
      <div><strong>დოკ. №</strong> ${esc(docNum)}</div>
      <div><strong>თარიღი</strong> ${today}</div>
      <div><strong>ვალუტა</strong> ${esc(offer.currency)}</div>
    </div>
  </div>

  <div class="cover-foot">
    <span>Allone Labs — AI &amp; ავტომატიზაცია</span>
    <span>კონფიდენციალური · მომზადებულია კლიენტისთვის</span>
  </div>
</section>

<!-- ========== PAGE 2 — SCOPE + INVESTMENT ========== -->
<section class="page">
  <div class="brandbar">
    <div class="wordmark"><span class="logo">A</span> Allone Labs</div>
    <span class="badge">${esc(offer.client_name)}</span>
  </div>

  <div class="section">
    <div class="section-head">
      <span class="section-num">01</span>
      <h2>სამუშაოს სკოფი</h2>
    </div>
    <table class="scope-table">
      <thead>
        <tr>
          <th class="th-label">სერვისი</th>
          <th class="th-desc">აღწერა</th>
          <th class="th-price">ღირებულება</th>
        </tr>
      </thead>
      <tbody>
        ${scopeRows(offer.scope_lines)}
        <tr class="total-row">
          <td colspan="2">სულ</td>
          <td style="text-align:right;font-variant-numeric:tabular-nums;">${fmt(offer.price)} ₾</td>
        </tr>
      </tbody>
    </table>
  </div>

  ${addonsBlock}

  <div class="section">
    <div class="section-head">
      <span class="section-num">02</span>
      <h2>ინვესტიცია</h2>
    </div>
    <div class="price-box">
      <div class="price-row">
        <div class="label">
          <h3>სრული ღირებულება</h3>
          <p>ყველა სამუშაო, დადგენილ სკოფში</p>
        </div>
        <span class="price-val"><span class="cur">₾</span> ${fmt(offer.price)}</span>
      </div>
      <div class="price-row">
        <div class="label">
          <h3>ყოველთვიური ოპერირება</h3>
          <p>ჰოსტინგი, მხარდაჭერა, ტექნიკური ოპს</p>
        </div>
        <span class="price-val" style="font-size:15px;">${esc(offer.monthly_opex)}</span>
      </div>
    </div>
  </div>

  <div class="footer-note">
    <span>Allone Labs · კომერციული შეთავაზება</span>
    <span>2</span>
  </div>
</section>

<!-- ========== PAGE 3 — SCHEDULE + TIMELINE + WHY + CTA ========== -->
<section class="page">
  <div class="brandbar">
    <div class="wordmark"><span class="logo">A</span> Allone Labs</div>
    <span class="badge">${esc(offer.client_name)}</span>
  </div>

  <div class="section">
    <div class="section-head">
      <span class="section-num">03</span>
      <h2>გადახდის გრაფიკი</h2>
    </div>
    <table class="sched-table">
      <thead>
        <tr>
          <th>ეტაპი</th>
          <th>გადახდის პირობა</th>
          <th style="text-align:right;">თანხა</th>
        </tr>
      </thead>
      <tbody>
        ${scheduleRows(offer.schedule)}
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-head">
      <span class="section-num">04</span>
      <h2>ვადა და ოპერირება</h2>
    </div>
    <div class="info-row">
      <div class="info-pill">
        <div class="pill-label">პროექტის ვადა</div>
        <div class="pill-val">${esc(offer.timeline)}</div>
      </div>
      <div class="info-pill">
        <div class="pill-label">ყოველთვიური ოპს</div>
        <div class="pill-val">${esc(offer.monthly_opex)}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-head">
      <span class="section-num">05</span>
      <h2>რატომ Allone Labs</h2>
    </div>
    <div class="why-grid">
      <div class="why-item">
        <h3>სრული გუნდი ერთ ადგილას</h3>
        <p>დიზაინი, დეველოპმენტი, AI ინტეგრაცია და ოპს — ერთი კომუნიკაციით.</p>
      </div>
      <div class="why-item">
        <h3>AI-ნეიტიური მიდგომა</h3>
        <p>ვაშენებთ სისტემებს, რომლებიც ახლავე ზრდიან გაყიდვებს და ამცირებენ ხარჯებს.</p>
      </div>
      <div class="why-item">
        <h3>გამჭვირვალე ფასი</h3>
        <p>ფიქსირებული ფასი სკოფზე — დამატებითი ბილინგი მხოლოდ სკოფის ცვლილებაზე.</p>
      </div>
      <div class="why-item">
        <h3>ადგილობრივი გუნდი</h3>
        <p>თბილისში — ვხვდებით პირადად, ვარ ხელმისაწვდომი ქართულ სასაათო სარტყელში.</p>
      </div>
    </div>
  </div>

  <div class="cta">
    <div>
      <div class="big">მზად ხართ დასაწყებად?</div>
      <p style="margin-top:4px;font-size:10.5px;">დოკ. № ${esc(docNum)}</p>
    </div>
    <div class="contact">
      <div><strong>შპს „ოლუან"</strong></div>
      <div>ს/კ 405826361</div>
      <div>luka.adamia@allonelabs.com</div>
      <div>allonelabs.com</div>
    </div>
  </div>

  <div class="footer-note">
    <span>Allone Labs · კომერციული შეთავაზება</span>
    <span>3</span>
  </div>
</section>

</body>
</html>`;
}
