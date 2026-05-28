// Shape returned by analyzeWebsite(). Consumed by the enricher (maps to
// CompanySpec) and demo-pipeline.summarizeAudit (folds it into the
// AuditSummary written onto demo_jobs.audit_results).

export type IssueSeverity = "critical" | "warning" | "info";

export interface Issue {
  severity: IssueSeverity;
  category: string;
  // Human-readable summary of the issue.
  description: string;
  // One-line fix suggestion — used as the "oneLineFix" field downstream.
  recommendation: string;
}

export interface AnalysisData {
  // Source page that was analyzed.
  url: string;

  // Company-level facts gleaned from the page text + structured data.
  // `string | undefined` (not | null) so the enricher can spread these
  // straight into a CompanySpec without TypeScript whining about null.
  company: {
    name?: string;
    nameKa?: string;
    industry?: string;
    description?: string;
    products: string[];
  };

  // Detected tech stack — derived from HTTP headers + page markup.
  techStack: {
    platform: string | null;
    frameworks: string[];
    cms: string | null;
  };

  // Issues bucketed by category. Each Issue has the same shape so they can
  // be flat-mapped + sorted by severity downstream.
  technical: {
    htmlIssues: Issue[];
    seoIssues: Issue[];
    performanceIssues: Issue[];
    securityIssues: Issue[];
    accessibilityIssues: Issue[];
    additionalIssues: Issue[];
  };

  // Per-category 0-100 scores. Fields match demo-pipeline.AuditSummary so
  // the analyzer output flows into audit_results without remapping.
  scores: {
    seo: number;
    performance: number;
    security: number;
    accessibility: number;
    overall: number;
  };
}
