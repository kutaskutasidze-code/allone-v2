-- Migration: tighten_rls
-- Replace the wide-open "USING (true)" SELECT policies on leads and sales_users
-- with role-based ones, so a direct (user-session / anon-key) query can no longer
-- read every row. API routes use the service-role client (createAdminClient), which
-- BYPASSES RLS and is unaffected; this only constrains user-session reads
-- (e.g. /admin/dashboard reads leads with the caller's session).
--
-- REQUIRES (ordering): apply AFTER 20260603010000_seed_admin_roles.sql, so admins
-- already have role='admin'. Otherwise /admin/dashboard (user-session lead reads)
-- would return zero rows for an admin until they are seeded.
-- >>> TAKE A FULL SUPABASE DATABASE BACKUP BEFORE APPLYING (if not already taken). <<<
--
-- SAFETY: RLS hides rows, it never deletes them. The service-role count(*) is
-- unchanged. Reversible — prior policy definitions are recorded in ROLLBACK below.

-- ---- leads ----
-- Drop the two over-broad SELECT policies:
--   "Admin can read all leads"   USING (true)                            [20250111_sales_dashboard.sql]
--   "Supervisor reads all leads" auth.users subquery, role='supervisor'  [20260405_sales_commissions.sql]
DROP POLICY IF EXISTS "Admin can read all leads" ON leads;
DROP POLICY IF EXISTS "Supervisor reads all leads" ON leads;

-- Staff (admin OR supervisor) may read all leads, via the existing SECURITY DEFINER helper.
CREATE POLICY "Staff read all leads" ON leads
  FOR SELECT TO authenticated
  USING (is_supervisor_or_admin(auth.jwt()->>'email'));

-- NOTE: the four "...own leads" SELECT/INSERT/UPDATE/DELETE policies are left intact —
-- salespeople remain scoped to leads assigned to them.

-- ---- sales_users ----
-- Drop the over-broad policy. Keep "Sales users can read own record" and the
-- helper-based "Supervisor reads all sales users" (both already correct).
DROP POLICY IF EXISTS "Admin can read all sales users" ON sales_users;

-- VERIFY (run after; each role should see exactly its own scope):
--   SELECT count(*) FROM leads;                 -- as service role: equals pre-migration count
--   -- as a salesperson JWT: SELECT count(*) FROM leads;        -> only their own
--   -- as a supervisor/admin JWT: SELECT count(*) FROM leads;   -> all
--   App smoke test (user-session reads):
--     * /admin/dashboard as an admin -> lead stats populated (NOT zero)  [proves seed+policy work together]
--     * /sales/dashboard as a rep    -> personal pipeline (service-role; should be unaffected)
--     * /sales/commissions as a rep  -> commission view loads
--
-- ROLLBACK (restores the prior wide-open policies verbatim):
--   DROP POLICY IF EXISTS "Staff read all leads" ON leads;
--   CREATE POLICY "Admin can read all leads" ON leads FOR SELECT TO authenticated USING (true);
--   CREATE POLICY "Supervisor reads all leads" ON leads FOR SELECT TO authenticated
--     USING (EXISTS (SELECT 1 FROM sales_users s
--       WHERE s.email = (SELECT email FROM auth.users WHERE id = auth.uid()) AND s.role = 'supervisor'));
--   CREATE POLICY "Admin can read all sales users" ON sales_users FOR SELECT TO authenticated USING (true);
