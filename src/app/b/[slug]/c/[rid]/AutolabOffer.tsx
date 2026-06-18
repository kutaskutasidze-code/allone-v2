"use client";

// In-chat commercial offer, styled after the "autolab" editorial offer
// (paper/ink palette, Noto Serif Georgian headline, JetBrains Mono labels,
// dark hero, priced module cards). Renders from the proposal's OfferDraft so
// the client sees a rich offer inside the chat — not a PDF link.

interface ScopeLine {
  label: string;
  description?: string;
  price: number;
}
interface Stage {
  label: string;
  amount: number;
  when?: string;
}
export interface OfferData {
  client_name: string;
  summary: string;
  scope_lines: ScopeLine[];
  price: number;
  currency?: string;
  schedule?: Stage[];
  monthly_opex?: string;
  timeline?: string;
  addons?: ScopeLine[];
}

const fmt = (n: number) => n.toLocaleString("en-US");

export function AutolabOffer({
  offer,
  docNumber,
  dateLabel,
}: {
  offer: OfferData;
  docNumber: string;
  dateLabel: string;
}) {
  const cur = "₾";
  return (
    <div className="alo-wrap">
      <div className="alo-topbar">
        <span className="alo-brand">
          All<span className="alo-brand-o">O</span>ne
        </span>
        <div className="alo-meta">
          <div>
            შეთავაზება <b>№ {docNumber}</b>
          </div>
          <div>თარიღი {dateLabel}</div>
        </div>
      </div>

      <div className="alo-hero">
        <div className="alo-eyebrow">
          კომერციული შეთავაზება · {offer.client_name}
        </div>
        <h1>
          თქვენი იდეა <span className="alo-accent">→</span> მზა პროდუქტი.
        </h1>
        <p className="alo-lead">{offer.summary}</p>
        <div className="alo-codebox">
          <span className="alo-tag">სულ</span>
          <span className="alo-code">
            {cur}
            {fmt(offer.price)}
          </span>
          <span className="alo-result">
            <span className="alo-dot" /> {offer.timeline || "—"}
          </span>
        </div>
      </div>

      <div className="alo-section">
        <div className="alo-sec-head">
          <span className="alo-idx">01</span>
          <h2>მოდულები</h2>
        </div>
        {offer.scope_lines.map((m, i) => (
          <div className="alo-module" key={i}>
            <div className="alo-mod-top">
              <div>
                <span className="alo-mod-id">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="alo-mod-title">{m.label}</div>
                {m.description && (
                  <div className="alo-mod-sub">{m.description}</div>
                )}
              </div>
              <div className="alo-price">
                <div className="alo-num">
                  <span className="alo-curS">{cur}</span>
                  {fmt(m.price)}
                </div>
                <div className="alo-term">ერთჯერადი</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {offer.schedule && offer.schedule.length > 0 && (
        <div className="alo-section">
          <div className="alo-sec-head">
            <span className="alo-idx">02</span>
            <h2>გადახდის გრაფიკი</h2>
          </div>
          <table className="alo-sched">
            <tbody>
              {offer.schedule.map((s, i) => (
                <tr key={i}>
                  <td className="alo-sched-label">{s.label}</td>
                  <td className="alo-sched-when">{s.when}</td>
                  <td className="alo-sched-amt">
                    {cur}
                    {fmt(s.amount)}
                  </td>
                </tr>
              ))}
              <tr className="alo-sched-total">
                <td>სულ ჯამი</td>
                <td />
                <td className="alo-sched-amt">
                  {cur}
                  {fmt(offer.price)}
                </td>
              </tr>
            </tbody>
          </table>
          {offer.monthly_opex && (
            <p className="alo-opex">
              ყოველთვიური მხარდაჭერა · {offer.monthly_opex}
            </p>
          )}
        </div>
      )}

      {offer.addons && offer.addons.length > 0 && (
        <div className="alo-section alo-addons">
          <div className="alo-sec-head">
            <span className="alo-idx">+</span>
            <h2>დამატებითი ოფციები</h2>
          </div>
          <ul className="alo-feat">
            {offer.addons.map((a, i) => (
              <li key={i}>
                {a.label} —{" "}
                <b>
                  {cur}
                  {fmt(a.price)}
                </b>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="alo-foot">მომზადდა AllOne-ის მიერ · {dateLabel}</div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+Georgian:wght@600;700;800&family=Noto+Sans+Georgian:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        .alo-wrap{
          --paper:#F4F3EE;--paper2:#FBFAF7;--ink:#121110;--ink2:#39362F;--steel:#6E6A60;
          --line:#D9D6CC;--line2:#C7C3B7;--accent:#CE2417;--dark:#121110;--ondark:#EDEAE2;
          --mono:'JetBrains Mono',ui-monospace,monospace;--serif:'Noto Serif Georgian',Georgia,serif;
          --sans:'Noto Sans Georgian',system-ui,sans-serif;
          font-family:var(--sans);background:var(--paper);color:var(--ink);
          border:1px solid var(--line2);border-radius:10px;overflow:hidden;line-height:1.55;
        }
        .alo-topbar{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 22px;border-bottom:1px solid var(--line);flex-wrap:wrap}
        .alo-brand{font-weight:800;font-size:18px;letter-spacing:-.02em;color:var(--ink)}
        .alo-brand-o{color:var(--accent)}
        .alo-meta{text-align:right;font-family:var(--mono);font-size:10.5px;color:var(--steel);line-height:1.7;letter-spacing:.04em}
        .alo-meta b{color:var(--ink);font-weight:600}
        .alo-hero{background:var(--dark);color:var(--ondark);padding:30px 24px 28px}
        .alo-eyebrow{font-family:var(--mono);font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:#A8A398;font-weight:600}
        .alo-hero h1{font-family:var(--serif);font-weight:800;font-size:clamp(26px,4.5vw,38px);line-height:1.06;letter-spacing:-.01em;margin:14px 0 12px;max-width:18ch}
        .alo-accent{color:#FF5640}
        .alo-lead{font-size:15px;color:#C9C5BB;max-width:60ch;line-height:1.6}
        .alo-codebox{margin-top:22px;border:1px solid #34312B;border-radius:5px;background:#1A1814;padding:14px 16px;display:flex;align-items:center;gap:14px;flex-wrap:wrap}
        .alo-tag{font-family:var(--mono);font-size:9.5px;letter-spacing:.2em;color:#7E796E;text-transform:uppercase;border:1px solid #34312B;border-radius:3px;padding:4px 8px}
        .alo-code{font-family:var(--mono);font-weight:700;font-size:clamp(18px,3vw,24px);letter-spacing:.04em;color:#F4F3EE}
        .alo-result{font-family:var(--mono);font-size:11.5px;color:#9AE6A0;display:flex;align-items:center;gap:8px;margin-left:auto}
        .alo-dot{width:7px;height:7px;border-radius:50%;background:#3FB950;box-shadow:0 0 0 3px rgba(63,185,80,.18)}
        .alo-section{padding:26px 24px;border-bottom:1px solid var(--line)}
        .alo-sec-head{display:flex;align-items:baseline;gap:12px;margin-bottom:18px}
        .alo-idx{font-family:var(--mono);font-size:12px;color:var(--accent);font-weight:600}
        .alo-sec-head h2{font-family:var(--serif);font-weight:700;font-size:clamp(19px,2.6vw,24px);letter-spacing:-.01em}
        .alo-module{border:1px solid var(--line2);border-radius:6px;background:var(--paper2);padding:20px 22px;margin-bottom:14px}
        .alo-mod-top{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;flex-wrap:wrap}
        .alo-mod-id{font-family:var(--mono);font-size:10.5px;font-weight:600;letter-spacing:.12em;color:#fff;background:var(--ink);padding:4px 8px;border-radius:3px;display:inline-block}
        .alo-mod-title{font-family:var(--serif);font-weight:700;font-size:18px;margin:12px 0 4px;letter-spacing:-.005em}
        .alo-mod-sub{font-size:13.5px;color:var(--steel)}
        .alo-price{text-align:right;flex-shrink:0}
        .alo-num{font-family:var(--mono);font-weight:700;font-size:26px;color:var(--ink);letter-spacing:-.01em;line-height:1}
        .alo-curS{font-family:var(--mono);font-size:15px;color:var(--accent);font-weight:600}
        .alo-term{font-family:var(--mono);font-size:10px;color:var(--steel);letter-spacing:.08em;margin-top:6px;text-transform:uppercase}
        .alo-sched{width:100%;border-collapse:collapse;font-size:14px}
        .alo-sched td{padding:9px 0;border-bottom:1px solid var(--line);color:var(--ink2);vertical-align:top}
        .alo-sched-label{font-weight:600;color:var(--ink)}
        .alo-sched-when{color:var(--steel);font-size:12.5px;padding-left:12px}
        .alo-sched-amt{text-align:right;font-family:var(--mono);font-weight:600;color:var(--ink);white-space:nowrap}
        .alo-sched-total td{border-bottom:none;font-weight:700;color:var(--ink);padding-top:12px}
        .alo-opex{margin-top:12px;font-family:var(--mono);font-size:11.5px;color:var(--steel);letter-spacing:.04em}
        .alo-feat{list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:9px 24px;padding:0;margin:0}
        .alo-feat li{position:relative;padding-left:18px;font-size:14px;color:var(--ink2)}
        .alo-feat li::before{content:"";position:absolute;left:0;top:7px;width:8px;height:8px;border:1.5px solid var(--accent);border-radius:1px}
        .alo-feat b{font-family:var(--mono);color:var(--ink)}
        .alo-foot{padding:16px 24px;font-family:var(--mono);font-size:10.5px;color:var(--steel);letter-spacing:.04em;text-align:center}
        @media(max-width:560px){.alo-feat{grid-template-columns:1fr}}
      `}</style>
    </div>
  );
}
