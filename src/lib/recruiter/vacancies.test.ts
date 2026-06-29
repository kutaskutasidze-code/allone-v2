import { describe, it, expect } from "vitest";
import { matchVacancy } from "./vacancies";
import type { Vacancy, Candidate } from "./types";

const v = (id: string, slug: string): Vacancy => ({
  id,
  slug,
  title: slug,
  department: null,
  description_md: "jd",
  is_open: true,
});

describe("matchVacancy", () => {
  it("matches by vacancyId when present", () => {
    const vacancies = [v("a", "one"), v("b", "two")];
    const c = {
      source: "web",
      externalId: "x",
      name: "n",
      email: "e",
      vacancyId: "b",
    } as Candidate;
    expect(matchVacancy(c, vacancies)?.id).toBe("b");
  });
  it("falls back to the sole open vacancy when no id", () => {
    const vacancies = [v("a", "one")];
    const c = {
      source: "email",
      externalId: "x",
      name: "n",
      email: "e",
    } as Candidate;
    expect(matchVacancy(c, vacancies)?.id).toBe("a");
  });
  it("returns null when ambiguous and no id", () => {
    const vacancies = [v("a", "one"), v("b", "two")];
    const c = {
      source: "email",
      externalId: "x",
      name: "n",
      email: "e",
    } as Candidate;
    expect(matchVacancy(c, vacancies)).toBeNull();
  });
});
