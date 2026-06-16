import { describe, it, expect } from "vitest";
import { slugify, buildResponseRow } from "./repo";

describe("slugify", () => {
  it("lowercases, strips punctuation, keeps a short hash suffix shape", () => {
    expect(slugify("ანგელოზთა Museum!")).toMatch(/^[a-z0-9-]+$/);
  });
});

describe("buildResponseRow", () => {
  it("pulls respondent_name from answers.respondent and keeps answers", () => {
    const row = buildResponseRow(
      "clinic-1",
      null,
      "Acme",
      {
        respondent: "ქეთა",
        role: "დირექცია",
      },
      "UA/1.0",
    );
    expect(row.bot_slug).toBe("clinic-1");
    expect(row.respondent_name).toBe("ქეთა");
    expect(row.answers.role).toBe("დირექცია");
    expect(row.user_agent).toBe("UA/1.0");
  });
});
