-- Add revenue and document fields to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS revenue DECIMAL(12,2) DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS contract_url TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS invoice_url TEXT;

-- Create index for revenue queries (for dashboard chart)
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);

-- Create documents storage bucket (run this in Supabase Dashboard > Storage if needed)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);
