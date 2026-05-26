import { describe, it, expect } from "vitest";
import { injectTracking } from "./index.js";

const BASE = "https://allonelabs.com";
const JOB = "a1b2c3";

describe("injectTracking", () => {
  it("wraps http(s) hrefs through the click tracker", () => {
    const html = '<a href="https://acme.com/foo">link</a>';
    const out = injectTracking(html, BASE, JOB);
    expect(out).toContain(`${BASE}/api/track/demo/${JOB}/click?to=`);
    expect(out).toContain(encodeURIComponent("https://acme.com/foo"));
  });

  it("appends an open-beacon img before </body>", () => {
    const html = "<html><body><p>hi</p></body></html>";
    const out = injectTracking(html, BASE, JOB);
    expect(out).toContain(`${BASE}/api/track/demo/${JOB}/open.gif`);
    expect(out.indexOf("<img")).toBeLessThan(out.indexOf("</body>"));
  });

  it("appends the beacon at the end when no </body> exists", () => {
    const html = "<p>just text</p>";
    const out = injectTracking(html, BASE, JOB);
    expect(out.endsWith('display:none;border:0;" />')).toBe(true);
  });

  it("does NOT double-wrap an already-wrapped click URL", () => {
    const html = `<a href="${BASE}/api/track/demo/${JOB}/click?to=x">link</a>`;
    const out = injectTracking(html, BASE, JOB);
    // The href value should still contain exactly one "/click?to=".
    const matches = out.match(/\/click\?to=/g) ?? [];
    expect(matches.length).toBe(1);
  });

  it("returns input unchanged when jobId is empty", () => {
    const html = '<a href="https://x.com">y</a>';
    expect(injectTracking(html, BASE, "")).toBe(html);
  });

  it("preserves the original href value inside the to= param", () => {
    const url = "https://example.com/path?q=1&b=2";
    const out = injectTracking(`<a href="${url}">x</a>`, BASE, JOB);
    expect(out).toContain(encodeURIComponent(url));
  });
});
