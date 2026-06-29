export type Vacancy = {
  id: string;
  slug: string;
  title: string;
  department: string | null;
  description_md: string | null;
  is_open: boolean;
};

export type Candidate = {
  source: "web" | "email";
  externalId: string; // job_applications.id (web) | message_id (email)
  name: string;
  email: string;
  phone?: string | null;
  vacancyId?: string | null;
  cvPath?: string | null; // path in private 'applications' bucket
  projects?: string | null;
  note?: string | null;
};

export type Verdict = {
  score: number; // 0-100
  decision: "meeting" | "reject";
  confidence: number; // 0-1
  language: string; // ISO-639-1
  strengths: string[];
  gaps: string[];
  rationale: string;
  emailSubject: string;
  emailBody: string;
};
