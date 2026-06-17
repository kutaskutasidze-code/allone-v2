-- Careers: vacancies + job applications + private CV storage bucket.
-- All reads/writes go through service-role API routes, so RLS is enabled with
-- no anon/authenticated policies (the service role bypasses RLS).

CREATE TABLE IF NOT EXISTS vacancies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  department TEXT,
  employment_type TEXT NOT NULL DEFAULT 'internship'
    CHECK (employment_type IN ('internship', 'full_time', 'part_time', 'contract')),
  location TEXT,
  summary TEXT,
  description_md TEXT,
  is_open BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vacancies_is_open ON vacancies(is_open);
CREATE INDEX IF NOT EXISTS idx_vacancies_slug ON vacancies(slug);

CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vacancy_id UUID REFERENCES vacancies(id) ON DELETE SET NULL,
  vacancy_title TEXT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  cv_path TEXT,
  projects TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'reviewing', 'shortlisted', 'rejected', 'hired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_applications_vacancy ON job_applications(vacancy_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_created_at ON job_applications(created_at DESC);

-- updated_at maintenance (reuses the shared trigger function)
DROP TRIGGER IF EXISTS update_vacancies_updated_at ON vacancies;
CREATE TRIGGER update_vacancies_updated_at
  BEFORE UPDATE ON vacancies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_job_applications_updated_at ON job_applications;
CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON job_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE vacancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Private bucket for CV PDFs (downloaded by admins via short-lived signed URLs).
INSERT INTO storage.buckets (id, name, public)
VALUES ('applications', 'applications', false)
ON CONFLICT (id) DO NOTHING;
