import type {
  OfferDraft,
  OfferScopeLine,
  OfferStage,
} from "../offer/anchors.js";
import { ISSUER, issuerName, type Recipient } from "./issuer.js";
import { gelWords } from "./gel-words.js";
import type { ProposalLike } from "./invoice-template.js";

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

function scopeList(lines: OfferScopeLine[]): string {
  return lines
    .map(
      (l) =>
        `<li><strong>${esc(l.label)}</strong>${l.description ? ` — ${esc(l.description)}` : ""}</li>`,
    )
    .join("\n");
}

function scheduleList(stages: OfferStage[]): string {
  return stages
    .map(
      (s) =>
        `<li>${esc(s.label)} — <strong>${fmt(s.amount)} ₾</strong> — ${esc(s.when)}</li>`,
    )
    .join("\n");
}

// ── verbatim boilerplate §3–§9 (copied from reference PDF) ────────────────

const SEC3 = `<h2 class="sec-head">3. მხარეთა უფლება-მოვალეობები</h2>
<p class="sec-p"><strong>3.1. „შემსრულებელი" ვალდებულია:</strong></p>
<p class="sec-p">3.1.1. შეასრულოს დაკისრებული სამუშაო სათანადო ხარისხით, ჯეროვნად და კეთილსინდისიერად.</p>
<p class="sec-p"><strong>3.2. „შემსრულებელი" უფლებამოსილია:</strong></p>
<p class="sec-p">3.2.1. მოითხოვოს ანაზღაურება დროულად, ხელშეკრულებით დადგენილი პირობების შესაბამისად.</p>
<p class="sec-p">3.2.2. მიიღოს ინფორმაცია, რომელიც საჭიროა ხელშეკრულების კეთილსინდისიერი და ჯეროვანი შესრულებისათვის.</p>
<p class="sec-p"><strong>3.3. „დამკვეთი" ვალდებულია:</strong></p>
<p class="sec-p">3.3.1. წინამდებარე ხელშეკრულების გათვალისწინებული წესით მოახდინოს ანგარიშსწორება „შემსრულებელთან".</p>
<p class="sec-p">3.3.2. უზრუნველყოს შემსრულებელი სამუშაოს შესრულებისთვის საჭირო ინფორმაციით.</p>
<p class="sec-p"><strong>3.4. „დამკვეთს" უფლება აქვს:</strong></p>
<p class="sec-p">3.4.1. ნებისმიერ დროს შეამოწმოს შემსრულებლის მიერ გაწეული მუშაობის ხარისხი და მისი შესაბამისობა ხელშეკრულების პირობებთან.</p>`;

const SEC4 = `<h2 class="sec-head">4. მხარეთა პასუხისმგებლობა</h2>
<p class="sec-p">4.1. მხარეები იღებენ ვალდებულებას აუნაზღაურონ ერთმანეთს მათ მიერ ხელშეკრულების სრულად, ან ნაწილობრივ შეუსრულებლობის, ან არაჯეროვნად შესრულების შედეგად მიყენებული ზიანი (ზარალი) კანონმდებლობით ან/და ხელშეკრულებით დადგენილი წესით. ზარალის ანაზღაურება მხარეებს არ ათავისუფლებს ვალდებულებების შესრულებისაგან.</p>`;

const SEC5 = `<h2 class="sec-head">5. კონფიდენციალურობა</h2>
<p class="sec-p">5.1. მხარეები ვალდებული არიან, როგორც ხელშეკრულების მოქმედების პერიოდში, ასევე სახელშეკრულებო ურთიერთობის დამთავრების შემდეგაც დაიცვან მეორე მხარისაგან მიღებული ნებისმიერი სახის ინფორმაციის კონფიდენციალურობა.</p>`;

const SEC6 = `<h2 class="sec-head">6. დავათა გადაწყვეტა</h2>
<p class="sec-p">6.1. წინამდებარე ხელშეკრულებიდან გამომდინარე ან მასთან დაკავშირებული ნებისმიერი უთანხმოება მხარეთა მიერ უნდა გადაწყდეს მოლაპარაკების გზით. შეთანხმების მიუღწევლობის შემთხვევაში დავა განიხილება და გადაწყდება საქართველოს კანონმდებლობის შესაბამისად თბილისის საქალაქო სასამართლოს მიერ.</p>`;

