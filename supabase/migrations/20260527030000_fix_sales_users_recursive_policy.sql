-- "Supervisor reads all sales users" recursed: its USING clause selected
-- from sales_users itself, which triggered the same policy again.
-- Replace with a SECURITY DEFINER helper that runs as the table owner and
-- skips RLS on the inner lookup. The helper takes the JWT email so it's
-- usable from any RLS policy without re-evaluating the calling user.

CREATE OR REPLACE FUNCTION is_supervisor_or_admin(jwt_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM sales_users
    WHERE email = jwt_email
      AND role IN ('supervisor', 'admin')
  );
$$;

DROP POLICY IF EXISTS "Supervisor reads all sales users" ON sales_users;

CREATE POLICY "Supervisor reads all sales users" ON sales_users
  FOR SELECT
  USING (is_supervisor_or_admin(auth.jwt()->>'email'));
