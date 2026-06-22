import { describe, it, expect } from "vitest";
import type { CreateProposalInput } from "./types";

describe("proposal source field", () => {
  it("CreateProposalInput accepts a source tag", () => {
    const input: CreateProposalInput = {
      lead_id: null,
      source_response_id: "r",
      client_name: "ALLONE",
      doc_number: "AL-2026-031",
      language: "en",
      offer: {
        client_name: "ALLONE",
        summary: "",
        scope_lines: [],
        price: 0,
        currency: "GEL",
        schedule: [],
        monthly_opex: "",
        timeline: "",
      },
      price: 0,
      currency: "GEL",
      status: "sent",
      created_by: null,
      source: "website-self-serve",
    };
    expect(input.source).toBe("website-self-serve");
  });
});