const SEC7 = `<h2 class="sec-head">7. ფორს-მაჟორი</h2>
<p class="sec-p">7.1. ფორს-მაჟორის მოქმედების განმავლობაში არც ერთი მხარე არ აგებს პასუხს ხელშეკრულებით ნაკისრი ვალდებულებების სრულად ან ნაწილობრივ შეუსრულებლობისათვის ან არაჯეროვნად შესრულებისათვის.</p>
<p class="sec-p">7.2. მხარე, რომელსაც დაუდგა ფორს-მაჟორი, ვალდებულია გონივრულ ვადაში, მაგრამ არაუგვიანეს 5 (ხუთი) სამუშაო დღისა, აცნობოს მეორე მხარეს შესაბამისი ფორს-მაჟორული გარემოებ(ებ)ის და მისი/მათი სავარაუდო ხანგრძლივობის შესახებ, წინააღმდეგ შემთხვევაში, იგი კარგავს უფლებას დაეყრდნოს ფორს-მაჟორის არსებობას, როგორც პასუხისმგებლობისგან გათავისუფლების საფუძველს.</p>
<p class="sec-p">7.3. თუ ფორს-მაჟორის მოქმედება 30 (ოცდაათი) კალენდარულ დღეზე მეტხანს გრძელდება, აღნიშნული ვადის გასვლიდან 15 (თხუთმეტი) კალენდარული დღის ვადაში მხარეებმა უნდა გადაწყვიტონ ხელშეკრულების ბედი, წინააღმდეგ შემთხვევაში ხელშეკრულება ძალადაკარგულად ჩაითვლება.</p>`;

const SEC8 = `<h2 class="sec-head">8. ხელშეკრულების მოქმედება და შეწყვეტა</h2>
<p class="sec-p">8.1. წინამდებარე ხელშეკრულება ძალაში შედის მხარეთა მიერ ხელმოწერისთანავე და მოქმედებს ვალდებულებათა სრულად შესრულებამდე.</p>
<p class="sec-p">8.2. ხელშეკრულებით ან/და კანონმდებლობით დადგენილ შემთხვევებში და პირობებით შესაძლებელია ხელშეკრულების ვადამდე სრულად, ან ნაწილობრივ შეწყვეტა:</p>
<p class="sec-p">8.2.1. წინამდებარე ხელშეკრულება შეიძლება შეწყდეს ნებისმიერი მხარის მიერ თუ მეორე მხარე არღვევს წინამდებარე ხელშეკრულებით ნაკისრ ვალდებულებას/ვალდებულებებს;</p>
<p class="sec-p">8.2.2. მხარეთა წერილობითი შეთანხმებით;</p>
<p class="sec-p">8.2.3. ხელშეკრულებით ან/და კანონმდებლობით გათვალისწინებულ სხვა შემთხვევებში.</p>`;

const SEC9 = `<h2 class="sec-head">9. დასკვნითი დებულებები</h2>
<p class="sec-p">9.1. ხელშეკრულებაში ცვლილებებისა და დამატებების შეტანა დაიშვება წერილობითი ფორმით მხარეთა შეთანხმებით.</p>
<p class="sec-p">9.2. მხარეები ადასტურებენ, რომ ხელშეკრულების შინაარსი ზუსტად გამოხატავს მათ ნებას, რომ მათ მიერ ნების გამოვლენა მოხდა ხელშეკრულების შინაარსის გონივრული განსჯის შედეგად და არა მხოლოდ სიტყვა-სიტყვითი მნიშვნელობიდან.</p>
<p class="sec-p">9.3. ხელშეკრულება შედგენილია ქართულ ენაზე თანაბარი იურიდიული ძალის მქონე ორ ეგზემპლარად თითოეული მხარისთვის.</p>`;

// ─────────────────────────────────────────────────────────────────────────────

