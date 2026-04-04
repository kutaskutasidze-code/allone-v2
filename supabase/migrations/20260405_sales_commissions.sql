-- 1. Role on sales_users (single supervisor enforced)
ALTER TABLE sales_users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'salesperson'
  CHECK (role IN ('salesperson', 'supervisor'));
CREATE UNIQUE INDEX IF NOT EXISTS uniq_single_supervisor
  ON sales_users ((role)) WHERE role = 'supervisor';

-- 2. Link projects to sales user + won lead
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS sales_user_id UUID REFERENCES sales_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS won_lead_id UUID REFERENCES leads(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_projects_sales_user ON projects(sales_user_id);
CREATE INDEX IF NOT EXISTS idx_projects_won_lead ON projects(won_lead_id);

-- 3. won_at timestamp on leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS won_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION set_lead_won_at() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'won' AND (OLD.status IS DISTINCT FROM 'won') THEN
    NEW.won_at := COALESCE(NEW.won_at, NOW());
  ELSIF NEW.status <> 'won' THEN
    NEW.won_at := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_lead_won_at ON leads;
CREATE TRIGGER trg_set_lead_won_at
  BEFORE INSERT OR UPDATE OF status ON leads
  FOR EACH ROW EXECUTE FUNCTION set_lead_won_at();

UPDATE leads SET won_at = updated_at WHERE status = 'won' AND won_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_leads_won_at ON leads(won_at) WHERE status = 'won';

-- 4. Supervisor RLS policies (read all)
DROP POLICY IF EXISTS "Supervisor reads all leads" ON leads;
CREATE POLICY "Supervisor reads all leads" ON leads FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM sales_users s
    WHERE s.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND s.role = 'supervisor'
  ));

DROP POLICY IF EXISTS "Supervisor reads all sales users" ON sales_users;
CREATE POLICY "Supervisor reads all sales users" ON sales_users FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM sales_users s
    WHERE s.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND s.role = 'supervisor'
  ));
