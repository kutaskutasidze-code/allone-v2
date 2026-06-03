-- Migration: role_authority
-- Makes sales_users.role the single source of truth for authorization.
--   (1) Widen the role CHECK to allow 'admin' (today it is only
--       'salesperson','supervisor', so role='admin' is REJECTED at the DB level).
--   (2) Drop the uniq_single_supervisor index (the old "one supervisor only" rule),
--       which blocks the admin/supervisor model and safe role promotion.
--   (3) Add an is_admin(jwt_email) SECURITY DEFINER helper mirroring
--       is_supervisor_or_admin(), for the tightened RLS policies in Phase 5.
--
-- SAFETY: Additive / reversible. No row is read, modified, or deleted. Dropping a
-- CHECK constraint or a partial unique index removes a *rule*, not data; the widened
-- CHECK accepts every value that already exists.
-- >>> TAKE A FULL SUPABASE DATABASE BACKUP BEFORE APPLYING THIS MIGRATION. <<<
--
-- PRECHECK (run first; confirm only expected roles exist before widening):
--   SELECT role, count(*) FROM sales_users GROUP BY role;
--   -- expect only: salesperson, supervisor (possibly admin). If any other value
--   -- appears, STOP and reconcile before adding the widened constraint.

-- (1) Widen the role CHECK. Drop any existing CHECK on role by a name-agnostic lookup
--     (robust to the auto-generated constraint name), then add the widened constraint.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.sales_users'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%role%'
  LOOP
    EXECUTE format('ALTER TABLE sales_users DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE sales_users
  ADD CONSTRAINT sales_users_role_check
  CHECK (role IN ('salesperson', 'supervisor', 'admin'));

-- (2) Remove the single-supervisor cap.
DROP INDEX IF EXISTS uniq_single_supervisor;

-- (3) is_admin() helper, mirroring is_supervisor_or_admin() from
--     20260527030000_fix_sales_users_recursive_policy.sql
CREATE OR REPLACE FUNCTION is_admin(jwt_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM sales_users
    WHERE email = jwt_email AND role = 'admin'
  );
$$;

-- VERIFY (run after; all should pass):
--   -- 'admin' is now allowed (this INSERT...ROLLBACK should SUCCEED, not error):
--   BEGIN; INSERT INTO sales_users (email, name, role)
--     VALUES ('__roletest__@example.com', 'role test', 'admin'); ROLLBACK;
--   -- row count unchanged vs the pre-migration baseline:
--   SELECT count(*) FROM sales_users;
--   -- helper exists and runs:
--   SELECT is_admin('__nobody__@example.com');   -- returns false, no error

-- ROLLBACK (if ever needed):
--   DROP FUNCTION IF EXISTS is_admin(TEXT);
--   ALTER TABLE sales_users DROP CONSTRAINT IF EXISTS sales_users_role_check;
--   ALTER TABLE sales_users ADD CONSTRAINT sales_users_role_check
--     CHECK (role IN ('salesperson','supervisor'));
--   CREATE UNIQUE INDEX IF NOT EXISTS uniq_single_supervisor
--     ON sales_users ((role)) WHERE role = 'supervisor';
--   -- (recreating uniq_single_supervisor only succeeds if <=1 supervisor row exists)