// Real AllOne lockup (matches the offer) — currentColor so it inks black here.
const LOGO = `<svg class="logo" xmlns="http://www.w3.org/2000/svg" viewBox="13 -52 1364 425" fill="currentColor" aria-label="AllOne"><g transform="translate(0,372) scale(0.1,-0.1)"><path d="M3210 1340 l0 -1100 200 0 200 0 0 1100 0 1100 -200 0 -200 0 0 -1100z"/><path d="M4220 1340 l0 -1100 205 0 205 0 0 1100 0 1100 -205 0 -205 0 0 -1100z"/><path d="M6215 2399 c-524 -48 -835 -208 -981 -504 -83 -169 -88 -202 -89 -580 0 -311 1 -335 23 -420 12 -49 43 -132 68 -184 39 -80 60 -108 138 -185 132 -132 262 -201 482 -257 212 -53 324 -64 684 -63 283 0 343 3 465 22 432 67 686 213 818 470 86 166 107 288 107 612 0 242 -13 367 -51 480 -120 364 -456 560 -1044 610 -139 11 -489 11 -620 -1z m617 -390 c382 -41 573 -179 624 -449 22 -117 15 -478 -11 -560 -74 -237 -257 -357 -610 -400 -129 -16 -472 -16 -600 0 -55 6 -141 22 -192 35 -246 63 -384 194 -429 407 -21 99 -15 509 9 579 47 140 128 235 252 294 85 41 233 81 350 94 117 13 488 13 607 0z"/><path d="M785 1319 c-313 -583 -572 -1064 -573 -1070 -2 -5 87 -9 226 -9 l230 0 108 210 109 210 679 -3 680 -2 107 -205 108 -205 231 -3 231 -2 -41 77 c-22 43 -280 524 -573 1068 l-532 990 -210 2 -210 3 -570 -1061z m1039 143 c135 -260 246 -477 246 -482 0 -6 -180 -10 -505 -10 -367 0 -505 3 -505 11 0 22 503 970 510 962 4 -4 118 -221 254 -481z"/><path d="M9570 1804 c-228 -26 -336 -51 -443 -105 -121 -62 -205 -129 -274 -223 l-43 -58 0 176 0 176 -185 0 -185 0 0 -765 0 -765 205 0 205 0 0 388 c0 413 4 450 52 550 37 77 121 158 212 202 145 72 209 83 461 84 200 1 227 -1 298 -22 177 -51 256 -124 310 -285 20 -58 21 -88 25 -489 l4 -428 205 0 205 0 -5 482 c-4 541 -6 551 -78 706 -30 66 -54 99 -111 156 -110 108 -237 167 -431 201 -87 15 -359 27 -427 19z"/><path d="M11950 1804 c-375 -35 -565 -97 -710 -231 -85 -79 -142 -185 -165 -306 -21 -109 -20 -431 0 -535 51 -256 238 -419 558 -488 195 -42 627 -59 878 -34 460 45 694 179 754 431 8 35 15 85 15 112 l0 47 -210 0 -210 0 0 -30 c0 -50 -36 -108 -88 -141 -118 -75 -306 -103 -642 -96 -260 6 -339 18 -451 69 -115 52 -179 138 -194 261 l-7 57 901 0 901 0 0 143 c0 158 -11 241 -41 322 -92 245 -338 375 -789 415 -105 9 -415 11 -500 4z m505 -329 c169 -26 265 -65 332 -138 42 -45 82 -144 68 -167 -4 -7 -238 -10 -687 -10 l-681 0 7 42 c9 54 52 133 91 165 60 51 183 95 318 112 111 15 444 12 552 -4z"/></g><g transform="translate(964,-44) scale(1.0)"><g transform="translate(-32.3,256.8) scale(0.1,-0.1)"><path d="M1302 2512 c234 -189 328 -392 272 -583 -84 -285 -514 -557 -1158 -733 -149 -41 -140 -43 182 -52 858 -23 1837 165 2225 428 l57 39 -16 32 c-63 120 -386 332 -904 591 -241 120 -618 295 -720 334 -8 3 20 -22 62 -56z"/><path d="M3017 2296 c-208 -75 -272 -329 -124 -493 121 -133 350 -123 458 21 178 236 -59 570 -334 472z"/></g></g></svg>`;

