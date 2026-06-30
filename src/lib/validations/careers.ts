import { z } from "zod";

export const EMPLOYMENT_TYPES = [
  { value: "internship", label: "Internship" },
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
] as const;

export const APPLICATION_STATUSES = [
  { value: "new", label: "New" },
  { value: "reviewing", label: "Reviewing" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "interview", label: "Interview" },
  { value: "rejected", label: "Rejected" },
  { value: "hired", label: "Hired" },
] as const;

export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number]["value"];
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]["value"];

export const employmentTypeLabel = (v: string) =>
  EMPLOYMENT_TYPES.find((t) => t.value === v)?.label ?? v;

export interface Vacancy {
  id: string;
  slug: string;
  title: string;
  department: string | null;
  employment_type: EmploymentType;
  location: string | null;
  summary: string | null;
  description_md: string | null;
  is_open: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface JobApplication {
  id: string;
  vacancy_id: string | null;
  vacancy_title: string | null;
  name: string;
  email: string;
  phone: string | null;
  linkedin: string | null;
  cv_path: string | null;
  projects: string | null;
  note: string | null;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
}

const employmentTypeEnum = z.enum([
  "internship",
  "full_time",
  "part_time",
  "contract",
]);
const applicationStatusEnum = z.enum([
  "new",
  "reviewing",
  "shortlisted",
  "interview",
  "rejected",
  "hired",
]);

// Accepted CV formats (the upload goes straight to Storage, so no body-size cap).
export const CV_ACCEPT = ".pdf,.doc,.docx,.odt,.rtf";
export const CV_EXT_RE = /\.(pdf|docx?|odt|rtf)$/i;

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// Admin create/update of a vacancy. `slug` is derived from the title when omitted.
export const vacancySchema = z.object({
  title: z.string().min(1, "Title is required").max(160),
  slug: z.string().max(80).optional(),
  department: z.string().max(80).optional().or(z.literal("")),
  employment_type: employmentTypeEnum.default("internship"),
  location: z.string().max(120).optional().or(z.literal("")),
  summary: z.string().max(400).optional().or(z.literal("")),
  description_md: z.string().max(20000).optional().or(z.literal("")),
  is_open: z.boolean().default(true),
  sort_order: z.coerce.number().int().default(0),
});

// Public application. The CV is uploaded to Storage first; cv_path references it.
export const applicationSchema = z.object({
  vacancy_id: z.string().uuid(),
  name: z.string().min(1, "Name is required").max(160),
  email: z.string().email("A valid email is required").max(255),
  phone: z.string().max(50).optional().or(z.literal("")),
  linkedin: z.string().max(300).optional().or(z.literal("")),
  note: z.string().max(5000).optional().or(z.literal("")),
  cv_path: z.string().min(1).max(300),
});

export const applicationStatusUpdateSchema = z.object({
  status: applicationStatusEnum,
});
