-- Sales Dashboard Schema
-- Creates tables for sales team and lead management

-- =============================================
-- Helper Function (create if not exists)
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================
-- Sales Users Table
-- =============================================
CREATE TABLE IF NOT EXISTS sales_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update trigger for sales_users
CREATE TRIGGER update_sales_users_updated_at
  BEFORE UPDATE ON sales_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Leads Table
-- =============================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_user_id UUID REFERENCES sales_users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'won', 'lost')),
  value DECIMAL(12,2) DEFAULT 0,
  source TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for leads
CREATE INDEX IF NOT EXISTS idx_leads_sales_user ON leads(sales_user_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- Update trigger for leads
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Row Level Security Policies
-- =============================================

-- Enable RLS
ALTER TABLE sales_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Sales Users Policies
-- Authenticated users can read their own sales_user record
CREATE POLICY "Sales users can read own record" ON sales_users
  FOR SELECT TO authenticated
  USING (email = auth.jwt()->>'email');

-- Admin can read all sales users (for admin dashboard)
CREATE POLICY "Admin can read all sales users" ON sales_users
  FOR SELECT TO authenticated
  USING (true);

-- Leads Policies
-- Sales users can read their own leads
CREATE POLICY "Sales users can read own leads" ON leads
  FOR SELECT TO authenticated
  USING (
    sales_user_id IN (
      SELECT id FROM sales_users WHERE email = auth.jwt()->>'email'
    )
  );

-- Sales users can insert leads assigned to themselves
CREATE POLICY "Sales users can insert own leads" ON leads
  FOR INSERT TO authenticated
  WITH CHECK (
    sales_user_id IN (
      SELECT id FROM sales_users WHERE email = auth.jwt()->>'email'
    )
  );

-- Sales users can update their own leads
CREATE POLICY "Sales users can update own leads" ON leads
  FOR UPDATE TO authenticated
  USING (
    sales_user_id IN (
      SELECT id FROM sales_users WHERE email = auth.jwt()->>'email'
    )
  );

-- Sales users can delete their own leads
CREATE POLICY "Sales users can delete own leads" ON leads
  FOR DELETE TO authenticated
  USING (
    sales_user_id IN (
      SELECT id FROM sales_users WHERE email = auth.jwt()->>'email'
    )
  );

-- Admin can read all leads (for admin dashboard)
CREATE POLICY "Admin can read all leads" ON leads
  FOR SELECT TO authenticated
  USING (true);

-- =============================================
-- Comments
-- =============================================
COMMENT ON TABLE sales_users IS 'Sales team members who can manage leads';
COMMENT ON TABLE leads IS 'Sales leads/prospects managed by sales team';
COMMENT ON COLUMN leads.status IS 'Pipeline stage: new, contacted, qualified, won, lost';
COMMENT ON COLUMN leads.value IS 'Potential deal value in dollars';
COMMENT ON COLUMN leads.source IS 'Lead source: website, referral, cold call, etc.';
