-- Demos-project schema for the sales → personalized demo pipeline.
-- Applied to the DEDICATED demos Supabase project, NOT the sales/website one.
-- See supabase/demos-project/README.md for setup.

-- ============================================================================
-- 1. demo_orgs — one row per active demo
-- ============================================================================

CREATE TABLE IF NOT EXISTS demo_orgs (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  brand_color TEXT,
  brand_logo TEXT,
  segment TEXT NOT NULL,
  seeded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_demo_orgs_segment ON demo_orgs(segment);
CREATE INDEX IF NOT EXISTS idx_demo_orgs_expires ON demo_orgs(expires_at)
  WHERE expires_at IS NOT NULL;

-- ============================================================================
-- 2. Tourism — hotels, contacts, orders, audit_log
--    Shape mirrors travelplace-bf's schema so seeded data renders the same way.
-- ============================================================================

CREATE TABLE IF NOT EXISTS hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES demo_orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  city TEXT,
  tier TEXT,
  rooms INTEGER,
  base_price_eur INTEGER,
  balance_eur INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hotels_org ON hotels(org_id);

CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES demo_orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_contacts_org ON contacts(org_id);

-- Orders is shared between tourism and ecom (same column set for the demo
-- pipeline — production BF separates them, but we don't need that here).
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES demo_orgs(id) ON DELETE CASCADE,
  -- Tourism columns
  hotel_id UUID REFERENCES hotels(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  level TEXT,
  check_in DATE,
  check_out DATE,
  -- Ecom columns
  product_id UUID,
  customer_id UUID,
  qty INTEGER,
  status TEXT,
  -- Shared
  total_eur INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_orders_org ON orders(org_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(org_id, created_at DESC);

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES demo_orgs(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target TEXT,
  actor TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_org_occurred
  ON audit_log(org_id, occurred_at DESC);

-- ============================================================================
-- 3. Ecom — products, customers, stock_movements
-- ============================================================================

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES demo_orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  price_eur INTEGER,
  stock INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_products_org ON products(org_id);

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES demo_orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  country TEXT,
  lifetime_value_eur INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customers_org ON customers(org_id);

-- Late-add the FK from orders to products/customers (created above without
-- references so the create order works; add the constraints now).
ALTER TABLE orders
  ADD CONSTRAINT IF NOT EXISTS fk_orders_product
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  ADD CONSTRAINT IF NOT EXISTS fk_orders_customer
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES demo_orgs(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  delta INTEGER NOT NULL,
  reason TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stock_org_occurred
  ON stock_movements(org_id, occurred_at DESC);

-- ============================================================================
-- 4. RLS — every demo row is fake; the project itself is the trust boundary.
--    We still enable RLS + permissive read policies so anon-key reads work
--    when the shared admin uses ?demo=<jobId> with no authenticated user.
--    Writes via service role (admin-wirer + seeds).
-- ============================================================================

ALTER TABLE demo_orgs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotels          ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders          ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log       ENABLE ROW LEVEL SECURITY;
ALTER TABLE products        ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon can read demo_orgs"        ON demo_orgs       FOR SELECT TO anon USING (true);
CREATE POLICY "anon can read hotels"           ON hotels          FOR SELECT TO anon USING (true);
CREATE POLICY "anon can read contacts"         ON contacts        FOR SELECT TO anon USING (true);
CREATE POLICY "anon can read orders"           ON orders          FOR SELECT TO anon USING (true);
CREATE POLICY "anon can read audit_log"        ON audit_log       FOR SELECT TO anon USING (true);
CREATE POLICY "anon can read products"         ON products        FOR SELECT TO anon USING (true);
CREATE POLICY "anon can read customers"        ON customers       FOR SELECT TO anon USING (true);
CREATE POLICY "anon can read stock_movements"  ON stock_movements FOR SELECT TO anon USING (true);
