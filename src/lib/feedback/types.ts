import type { Locale } from "@/lib/i18n/dict";

export type { Locale };

export type SubmissionType = "bug" | "feature" | "feedback";
export type Priority = "urgent" | "high" | "medium" | "low" | "none";

// Mirrors the feedback_companies table.
export interface FeedbackCompany {
  id: string;
  name: string;
  slug: string;
  access_token_enc: string;
  token_lookup: string;
  login_email: string;
  password_hash: string;
  password_enc: string | null;
  contact_email: string | null;
  phone: string | null;
  comms_language: Locale;
  plane_workspace: string;
  plane_project_id: string;
  plane_label_id: string | null;
  failed_attempts: number;
  locked_until: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  rotated_at: string | null;
}

// Mirrors the feedback_submissions table.
export interface FeedbackSubmission {
  id: string;
  company_id: string;
  type: SubmissionType;
  priority: Priority | null;
  title: string;
  body: string | null;
  page_url: string | null;
  screenshot_urls: string[] | null;
  plane_intake_issue_id: string | null;
  plane_issue_id: string | null;
  status: string;
  created_at: string;
}

export interface SubmissionWithCompany extends FeedbackSubmission {
  feedback_companies: { name: string; slug: string } | null;
}
