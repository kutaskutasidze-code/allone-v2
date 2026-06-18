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
          თქვენი იდეა <span className="alo-accent">→</span> მზა პროდუქტი.
        </h1>
        <p className="alo-lead">{offer.summary}</p>
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
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+Georgian:wght@600;700;800&family=Noto+Sans+Georgian:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        .alo-wrap{--paper:#F4F3EE;--paper2:#FBFAF7;--ink:#121110;--ink2:#39362F;--steel:#6E6A60;--line:#D9D6CC;--line2:#C7C3B7;--accent:#CE2417;--dark:#121110;--ondark:#EDEAE2;--mono:'JetBrains Mono',ui-monospace,monospace;--serif:'Noto Serif Georgian',Georgia,serif;--sans:'Noto Sans Georgian',system-ui,sans-serif;font-family:var(--sans);background:var(--paper);color:var(--ink);border:1px solid var(--line2);border-radius:12px;overflow:hidden;line-height:1.55}
        .alo-topbar{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 22px;border-bottom:1px solid var(--line);flex-wrap:wrap}
        .alo-brand{font-weight:800;font-size:18px;letter-spacing:-.02em;color:var(--ink)}
        .alo-brand-o{color:var(--accent)}
        .alo-meta{text-align:right;font-family:var(--mono);font-size:10.5px;color:var(--steel);line-height:1.7;letter-spacing:.04em}
        .alo-meta b{color:var(--ink);font-weight:600}
        .alo-hero{background:var(--dark);color:var(--ondark);padding:30px 24px 26px}
        .alo-eyebrow{font-family:var(--mono);font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:#A8A398;font-weight:600}
        .alo-hero h1{font-family:var(--serif);font-weight:800;font-size:clamp(26px,4.5vw,38px);line-height:1.06;letter-spacing:-.01em;margin:14px 0 12px;max-width:18ch}
        .alo-accent{color:#FF5640}
        .alo-lead{font-size:15px;color:#C9C5BB;max-width:60ch;line-height:1.6}
        .alo-codebox{margin-top:20px;border:1px solid #34312B;border-radius:5px;background:#1A1814;padding:14px 16px;display:flex;align-items:center;gap:14px;flex-wrap:wrap}
        .alo-tag{font-family:var(--mono);font-size:9.5px;letter-spacing:.2em;color:#7E796E;text-transform:uppercase;border:1px solid #34312B;border-radius:3px;padding:4px 8px}
        .alo-code{font-family:var(--mono);font-weight:700;font-size:clamp(18px,3vw,24px);letter-spacing:.04em;color:#F4F3EE}
        .alo-result{font-family:var(--mono);font-size:11.5px;color:#9AE6A0;display:flex;align-items:center;gap:8px;margin-left:auto}
        .alo-dot{width:7px;height:7px;border-radius:50%;background:#3FB950;box-shadow:0 0 0 3px rgba(63,185,80,.18)}
        .alo-section{padding:24px}
        .alo-sec-head{display:flex;align-items:baseline;gap:12px;margin-bottom:16px}
        .alo-idx{font-family:var(--mono);font-size:12px;color:var(--accent);font-weight:600}
        .alo-sec-head h2{font-family:var(--serif);font-weight:700;font-size:clamp(19px,2.6vw,24px);letter-spacing:-.01em}
        .alo-hint{font-family:var(--mono);font-size:10px;color:var(--steel);letter-spacing:.06em;margin-left:auto;text-transform:uppercase}
        .alo-module{display:flex;gap:14px;width:100%;text-align:left;border:1px solid var(--line2);border-radius:6px;background:var(--paper2);padding:18px 20px;margin-bottom:12px;cursor:pointer;transition:border-color .15s,box-shadow .15s,opacity .15s;font-family:inherit}
        .alo-module.on{border-color:var(--ink);box-shadow:0 0 0 1px var(--ink)}
        .alo-module.off{opacity:.55}
        .alo-module:disabled{cursor:default}
        .alo-check{flex-shrink:0;width:22px;height:22px;border-radius:5px;border:1.5px solid var(--line2);display:flex;align-items:center;justify-content:center;font-size:13px;color:#fff;margin-top:2px;transition:all .15s}
        .alo-check.on{background:var(--accent);border-color:var(--accent)}
        .alo-mod-body{flex:1;min-width:0}
        .alo-mod-top{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap}
        .alo-mod-id{font-family:var(--mono);font-size:10.5px;font-weight:600;letter-spacing:.12em;color:#fff;background:var(--ink);padding:4px 8px;border-radius:3px;display:inline-block}
        .alo-mod-title{font-family:var(--serif);font-weight:700;font-size:18px;margin:10px 0 4px;letter-spacing:-.005em;color:var(--ink)}
        .alo-mod-sub{font-size:13.5px;color:var(--steel)}
        .alo-price{text-align:right;flex-shrink:0}
        .alo-num{font-family:var(--mono);font-weight:700;font-size:24px;color:var(--ink);letter-spacing:-.01em;line-height:1}
        .alo-curS{font-family:var(--mono);font-size:14px;color:var(--accent);font-weight:600}
        .alo-term{font-family:var(--mono);font-size:10px;color:var(--steel);letter-spacing:.08em;margin-top:5px;text-transform:uppercase}
        .alo-cta{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:20px 24px;border-top:1px solid var(--line);background:var(--paper2);flex-wrap:wrap}
        .alo-cta-total{font-family:var(--mono);display:flex;align-items:baseline;gap:10px}
        .alo-cta-total span{font-size:11px;color:var(--steel);text-transform:uppercase;letter-spacing:.1em}
        .alo-cta-total b{font-size:26px;color:var(--ink);font-weight:700}
        .alo-confirm{font-family:var(--sans);font-weight:600;font-size:14.5px;color:#fff;background:var(--ink);border:none;border-radius:8px;padding:12px 22px;cursor:pointer;transition:opacity .15s}
        .alo-confirm:hover{opacity:.9}
        .alo-confirm:disabled{opacity:.45;cursor:default}
        .alo-foot{padding:14px 24px;font-family:var(--mono);font-size:10.5px;color:var(--steel);letter-spacing:.04em;text-align:center;border-top:1px solid var(--line)}
      `}</style>
    </div>
  );
}
