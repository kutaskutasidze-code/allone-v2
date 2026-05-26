import type { CompanySpec, Segment } from "../../types/demo.js";
import { seedTourism, unseedTourism } from "./tourism.js";
import { seedEcom, unseedEcom } from "./ecom.js";

export interface SeedResult {
  segment: Segment;
  rows: number;
  detail: Record<string, number>;
}

export async function seedSegment(
  segment: Segment,
  demoOrgId: string,
  company: CompanySpec,
): Promise<SeedResult> {
  switch (segment) {
    case "tourism": {
      const r = await seedTourism(demoOrgId, company);
      return {
        segment,
        rows: Object.values(r).reduce((s, n) => s + n, 0),
        detail: r as unknown as Record<string, number>,
      };
    }
    case "ecom": {
      const r = await seedEcom(demoOrgId, company);
      return {
        segment,
        rows: Object.values(r).reduce((s, n) => s + n, 0),
        detail: r as unknown as Record<string, number>,
      };
    }
    default:
      // For segments without seeds yet, fall back to ecom — it's the closest
      // generic shape (products + orders + customers).
      const r = await seedEcom(demoOrgId, company);
      return {
        segment,
        rows: Object.values(r).reduce((s, n) => s + n, 0),
        detail: { ...r, fallback_from: 1 } as unknown as Record<string, number>,
      };
  }
}

export async function unseedSegment(
  segment: Segment,
  demoOrgId: string,
): Promise<void> {
  switch (segment) {
    case "tourism":
      return unseedTourism(demoOrgId);
    case "ecom":
    default:
      return unseedEcom(demoOrgId);
  }
}