const CSS = `
  :root {
    --ink: #0c1016;
    --ink-2: #11181C;
    --muted: #4a5058;
    --steel: #6b7480;
    --line: #D9D7D1;
    --bg: #F1F0EE;
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
    font-size: 11px;
    line-height: 1.6;
    letter-spacing: -0.005em;
  }
  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 16mm 18mm 14mm;
    position: relative;
    page-break-after: always;
  }
  .page:last-child { page-break-after: auto; }

  /* branded header */
  .brand-head {
    display: flex; align-items: center; justify-content: space-between;
    padding-bottom: 14px; border-bottom: 1px solid var(--line); margin-bottom: 18px;
  }
  .brand-head .logo { height: 26px; width: auto; color: var(--ink); display: block; }
  .brand-head .kind {
    font-family: var(--mono); font-size: 9px; letter-spacing: .18em;
    text-transform: uppercase; color: var(--accent); font-weight: 600;
  }
  .doc-title {
    font-family: var(--head); font-size: 24px; font-weight: 700;
    letter-spacing: -0.02em; color: var(--ink); margin-bottom: 6px;
  }
  .doc-meta {
    display: flex; justify-content: space-between;
    font-family: var(--mono); font-size: 10px; color: var(--steel);
    letter-spacing: .03em; margin-bottom: 16px;
  }
  .parties-intro {
    font-size: 11px; line-height: 1.75;
    margin-bottom: 16px; color: var(--ink-2);
  }
  hr.divider {
    border: none; border-top: 1px solid var(--line);
    margin: 7px 0;
  }

  .sec-head {
    font-family: var(--head); font-size: 13.5px; font-weight: 700;
    letter-spacing: -0.01em; color: var(--ink);
    margin-top: 9px; margin-bottom: 4px;
  }
  .sec-p {
    font-size: 11px; line-height: 1.52;
    margin-bottom: 3px; color: var(--ink);
  }
  .sec-list {
    font-size: 11px; line-height: 1.52;
    margin: 5px 0 5px 20px;
  }
  .sec-list li { margin-bottom: 2px; }

  /* signature block — keep whole, never split across pages */
  .sig-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 32px; margin-top: 14px;
    break-inside: avoid; page-break-inside: avoid;
  }
  .sig-col-head {
    font-size: 13px; font-weight: 700;
    margin-bottom: 10px;
  }
  .sig-row {
    font-size: 11px; line-height: 1.6;
  }
  .sig-row strong { font-weight: 600; }
  .sig-blank {
    display: inline-block;
    border-bottom: 1px solid var(--ink);
    min-width: 140px; margin-left: 4px;
    vertical-align: bottom;
  }
`;

