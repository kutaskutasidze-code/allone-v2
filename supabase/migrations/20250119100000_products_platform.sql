-- ALLONE Platform Database Schema
-- Products, Purchases, Subscriptions, User Profiles

-- User profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  company TEXT,
  avatar_url TEXT,
  paypal_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products catalog
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  price_type TEXT DEFAULT 'one_time' CHECK (price_type IN ('one_time', 'subscription')),
  billing_period TEXT CHECK (billing_period IN ('monthly', 'yearly', NULL)),
  category TEXT NOT NULL CHECK (category IN ('template', 'course', 'tool', 'service', 'subscription')),
  features JSONB DEFAULT '[]',
  file_url TEXT, -- For digital downloads (Supabase Storage path)
  thumbnail_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchases (one-time)
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  email TEXT NOT NULL, -- For guest purchases
  paypal_order_id TEXT,
  paypal_capture_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'refunded', 'failed')),
  download_count INTEGER DEFAULT 0,
  download_token TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT,
  purchased_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('starter', 'pro', 'agency')),
  paypal_subscription_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'paused')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Download logs (track who downloaded what)
CREATE TABLE IF NOT EXISTS download_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  downloaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_published ON products(is_published);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_purchases_user ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_email ON purchases(email);
CREATE INDEX IF NOT EXISTS idx_purchases_token ON purchases(download_token);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE download_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Products: public read for published, authenticated for all
CREATE POLICY "Anyone can view published products" ON products
  FOR SELECT USING (is_published = true);

CREATE POLICY "Authenticated can view all products" ON products
  FOR SELECT TO authenticated USING (true);

-- Purchases: users see their own
CREATE POLICY "Users can view own purchases" ON purchases
  FOR SELECT USING (auth.uid() = user_id OR email = auth.email());

-- Subscriptions: users see their own
CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Download logs: users see their own
CREATE POLICY "Users can view own downloads" ON download_logs
  FOR SELECT USING (
    purchase_id IN (SELECT id FROM purchases WHERE user_id = auth.uid())
  );

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed some example products
INSERT INTO products (name, slug, short_description, description, price, category, features, is_published, is_featured) VALUES
  ('Lead Generation Workflow Pack', 'lead-gen-workflow-pack', 'Automated lead generation with LinkedIn, Google Maps, and email outreach', 'Complete n8n workflow bundle for automated lead generation. Includes 5 ready-to-use workflows for LinkedIn scraping, Google Maps extraction, email verification, and automated outreach sequences.', 149.00, 'template', '["5 n8n workflows", "Setup documentation", "Video tutorial", "Email support", "Lifetime updates"]', true, true),
  ('AI Chatbot Starter Kit', 'ai-chatbot-starter', 'Pre-built chatbot template for customer support', 'Deploy a customer support chatbot in minutes. Includes conversation flows, FAQ handling, human handoff, and analytics dashboard integration.', 299.00, 'template', '["Voiceflow template", "Custom training guide", "Integration docs", "30-day support", "Customization tutorial"]', true, true),
  ('Automation Masterclass', 'automation-masterclass', 'Complete course on building AI automations', 'Learn to build production-ready AI automations from scratch. 20+ hours of video content covering n8n, Make, API integrations, and AI agents.', 199.00, 'course', '["20+ hours video", "Downloadable resources", "Private community", "Certificate", "Lifetime access"]', true, false),
  ('Pro Templates Bundle', 'pro-templates-bundle', 'All templates + future releases', 'Get access to our complete template library plus all future releases. Includes priority support and monthly Q&A calls.', 99.00, 'subscription', '["All current templates", "New releases included", "Priority support", "Monthly Q&A calls", "Agency license"]', true, true)
ON CONFLICT (slug) DO NOTHING;
