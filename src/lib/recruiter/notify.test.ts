import { describe, it, expect } from "vitest";
import { wrapPlainText } from "./notify";

describe("wrapPlainText", () => {
  it("splits blank-line-separated paragraphs into <p> blocks", () => {
    const html = wrapPlainText("Hello there\n\nSecond para");
    expect((html.match(/<p /g) ?? []).length).toBeGreaterThanOrEqual(2);
    expect(html).toContain("Hello there");
    expect(html).toContain("Second para");
  });

  it("escapes HTML in the body", () => {
    const html = wrapPlainText("<script>alert(1)</script>");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("turns single newlines into <br/>", () => {
    const html = wrapPlainText("line one\nline two");
    expect(html).toContain("line one<br/>line two");
  });
});