export function renderContractHtml(
  proposal: ProposalLike,
  recipient: Recipient,
  dateLabel: string,
): string {
  const { doc_number, language, offer } = proposal;
  const issuer = issuerName(language);
  const clientName = recipient.name || offer.client_name;
  const idCode = recipient.id_code ? `(პ/ნ ${esc(recipient.id_code)})` : "";

  // §1 — scope (variable)
  const sec1 = `<h2 class="sec-head">1. ხელშეკრულების საგანი</h2>
<p class="sec-p">1.1. შემსრულებელი ვალდებულია დამკვეთის მოთხოვნით განახორციელოს შემდეგი მომსახურება:</p>
<ul class="sec-list">
${scopeList(offer.scope_lines)}
</ul>
<p class="sec-p">1.2. შემსრულებლის მიერ 1.1 პუნქტით ნაკისრი ვალდებულების შესრულება უნდა მოხდეს არაუგვიანეს ${esc(offer.timeline)}.</p>
<p class="sec-p">1.3. წინამდებარე ხელშეკრულების 1.1 პუნქტით გათვალისწინებული მომსახურების გაწევის თაობაზე ფორმდება მიღება-ჩაბარების აქტი.</p>`;

  // §2 — price & schedule (variable)
  const sec2 = `<h2 class="sec-head">2. მომსახურების ღირებულება და ანგარიშსწორების წესი</h2>
<p class="sec-p">2.1. წინამდებარე ხელშეკრულებით განსაზღვრული მომსახურების ღირებულება ჯამურად შეადგენს <strong>${fmt(offer.price)} (${gelWords(offer.price)}) ₾</strong> გადასახადების ჩათვლით.</p>
<p class="sec-p">2.2. საქართველოს კანონმდებლობით გათვალისწინებული გადასახადების გადახდა ევალება შემსრულებელს.</p>
<p class="sec-p">2.3. მომსახურების ღირებულების გადახდა მოხდება შემდეგი გრაფიკით:</p>
<ul class="sec-list">
${scheduleList(offer.schedule)}
</ul>
<p class="sec-p">2.4. ანგარიშსწორება განხორციელდება უნაღდო ანგარიშსწორების გზით, შემსრულებლის კუთვნილ საბანკო ანგარიშზე.</p>`;

  return `<!doctype html>
<html lang="ka">
<head>
  <meta charset="utf-8" />
  <title>მომსახურების ხელშეკრულება ${esc(doc_number)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&family=Noto+Sans+Georgian:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
    rel="stylesheet"
  />
  <style>${CSS}</style>
</head>
<body>
<div class="page">

  <div class="brand-head">
    ${LOGO}
    <span class="kind">ხელშეკრულება · ${esc(doc_number)}</span>
  </div>

  <div class="doc-title">მომსახურების ხელშეკრულება</div>

  <div class="doc-meta">
    <span>ქ. თბილისი</span>
    <span>${esc(dateLabel)}</span>
  </div>

  <div class="parties-intro">
    ერთი მხრივ, <strong>${esc(clientName)}</strong> ${idCode} (შემდგომში „დამკვეთი"), და მეორე მხრივ, <strong>${esc(issuer)}</strong> (ს/კ ${ISSUER.id_code}) წარმოდგენილი მისი დირექტორის <strong>${esc(ISSUER.director)}</strong> სახით (შემდგომში „შემსრულებელი") (შემდგომში „მხარეები"), ვდებთ წინამდებარე ხელშეკრულებას შემდეგზე:
  </div>

  <hr class="divider" />

  ${sec1}

  <hr class="divider" />

  ${sec2}

  <hr class="divider" />

  ${SEC3}

  <hr class="divider" />

  ${SEC4}

  <hr class="divider" />

  ${SEC5}

  <hr class="divider" />

  ${SEC6}

  <hr class="divider" />

  ${SEC7}

  <hr class="divider" />

  ${SEC8}

  <hr class="divider" />

  ${SEC9}

  <hr class="divider" />

  <!-- SIGNATURE BLOCKS -->
  <div class="sig-grid">
    <div>
      <div class="sig-col-head">დამკვეთი</div>
      <div class="sig-row">${esc(clientName)}</div>
      ${recipient.id_code ? `<div class="sig-row">პ/ნ ${esc(recipient.id_code)}</div>` : ""}
      ${recipient.address ? `<div class="sig-row">მის: ${esc(recipient.address)}</div>` : `<div class="sig-row">მის: <span class="sig-blank">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></div>`}
      <div class="sig-row" style="margin-top:10px;">ხელმოწერა: <span class="sig-blank">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></div>
    </div>
    <div>
      <div class="sig-col-head">შემსრულებელი</div>
      <div class="sig-row"><strong>${esc(issuer)}</strong></div>
      <div class="sig-row">ს/კ ${ISSUER.id_code}</div>
      <div class="sig-row">იურიდიული მის: ${esc(ISSUER.address_ka)}</div>
      <div class="sig-row">ბანკი: ${esc(ISSUER.bank)}</div>
      <div class="sig-row">ა/ა (IBAN): ${ISSUER.iban}</div>
      <div class="sig-row">დირექტორი: ${esc(ISSUER.director)}</div>
      <div class="sig-row" style="margin-top:10px;">ხელმოწერა: <span class="sig-blank">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></div>
    </div>
  </div>

</div>
</body>
</html>`;
}
