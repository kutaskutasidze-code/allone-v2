-- ALLONE Admin Panel Database Schema
-- Run this in your Supabase SQL Editor to create all tables
-- Or use: supabase db push (requires port 5432 access)

-- ============================================
-- 1. Projects Table
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  category VARCHAR(100) NOT NULL,
  technologies TEXT[] NOT NULL DEFAULT '{}',
  display_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for projects
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_display_order ON projects(display_order);
CREATE INDEX IF NOT EXISTS idx_projects_is_published ON projects(is_published);

-- ============================================
-- 2. Services Table
-- ============================================
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(100) NOT NULL,
  features TEXT[] NOT NULL DEFAULT '{}',
  display_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for services
CREATE INDEX IF NOT EXISTS idx_services_display_order ON services(display_order);
CREATE INDEX IF NOT EXISTS idx_services_is_published ON services(is_published);

-- ============================================
-- 3. Clients Table
-- ============================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  logo_text VARCHAR(255) NOT NULL,
  logo_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for clients
CREATE INDEX IF NOT EXISTS idx_clients_display_order ON clients(display_order);
CREATE INDEX IF NOT EXISTS idx_clients_is_published ON clients(is_published);

-- ============================================
-- 4. Stats Table
-- ============================================
CREATE TABLE IF NOT EXISTS stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value VARCHAR(50) NOT NULL,
  label VARCHAR(100) NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for stats
CREATE INDEX IF NOT EXISTS idx_stats_display_order ON stats(display_order);

-- ============================================
-- 5. Company Values Table
-- ============================================
CREATE TABLE IF NOT EXISTS company_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number VARCHAR(10) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for company_values
CREATE INDEX IF NOT EXISTS idx_company_values_display_order ON company_values(display_order);

-- ============================================
-- 6. Contact Info Table (single row)
-- ============================================
CREATE TABLE IF NOT EXISTS contact_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 7. About Page Content Table (single row)
-- ============================================
CREATE TABLE IF NOT EXISTS about_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hero_subtitle VARCHAR(255) DEFAULT 'About Us',
  hero_title TEXT NOT NULL,
  story_subtitle VARCHAR(255) DEFAULT 'Our Story',
  story_title TEXT NOT NULL,
  story_paragraphs TEXT[] NOT NULL DEFAULT '{}',
  values_subtitle VARCHAR(255) DEFAULT 'Our Values',
  values_title VARCHAR(255) DEFAULT 'What drives us',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 8. Categories Table (for project categories)
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for categories
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- Automatically updates the updated_at column
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables with updated_at column
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stats_updated_at BEFORE UPDATE ON stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_values_updated_at BEFORE UPDATE ON company_values
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_info_updated_at BEFORE UPDATE ON contact_info
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_about_content_updated_at BEFORE UPDATE ON about_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable Row Level Security on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE about_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Public read access for published content
CREATE POLICY "Public read access for projects" ON projects FOR SELECT USING (is_published = true);
CREATE POLICY "Public read access for services" ON services FOR SELECT USING (is_published = true);
CREATE POLICY "Public read access for clients" ON clients FOR SELECT USING (is_published = true);
CREATE POLICY "Public read access for stats" ON stats FOR SELECT USING (true);
CREATE POLICY "Public read access for values" ON company_values FOR SELECT USING (true);
CREATE POLICY "Public read access for contact" ON contact_info FOR SELECT USING (true);
CREATE POLICY "Public read access for about" ON about_content FOR SELECT USING (true);
CREATE POLICY "Public read access for categories" ON categories FOR SELECT USING (true);

-- Authenticated users (admin) full access
CREATE POLICY "Admin full access for projects" ON projects FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access for services" ON services FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access for clients" ON clients FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access for stats" ON stats FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access for values" ON company_values FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access for contact" ON contact_info FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access for about" ON about_content FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access for categories" ON categories FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- SEED DATA
-- ============================================

-- Insert default categories
INSERT INTO categories (name, display_order) VALUES
  ('Chatbots', 0),
  ('Automation', 1),
  ('Custom AI', 2)
ON CONFLICT (name) DO NOTHING;

-- Insert default contact info
INSERT INTO contact_info (email, location) VALUES
  ('hello@allone.ai', 'San Francisco, CA')
ON CONFLICT DO NOTHING;

-- ============================================
-- END OF SCHEMA
-- ============================================
