// Types for the sales → personalized demo pipeline.
// Spec: ../../../docs/superpowers/specs/2026-05-25-sales-demo-pipeline-design.md

export type Segment =
  | "tourism"
  | "ecom"
  | "law-firm"
  | "dental"
  | "agency"
  | "other";

export type LeadSource = "cold" | "referral" | "inbound" | "imported";

export type DemoStatus =
  | "queued"
  | "enriching"
  | "skinning"
  | "wiring_admin"
  | "deploying"
  | "auditing"
  | "drafting"
  | "draft_ready"
  | "sent"
  | "expired"
  | "deleted"
  | "failed";

// Shape consumed by xfly.js as company.json. Mirrors xfly's documented schema.
export interface CompanySpec {
  name: string;
  nameKa?: string;
  tagline?: string;
  about?: string;
  phone?: string;
  email?: string;
  address?: string;
  services?: string[];
  domain?: string;
  color?: string; // hex; e.g. "#0f62fe"
  logo?: string; // path under <demoDir>/images/brand/ or remote URL
  socials?: {
    linkedin?: string;
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
}

export interface ReferenceTemplate {
  id: string;
  segment: Segment;
  source_url: string;
  source_label: string | null;
  pre_cloned_path: string;
  aesthetic_tier: number;
  xfly_check_score: number | null;
  ref_map_path: string | null;
  last_refreshed_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface DemoJobPhaseEntry {
  phase: string;
  started_at: string;
  ended_at?: string;
  status: "running" | "ok" | "failed";
  error?: string;
  notes?: Record<string, unknown>;
}

export interface DemoJob {
  id: string;
  lead_id: string;
  sales_user_id: string | null;
  reference_template_id: string | null;
  status: DemoStatus;
  current_phase: string | null;
  progress: number;
  phase_history: DemoJobPhaseEntry[];
  demo_url: string | null;
  demo_vercel_project_id: string | null;
  demo_supabase_org_id: string | null;
  audit_results: AuditSummary | null;
  email_draft_id: string | null;
  error_message: string | null;
  expires_at: string | null;
  engagement_count: number;
  last_engaged_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditSummary {
  scores: {
    seo: number;
    performance: number;
    security: number;
    accessibility: number;
    overall: number;
  };
  topIssues: Array<{
    severity: "critical" | "warning" | "info";
    category: string;
    headline: string;
    oneLineFix: string;
  }>;
  techStack: {
    platform: string | null;
    frameworks: string[];
    cms: string | null;
  };
}

export interface EmailDraft {
  id: string;
  lead_id: string;
  demo_job_id: string | null;
  sales_user_id: string | null;
  email_template_id: string | null;
  subject: string;
  body_html: string;
  body_text: string | null;
  variables: Record<string, unknown> | null;
  status: "draft" | "sent" | "revoked";
  created_at: string;
  sent_at: string | null;
}

// Progress event emitted by long-running subprocess wrappers (cloner, skinner, deployer).
export type ProgressEvent =
  | { type: "phase"; phase: string; message?: string }
  | { type: "log"; line: string }
  | { type: "error"; error: string }
  | {
      type: "done";
      ok: boolean;
      exitCode: number;
      meta?: Record<string, unknown>;
    };

export type ProgressHandler = (event: ProgressEvent) => void;
