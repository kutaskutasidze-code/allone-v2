"use client";

import { useMemo, useState } from "react";

// Interactive in-chat commercial offer, styled after the "autolab" editorial
// offer (paper/ink palette, Noto Serif Georgian headline, JetBrains Mono
// labels, dark hero, priced module cards). The client toggles which modules /
// add-ons they want — the total updates live — then confirms their selection,
// which is posted back into the chat.

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
const CUR = "₾";

export function AutolabOffer({
  offer,
  docNumber,
  dateLabel,
  onConfirm,
}: {
  offer: OfferData;
  docNumber: string;
  dateLabel: string;
  onConfirm?: (sel: { items: string[]; total: number }) => void;
}) {
  // core modules selected by default; add-ons optional/off by default
  const [mods, setMods] = useState<boolean[]>(() =>
    offer.scope_lines.map(() => true),
  );
  const [adds, setAdds] = useState<boolean[]>(() =>
    (offer.addons ?? []).map(() => false),
  );
  const [confirmed, setConfirmed] = useState(false);

  const total = useMemo(() => {
    let t = 0;
    offer.scope_lines.forEach((m, i) => {
      if (mods[i]) t += m.price;
    });
    (offer.addons ?? []).forEach((a, i) => {
      if (adds[i]) t += a.price;
    });
    return t;
  }, [mods, adds, offer]);

  const toggleMod = (i: number) =>
    setMods((p) => p.map((v, j) => (j === i ? !v : v)));
  const toggleAdd = (i: number) =>
    setAdds((p) => p.map((v, j) => (j === i ? !v : v)));

  function confirm() {
    const items = [
      ...offer.scope_lines.filter((_, i) => mods[i]).map((m) => m.label),
      ...(offer.addons ?? []).filter((_, i) => adds[i]).map((a) => a.label),
    ];
    setConfirmed(true);
    onConfirm?.({ items, total });
  }

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
          <div>{dateLabel}</div>
        </div>
      </div>

      <div className="alo-hero">
        <div className="alo-eyebrow">
          კომერციული შეთავაზება · {offer.client_name}
        </div>
        <h1>
          {offer.client_name}{" "}
          <span className="alo-accent">ციფრული გარდაქმნა</span>
        </h1>
        {offer.summary
          .split(/\n\s*\n|\n/)
          .map((s) => s.trim())
          .filter(Boolean)
          .map((para, i) => (
            <p className="alo-lead" key={i}>
              {para}
            </p>
          ))}
        <div className="alo-codebox">
          <span className="alo-tag">თქვენი არჩევანი</span>
          <span className="alo-code">
            {CUR}
            {fmt(total)}
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
          <span className="alo-hint">აირჩიეთ რაც გჭირდებათ</span>
        </div>
        {offer.scope_lines.map((m, i) => (
          <button
            type="button"
            disabled={confirmed}
            onClick={() => toggleMod(i)}
            className={`alo-module ${mods[i] ? "on" : "off"}`}
            key={i}
          >
            <span className={`alo-check ${mods[i] ? "on" : ""}`} aria-hidden>
              {mods[i] ? "✓" : ""}
            </span>
            <div className="alo-mod-body">
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
                    <span className="alo-curS">{CUR}</span>
                    {fmt(m.price)}
                  </div>
                  <div className="alo-term">ერთჯერადი</div>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {offer.addons && offer.addons.length > 0 && (
        <div className="alo-section">
          <div className="alo-sec-head">
            <span className="alo-idx">+</span>
            <h2>დამატებითი ოფციები</h2>
          </div>
          {offer.addons.map((a, i) => (
            <button
              type="button"
              disabled={confirmed}
              onClick={() => toggleAdd(i)}
              className={`alo-module ${adds[i] ? "on" : "off"}`}
              key={i}
            >
              <span className={`alo-check ${adds[i] ? "on" : ""}`} aria-hidden>
                {adds[i] ? "✓" : ""}
              </span>
              <div className="alo-mod-body">
                <div className="alo-mod-top">
                  <div>
                    <div className="alo-mod-title">{a.label}</div>
                    {a.description && (
                      <div className="alo-mod-sub">{a.description}</div>
                    )}
                  </div>
                  <div className="alo-price">
                    <div className="alo-num">
                      <span className="alo-curS">{CUR}</span>
                      {fmt(a.price)}
                    </div>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="alo-cta">
        <div className="alo-cta-total">
          <span>სულ</span>
          <b>
            {CUR}
            {fmt(total)}
          </b>
        </div>
        <button
          type="button"
          className="alo-confirm"
          disabled={confirmed || total === 0}
          onClick={confirm}
        >
          {confirmed ? "✓ არჩევანი დაფიქსირდა" : "ეს ვარიანტი მინდა →"}
        </button>
      </div>

      <div className="alo-foot">მომზადდა AllOne-ის მიერ · {dateLabel}</div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&family=Noto+Sans+Georgian:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
        .alo-wrap{--paper:#F1F0EE;--paper2:#ffffff;--ink:#0c1016;--ink2:#11181C;--steel:#6b7480;--line:#D9D7D1;--line2:#cfcdc6;--accent:#2776EA;--accent-soft:#eef4fe;--mono:'JetBrains Mono','Noto Sans Georgian',ui-monospace,monospace;--head:'Space Grotesk','Noto Sans Georgian',system-ui,sans-serif;--sans:'Geist','Noto Sans Georgian',system-ui,sans-serif;font-family:var(--sans);background:var(--paper);color:var(--ink2);border:1px solid var(--line2);overflow:hidden;line-height:1.55}
        .alo-topbar{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 22px;border-bottom:1px solid var(--line);flex-wrap:wrap}
        .alo-brand{font-family:var(--head);font-weight:700;font-size:18px;letter-spacing:-.02em;color:var(--ink)}
        .alo-brand-o{color:var(--ink)}
        .alo-meta{text-align:right;font-family:var(--mono);font-size:10.5px;color:var(--steel);line-height:1.7;letter-spacing:.04em}
        .alo-meta b{color:var(--ink);font-weight:600}
        .alo-hero{background:var(--paper);color:var(--ink);padding:34px 24px 28px;border-bottom:1px solid var(--line)}
        .alo-eyebrow{font-family:var(--mono);font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:var(--accent);font-weight:600}
        .alo-hero h1{font-family:var(--head);font-weight:700;font-size:clamp(28px,4.6vw,40px);line-height:1.04;letter-spacing:-.025em;margin:14px 0 14px;max-width:18ch;color:var(--ink)}
        .alo-accent{color:var(--accent)}
        .alo-lead{font-size:14px;color:var(--steel);max-width:62ch;line-height:1.7}
        .alo-lead + .alo-lead{margin-top:8px}
        .alo-codebox{margin-top:22px;border:1px solid var(--line);border-left:3px solid var(--accent);background:var(--accent-soft);padding:14px 18px;display:flex;align-items:center;gap:14px;flex-wrap:wrap}
        .alo-tag{font-family:var(--mono);font-size:9px;letter-spacing:.18em;color:var(--steel);text-transform:uppercase;font-weight:600}
        .alo-code{font-family:var(--head);font-weight:700;font-size:clamp(20px,3vw,26px);letter-spacing:-.01em;color:var(--accent)}
        .alo-result{font-family:var(--mono);font-size:11px;color:var(--steel);display:flex;align-items:center;gap:8px;margin-left:auto}
        .alo-dot{width:7px;height:7px;border-radius:50%;background:var(--accent)}
        .alo-section{padding:24px}
        .alo-sec-head{display:flex;align-items:baseline;gap:12px;margin-bottom:16px}
        .alo-idx{font-family:var(--mono);font-size:12px;color:var(--accent);font-weight:600}
        .alo-sec-head h2{font-family:var(--head);font-weight:700;font-size:clamp(20px,2.6vw,26px);letter-spacing:-.02em;color:var(--ink)}
        .alo-hint{font-family:var(--mono);font-size:10px;color:var(--steel);letter-spacing:.06em;margin-left:auto;text-transform:uppercase}
        .alo-module{display:flex;gap:14px;width:100%;text-align:left;border:1px solid var(--line2);background:var(--paper2);padding:18px 20px;margin-bottom:12px;cursor:pointer;transition:border-color .15s,box-shadow .15s,opacity .15s;font-family:inherit}
        .alo-module.on{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent)}
        .alo-module.off{opacity:.55}
        .alo-module:disabled{cursor:default}
        .alo-check{flex-shrink:0;width:22px;height:22px;border:1.5px solid var(--line2);display:flex;align-items:center;justify-content:center;font-size:13px;color:#fff;margin-top:2px;transition:all .15s}
        .alo-check.on{background:var(--accent);border-color:var(--accent)}
        .alo-mod-body{flex:1;min-width:0}
        .alo-mod-top{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap}
        .alo-mod-id{font-family:var(--mono);font-size:10.5px;font-weight:600;letter-spacing:.12em;color:#fff;background:var(--ink);padding:4px 8px;display:inline-block}
        .alo-mod-title{font-family:var(--head);font-weight:700;font-size:17px;margin:10px 0 4px;letter-spacing:-.01em;color:var(--ink)}
        .alo-mod-sub{font-size:13px;color:var(--steel)}
        .alo-price{text-align:right;flex-shrink:0}
        .alo-num{font-family:var(--head);font-weight:700;font-size:22px;color:var(--ink);letter-spacing:-.01em;line-height:1}
        .alo-curS{font-family:var(--head);font-size:14px;color:var(--steel);font-weight:600}
        .alo-term{font-family:var(--mono);font-size:10px;color:var(--steel);letter-spacing:.08em;margin-top:5px;text-transform:uppercase}
        .alo-cta{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:20px 24px;border-top:1px solid var(--line);background:var(--paper2);flex-wrap:wrap}
        .alo-cta-total{font-family:var(--mono);display:flex;align-items:baseline;gap:10px}
        .alo-cta-total span{font-size:11px;color:var(--steel);text-transform:uppercase;letter-spacing:.1em}
        .alo-cta-total b{font-family:var(--head);font-size:26px;color:var(--ink);font-weight:700}
        .alo-confirm{font-family:var(--sans);font-weight:600;font-size:14.5px;color:#fff;background:var(--ink);border:none;padding:12px 22px;cursor:pointer;transition:opacity .15s}
        .alo-confirm:hover{opacity:.9}
        .alo-confirm:disabled{opacity:.45;cursor:default}
        .alo-foot{padding:14px 24px;font-family:var(--mono);font-size:10.5px;color:var(--steel);letter-spacing:.04em;text-align:center;border-top:1px solid var(--line)}
      `}</style>
    </div>
  );
}
