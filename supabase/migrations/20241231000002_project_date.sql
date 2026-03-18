-- Add project_date field for revenue tracking
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_date DATE DEFAULT CURRENT_DATE;

-- Update existing projects to use created_at as project_date
UPDATE projects SET project_date = DATE(created_at) WHERE project_date IS NULL;
