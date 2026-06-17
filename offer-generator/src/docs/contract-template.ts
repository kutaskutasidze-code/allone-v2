import type {
  OfferDraft,
  OfferScopeLine,
  OfferStage,
} from "../offer/anchors.js";
import { ISSUER, issuerName, type Recipient } from "./issuer.js";
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
  }
  .page:last-child { page-break-after: auto; }

  .doc-title {
    font-size: 22px; font-weight: 800;
    letter-spacing: -0.03em; text-align: center;
    margin-bottom: 16px;
  }
  .doc-meta {
    display: flex; justify-content: space-between;
    font-size: 11px; margin-bottom: 14px;
  }
  .parties-intro {
    font-size: 11px; line-height: 1.75;
    margin-bottom: 16px;
  }
  hr.divider {
    border: none; border-top: 1px solid var(--line);
    margin: 12px 0;
  }

  .sec-head {
    font-size: 13px; font-weight: 700;
    letter-spacing: -0.01em;
    margin-top: 14px; margin-bottom: 6px;
  }
  .sec-p {
    font-size: 11px; line-height: 1.7;
    margin-bottom: 4px; color: var(--ink);
  }
  .sec-list {
    font-size: 11px; line-height: 1.7;
    margin: 6px 0 6px 20px;
  }
  .sec-list li { margin-bottom: 3px; }

  /* signature block */
  .sig-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 32px; margin-top: 24px;
  }
  .sig-col-head {
    font-size: 13px; font-weight: 700;
    margin-bottom: 10px;
  }
  .sig-row {
    font-size: 11px; line-height: 1.9;
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
  const clientName = recipient.name || esc(offer.client_name);
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
<p class="sec-p">2.1. წინამდებარე ხელშეკრულებით განსაზღვრული მომსახურების ღირებულება ჯამურად შეადგენს <strong>${fmt(offer.price)} ₾</strong> გადასახადების ჩათვლით.</p>
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
    href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&family=Noto+Sans+Georgian:wght@400;500;600;700;800&display=swap"
    rel="stylesheet"
  />
  <style>${CSS}</style>
</head>
<body>
<div class="page">

  <div class="doc-title">მომსახურების ხელშეკრულება ${esc(doc_number)}</div>

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
