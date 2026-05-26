import { describe, it, expect } from "vitest";
import { substitute, htmlToPlain } from "./index.js";

describe("substitute", () => {
  it("replaces a known {{var}}", () => {
    expect(substitute("hi {{lead.name}}", { "lead.name": "Nino" })).toBe(
      "hi Nino",
    );
  });

  it("replaces multiple occurrences", () => {
    const out = substitute("{{x}} and {{x}}", { x: "A" });
    expect(out).toBe("A and A");
  });

  it("handles spaces inside braces", () => {
    expect(
      substitute("{{  lead.first_name  }}", { "lead.first_name": "L" }),
    ).toBe("L");
  });

  it("leaves missing vars as literal markers so sales can spot them", () => {
    expect(substitute("hi {{lead.missing}}", {})).toBe("hi {{lead.missing}}");
  });

  it("treats null/undefined as missing (preserves marker)", () => {
    expect(
      substitute("{{a}} {{b}}", { a: null as unknown as string, b: undefined }),
    ).toBe("{{a}} {{b}}");
  });

  it("coerces non-string values to string", () => {
    expect(substitute("score {{n}}", { n: 87 })).toBe("score 87");
  });

  it("is a no-op when template has no markers", () => {
    expect(substitute("plain text", { a: "b" })).toBe("plain text");
  });
});

describe("htmlToPlain", () => {
  it("strips tags + script + style", () => {
    const html = `<style>.a{}</style><p>Hello <strong>world</strong></p><script>x</script>`;
    expect(htmlToPlain(html)).toBe("Hello world");
  });

  it("decodes common entities", () => {
    expect(htmlToPlain("Tom &amp; Jerry &lt;3 &gt; you")).toBe(
      "Tom & Jerry <3 > you",
    );
  });

  it("collapses whitespace", () => {
    expect(htmlToPlain("<p>a   b\n\nc</p>")).toBe("a b c");
  });
});
