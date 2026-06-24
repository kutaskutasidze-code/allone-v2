import type { OfferDraft, OfferScopeLine, OfferStage } from "./anchors.js";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

// Summary may arrive as one blob or with newlines — render each paragraph as
// its own <p> so structure survives (HTML collapses raw \n).
function summaryParas(summary: string): string {
  const blocks = summary
    .split(/\n\s*\n|\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (blocks.length === 0) return `<p class="lead">${esc(summary)}</p>`;
  return blocks.map((b) => `<p class="lead">${esc(b)}</p>`).join("");
}

// Open hairline rows (the site's "Services" list pattern) — no boxes.
function scopeRows(lines: OfferScopeLine[]): string {
  return lines
    .map(
      (l) => `
      <div class="row">
        <div class="row-main">
          <div class="row-title">${esc(l.label)}</div>
          <div class="row-desc">${esc(l.description)}</div>
        </div>
        <div class="row-price mono">${
          l.price > 0
            ? `${fmt(l.price)} <span class="cur">₾</span>`
            : `<span class="muted">შედის</span>`
        }</div>
      </div>`,
    )
    .join("");
}

function addonRows(lines: OfferScopeLine[]): string {
  return lines
    .map(
      (l) => `
      <div class="row">
        <div class="row-main">
          <div class="row-title">${esc(l.label)}</div>
          <div class="row-desc">${esc(l.description)}</div>
        </div>
        <div class="row-price mono muted">${fmt(l.price)} ₾</div>
      </div>`,
    )
    .join("");
}

function scheduleRows(stages: OfferStage[]): string {
  return stages
    .map(
      (s, i) => `
      <div class="row">
        <div class="row-main">
          <div class="row-title"><span class="step mono">${String(i + 1).padStart(2, "0")}</span> ${esc(s.label)}</div>
          <div class="row-desc">${esc(s.when)}</div>
        </div>
        <div class="row-price mono">${fmt(s.amount)} ₾</div>
      </div>`,
    )
    .join("");
}

const WHY = [
  {
    h: "თანამედროვე AI მიდგომა",
    p: "ვიყენებთ უახლეს ტექნოლოგიებს, რომლებიც ზრდიან გაყიდვებს და ამცირებენ ხარჯებს.",
  },
  {
    h: "ერთი გუნდი, ერთი წერტილი",
    p: "დიზაინი, დეველოპმენტი, AI ინტეგრაცია და ოპერირება — ერთი კომუნიკაციით.",
  },
  {
    h: "ფიქსირებული ფასი",
    p: "შეთანხმებულ სამუშაოზე ფასი ფიქსირებულია — დამატებით მხოლოდ მაშინ გადაიხდით, თუ სამუშაოს მოცულობა შეიცვლება.",
  },
];

function whyRows(): string {
  return WHY.map(
    (w) => `
      <div class="row">
        <div class="row-main">
          <div class="row-title">${w.h}</div>
          <div class="row-desc">${w.p}</div>
        </div>
      </div>`,
  ).join("");
}

// The real AllOne lockup (wordmark + swoosh) from allone-studio
// images/allone-lockup.svg — fill set to currentColor so CSS color controls it
// (black in the header, white in the footer).
const LOGO = `<svg class="logo" xmlns="http://www.w3.org/2000/svg" viewBox="13 -52 1364 425" fill="currentColor" aria-label="AllOne"><g transform="translate(0,372) scale(0.1,-0.1)"><path d="M3210 1340 l0 -1100 200 0 200 0 0 1100 0 1100 -200 0 -200 0 0 -1100z"/><path d="M4220 1340 l0 -1100 205 0 205 0 0 1100 0 1100 -205 0 -205 0 0 -1100z"/><path d="M6215 2399 c-524 -48 -835 -208 -981 -504 -83 -169 -88 -202 -89 -580 0 -311 1 -335 23 -420 12 -49 43 -132 68 -184 39 -80 60 -108 138 -185 132 -132 262 -201 482 -257 212 -53 324 -64 684 -63 283 0 343 3 465 22 432 67 686 213 818 470 86 166 107 288 107 612 0 242 -13 367 -51 480 -120 364 -456 560 -1044 610 -139 11 -489 11 -620 -1z m617 -390 c382 -41 573 -179 624 -449 22 -117 15 -478 -11 -560 -74 -237 -257 -357 -610 -400 -129 -16 -472 -16 -600 0 -55 6 -141 22 -192 35 -246 63 -384 194 -429 407 -21 99 -15 509 9 579 47 140 128 235 252 294 85 41 233 81 350 94 117 13 488 13 607 0z"/><path d="M785 1319 c-313 -583 -572 -1064 -573 -1070 -2 -5 87 -9 226 -9 l230 0 108 210 109 210 679 -3 680 -2 107 -205 108 -205 231 -3 231 -2 -41 77 c-22 43 -280 524 -573 1068 l-532 990 -210 2 -210 3 -570 -1061z m1039 143 c135 -260 246 -477 246 -482 0 -6 -180 -10 -505 -10 -367 0 -505 3 -505 11 0 22 503 970 510 962 4 -4 118 -221 254 -481z"/><path d="M9570 1804 c-228 -26 -336 -51 -443 -105 -121 -62 -205 -129 -274 -223 l-43 -58 0 176 0 176 -185 0 -185 0 0 -765 0 -765 205 0 205 0 0 388 c0 413 4 450 52 550 37 77 121 158 212 202 145 72 209 83 461 84 200 1 227 -1 298 -22 177 -51 256 -124 310 -285 20 -58 21 -88 25 -489 l4 -428 205 0 205 0 -5 482 c-4 541 -6 551 -78 706 -30 66 -54 99 -111 156 -110 108 -237 167 -431 201 -87 15 -359 27 -427 19z"/><path d="M11950 1804 c-375 -35 -565 -97 -710 -231 -85 -79 -142 -185 -165 -306 -21 -109 -20 -431 0 -535 51 -256 238 -419 558 -488 195 -42 627 -59 878 -34 460 45 694 179 754 431 8 35 15 85 15 112 l0 47 -210 0 -210 0 0 -30 c0 -50 -36 -108 -88 -141 -118 -75 -306 -103 -642 -96 -260 6 -339 18 -451 69 -115 52 -179 138 -194 261 l-7 57 901 0 901 0 0 143 c0 158 -11 241 -41 322 -92 245 -338 375 -789 415 -105 9 -415 11 -500 4z m505 -329 c169 -26 265 -65 332 -138 42 -45 82 -144 68 -167 -4 -7 -238 -10 -687 -10 l-681 0 7 42 c9 54 52 133 91 165 60 51 183 95 318 112 111 15 444 12 552 -4z"/></g><g transform="translate(964,-44) scale(1.0)"><g transform="translate(-32.3,256.8) scale(0.1,-0.1)"><path d="M1302 2512 c234 -189 328 -392 272 -583 -84 -285 -514 -557 -1158 -733 -149 -41 -140 -43 182 -52 858 -23 1837 165 2225 428 l57 39 -16 32 c-63 120 -386 332 -904 591 -241 120 -618 295 -720 334 -8 3 20 -22 62 -56z"/><path d="M3017 2296 c-208 -75 -272 -329 -124 -493 121 -133 350 -123 458 21 178 236 -59 570 -334 472z"/></g></g></svg>`;

export function renderOfferHtml(offer: OfferDraft, docNumber?: string): string {
  const docNum = docNumber ?? offer.client_name;
  const today = new Date().toLocaleDateString("ka-GE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const hasMonthly =
    typeof offer.monthly_price === "number" && offer.monthly_price > 0;
  const monthlyDisplay = hasMonthly
    ? `${fmt(offer.monthly_price as number)} ₾`
    : offer.monthly_opex
      ? esc(offer.monthly_opex)
      : "";

  // Subscription offer: no one-time implementation fee, value is the recurring
  // monthly. Lead the investment with the monthly amount and mark setup free.
  const isSubscription = (offer.price ?? 0) <= 0 && hasMonthly;

  const addonsBlock =
    offer.addons && offer.addons.length > 0
      ? `
      <section class="sec">
        <div class="sec-head">
          <h2>დამატებები</h2>
          <p class="sec-desc">სურვილისამებრ — არ შედის ძირითად ფასში, შეგიძლიათ მოგვიანებით დაამატოთ.</p>
        </div>
        <div class="rows">${addonRows(offer.addons)}</div>
      </section>`
      : "";

  const monthlyLine = monthlyDisplay
    ? `
      <div class="inv-line">
        <div>
          <div class="inv-k">ყოველთვიური ოპერირება</div>
          <div class="inv-sub">ჰოსტინგი, მხარდაჭერა, ტექნიკური მომსახურება</div>
        </div>
        <div class="inv-m mono">${monthlyDisplay}<span class="per"> /თვე</span></div>
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
    href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&family=Noto+Sans+Georgian:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap"
    rel="stylesheet"
  />
  <style>
    :root {
      --paper:#F1F0EE;          /* creamy site background */
      --ink:#0c1016; --ink-2:#11181C; --steel:#6f6b66;
      --line:#D9D7D1;           /* warm hairline on cream */
      --accent:#2776EA;
      --dark:#0c1016; --on-dark:#F1F0EE; --on-dark-dim:#9a9893;
      /* Noto Sans Georgian in the chain: JetBrains Mono has no Georgian glyphs,
         and the Linux render container has no monospace Georgian fallback →
         Georgian-in-mono renders as tofu without this. Latin/digits stay mono. */
      --mono:'JetBrains Mono','Noto Sans Georgian',ui-monospace,SFMono-Regular,Menlo,monospace;
      --head:'Space Grotesk','Noto Sans Georgian',system-ui,sans-serif;
      --sans:'Geist','Noto Sans Georgian',system-ui,sans-serif;
    }
    * { margin:0; padding:0; box-sizing:border-box; }
    @page { size:A4; margin:0; }
    html { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    body {
      font-family:var(--sans); color:var(--ink-2); background:var(--paper);
      font-size:11.5px; line-height:1.6; -webkit-font-smoothing:antialiased;
    }
    .mono { font-family:var(--mono); font-variant-numeric:tabular-nums; }
    .accent { color:var(--accent); }
    .muted { color:var(--steel); }
    .pad { padding:0 20mm; }

    /* top bar */
    .topbar {
      display:flex; align-items:flex-start; justify-content:space-between;
      padding:18mm 20mm 0;
    }
    .brand { color:var(--ink); }
    .brand .logo { height:64px; width:auto; display:block; }
    .doc-meta { text-align:right; font-family:var(--mono); font-size:9.5px;
      color:var(--steel); line-height:1.8; letter-spacing:.04em; }
    .doc-meta b { color:var(--ink); font-weight:600; }

    /* hero — open, big, no card (like the site hero) */
    .hero { padding:30mm 20mm 24mm; }
    .eyebrow { font-family:var(--mono); font-size:10px; letter-spacing:.24em;
      text-transform:uppercase; color:var(--accent); font-weight:600; }
    .hero h1 {
      font-family:var(--head); font-weight:700; color:var(--ink);
      font-size:56px; line-height:1.0; letter-spacing:-.03em;
      margin:18px 0 22px; max-width:16ch;
    }
    .hero h1 .accent { color:var(--accent); }
    .lead { font-size:14px; color:var(--steel); line-height:1.7; max-width:62ch; }
    .lead + .lead { margin-top:9px; }

    /* sections */
    .sec { padding:0 20mm; margin-top:26px; break-inside:avoid; }
    .sec-head { margin-bottom:14px; }
    .sec-head h2 { font-family:var(--head); font-weight:700; color:var(--ink);
      font-size:26px; letter-spacing:-.02em; }
    .sec-desc { color:var(--steel); font-size:11.5px; margin-top:6px; max-width:62ch; }

    /* open hairline rows (the Services-list pattern) */
    .rows { border-top:1px solid var(--line); }
    .row { display:flex; align-items:baseline; justify-content:space-between;
      gap:24px; padding:15px 0; border-bottom:1px solid var(--line); break-inside:avoid; }
    .row-main { flex:1; }
    .row-title { font-family:var(--head); font-weight:600; font-size:15px;
      color:var(--ink); letter-spacing:-.01em; }
    .row-title .step { color:var(--accent); font-size:11px; margin-right:6px; }
    .row-desc { color:var(--steel); font-size:11.5px; margin-top:3px; }
    .row-price { font-family:var(--head); font-weight:600; font-size:16px;
      color:var(--ink); white-space:nowrap; }
    .row-price.muted { color:var(--steel); font-weight:500; }
    .row-price .cur { font-size:12px; color:var(--steel); }

    /* investment — big type, hairlines, no box */
    .inv { border-top:2px solid var(--ink); margin-top:2px; }
    .inv-line { display:flex; align-items:flex-end; justify-content:space-between;
      gap:24px; padding:18px 0; border-bottom:1px solid var(--line); }
    .inv-k { font-family:var(--head); font-weight:600; font-size:14px; color:var(--ink); }
    .inv-sub { color:var(--steel); font-size:11px; margin-top:3px; }
    .inv-total .inv-amt { font-family:var(--head); font-weight:700;
      font-size:44px; line-height:1; letter-spacing:-.03em; color:var(--accent); }
    .inv-m { font-family:var(--head); font-weight:700; font-size:22px; color:var(--ink); }
    .inv-amt .cur, .inv-m .per { font-size:14px; color:var(--steel); font-weight:600; }

    /* terms */
    .pills { display:flex; gap:40px; margin:4px 0 16px; }
    .pill .pl { font-family:var(--mono); font-size:9px; font-weight:600;
      text-transform:uppercase; letter-spacing:.12em; color:var(--steel); margin-bottom:5px; }
    .pill .pv { font-family:var(--head); font-size:18px; font-weight:700; color:var(--ink); }
    .terms { list-style:none; border-top:1px solid var(--line); }
    .terms li { position:relative; padding:11px 0 11px 22px; font-size:12px;
      color:var(--ink-2); border-bottom:1px solid var(--line); }
    .terms li::before { content:"→"; position:absolute; left:0; color:var(--accent); font-weight:700; }

    /* footer — full-bleed dark CLOSING PAGE; content anchored to the bottom so
       it never orphans at the top of a page with blank space below. */
    .footer { background:var(--dark); color:var(--on-dark);
      min-height:100vh; display:flex; flex-direction:column; justify-content:flex-end;
      padding:24mm 20mm 18mm; break-before:page; break-inside:avoid; }
    .footer-cta { font-family:var(--head); font-weight:700; font-size:30px;
      letter-spacing:-.02em; max-width:18ch; }
    .footer-cta .accent { color:var(--accent); }
    .footer-grid { display:flex; justify-content:space-between; align-items:flex-end;
      gap:24px; margin-top:26px; }
    .footer-contact { font-family:var(--mono); font-size:10px; color:var(--on-dark-dim);
      line-height:1.9; letter-spacing:.03em; }
    .footer-contact b { color:#fff; font-weight:600; }
    .wordmark { color:#fff; border-top:1px solid #23262b;
      margin-top:26px; padding-top:24px; }
    .wordmark .logo { height:58px; width:auto; display:block; }
    .footer-foot { display:flex; justify-content:space-between; margin-top:18px;
      font-family:var(--mono); font-size:8.5px; color:var(--on-dark-dim); letter-spacing:.04em; }
  </style>
</head>
<body>

  <div class="topbar">
    <div class="brand">${LOGO}</div>
    <div class="doc-meta">
      <div><b>დოკ. №</b> ${esc(docNum)}</div>
      <div><b>თარიღი</b> ${today}</div>
      <div><b>ვალუტა</b> ${esc(offer.currency)}</div>
    </div>
  </div>

  <!-- HERO -->
  <div class="hero">
    <div class="eyebrow">კომერციული შეთავაზება</div>
    <h1>${esc(offer.client_name)} <span class="accent">${esc(offer.headline || "ციფრული გარდაქმნა")}</span></h1>
    ${summaryParas(offer.summary)}
  </div>

  <!-- SCOPE -->
  <section class="sec">
    <div class="sec-head"><h2>სამუშაოს მოცულობა</h2></div>
    <div class="rows">${scopeRows(offer.scope_lines)}</div>
  </section>

  <!-- INVESTMENT -->
  <section class="sec">
    <div class="sec-head"><h2>ინვესტიცია</h2></div>
    <div class="inv">
      ${
        isSubscription
          ? `<div class="inv-line inv-total">
        <div>
          <div class="inv-k">ყოველთვიური ღირებულება</div>
          <div class="inv-sub">სრული მომსახურება — ყველა ზემოთ ჩამოთვლილი ერთ პაკეტში</div>
        </div>
        <div class="inv-amt mono">${monthlyDisplay}<span class="cur"> /თვე</span></div>
      </div>
      <div class="inv-line">
        <div>
          <div class="inv-k">ერთჯერადი დანერგვა</div>
          <div class="inv-sub">პლატფორმის გაშვება, კონფიგურაცია და ინტეგრაცია</div>
        </div>
        <div class="inv-m mono">უფასო</div>
      </div>`
          : `<div class="inv-line inv-total">
        <div>
          <div class="inv-k">სრული ღირებულება — ერთჯერადი</div>
          <div class="inv-sub">ყველა ზემოთ ჩამოთვლილი სამუშაო, შეთანხმებულ მოცულობაში</div>
        </div>
        <div class="inv-amt mono">${fmt(offer.price)} <span class="cur">₾</span></div>
      </div>
      ${monthlyLine}`
      }
    </div>
  </section>

  ${addonsBlock}

  <!-- SCHEDULE -->
  <section class="sec">
    <div class="sec-head"><h2>გადახდის გრაფიკი</h2></div>
    <div class="rows">${scheduleRows(offer.schedule)}</div>
  </section>

  <!-- TERMS -->
  <section class="sec">
    <div class="sec-head"><h2>ვადა და პირობები</h2></div>
    <div class="pills">
      <div class="pill"><div class="pl">${isSubscription ? "თანამშრომლობა" : "პროექტის ვადა"}</div><div class="pv">${esc(offer.timeline)}</div></div>
      ${monthlyDisplay ? `<div class="pill"><div class="pl">ყოველთვიური</div><div class="pv">${monthlyDisplay}</div></div>` : ""}
    </div>
    <ul class="terms">
      <li>ფასი ფიქსირებულია შეთანხმებულ მოცულობაზე — დამატებითი ანგარიშსწორება მხოლოდ მოცულობის ცვლილებისას.</li>
      <li>კომუნიკაცია და მიწოდება ეტაპობრივად, გამჭვირვალე გრაფიკით.</li>
      <li>შეთავაზება ძალაშია გაცემიდან 14 დღე.</li>
    </ul>
  </section>

  <!-- WHY -->
  <section class="sec">
    <div class="sec-head"><h2>რატომ Allone</h2></div>
    <div class="rows">${whyRows()}</div>
  </section>

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-cta">მოდი, <span class="accent">დავიწყოთ</span>.</div>
    <div class="footer-grid">
      <div class="footer-contact">
        <div><b>შპს „ოლუან"</b></div>
        <div>ს/კ 405826361</div>
        <div>luka.adamia@allonelabs.com</div>
        <div>allonelabs.com</div>
      </div>
    </div>
    <div class="wordmark">${LOGO}</div>
    <div class="footer-foot">
      <span>კომერციული შეთავაზება · დოკ. № ${esc(docNum)}</span>
      <span>კონფიდენციალური</span>
    </div>
  </div>

</body>
</html>`;
}
