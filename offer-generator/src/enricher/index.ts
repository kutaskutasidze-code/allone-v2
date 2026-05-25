import type { AnalysisData } from "../types/analysis.js";
import type { CompanySpec, Segment } from "../types/demo.js";

// Maps the offer-generator's existing AnalysisData (produced by company-researcher
// + html-analyzer) into the CompanySpec shape that xfly.js consumes.
//
// Slice 2: typed stub.
// Slice 3+: real extraction logic — pull dominant brand color from CSS,
// logo from <img class="*logo*"|alt="*logo*">, services from heading scan,
// contact via regex sweep over rendered HTML.
export async function enrichCompanySpec(
  leadEmail: string,
  leadName: string,
  leadCompany: string | null,
  analysis: AnalysisData | null,
): Promise<CompanySpec> {
  throw new Error(
    "NotImplemented: enricher.enrichCompanySpec — wired in Slice 3",
  );
}

// LLM-classifies a lead's segment from their site content + company description.
// Returns 'other' when the classifier is below confidence threshold.
export async function classifySegment(
  analysis: AnalysisData | null,
  hint?: string,
): Promise<Segment> {
  throw new Error(
    "NotImplemented: enricher.classifySegment — wired in Slice 3",
  );
}
