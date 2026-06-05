-- Make every RLS email check case-insensitive.
--
-- Each "own rows" RLS policy and the two role helpers scope a user to their
-- sales_users row via `email = auth.jwt()->>'email'`. The app always lowercases
-- emails, so this works today — but a future auth provider could issue a JWT
-- whose `email` claim is mixed-case, which would then match nothing
-- (fail-closed: the user would see zero rows). Lowercasing both sides removes
-- that latent footgun.
--
-- Mechanism: ALTER POLICY changes only the predicate (the policy name, command
-- and roles are preserved), and CREATE OR REPLACE swaps the helper bodies. Every
-- statement is idempotent — re-running sets the same lowered expression — so a
-- partial apply is safe to re-push. (sales_users.email can't simply become
-- citext: Postgres rejects ALTER COLUMN TYPE on a column referenced by policy
-- expressions.) The "...read all" staff/admin/supervisor policies go through the
-- two helpers below, so fixing the helpers covers them.

-- ---- role helpers ----
CREATE OR REPLACE FUNCTION is_admin(jwt_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM sales_users
    WHERE lower(email) = lower(jwt_email) AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION is_supervisor_or_admin(jwt_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM sales_users
    WHERE lower(email) = lower(jwt_email)
      AND role IN ('supervisor', 'admin')
  );
$$;

-- ---- sales_users ----
ALTER POLICY "Sales users can read own record" ON sales_users
  USING (lower(email) = lower(auth.jwt()->>'email'));

-- ---- leads ----
ALTER POLICY "Sales users can read own leads" ON leads
  USING (sales_user_id IN (
    SELECT id FROM sales_users WHERE lower(email) = lower(auth.jwt()->>'email')
  ));
ALTER POLICY "Sales users can insert own leads" ON leads
  WITH CHECK (sales_user_id IN (
    SELECT id FROM sales_users WHERE lower(email) = lower(auth.jwt()->>'email')
  ));
ALTER POLICY "Sales users can update own leads" ON leads
  USING (sales_user_id IN (
    SELECT id FROM sales_users WHERE lower(email) = lower(auth.jwt()->>'email')
  ));
ALTER POLICY "Sales users can delete own leads" ON leads
  USING (sales_user_id IN (
    SELECT id FROM sales_users WHERE lower(email) = lower(auth.jwt()->>'email')
  ));

-- ---- reference_templates ----
ALTER POLICY "Sales users can read reference templates" ON reference_templates
  USING (EXISTS (
    SELECT 1 FROM sales_users WHERE lower(email) = lower(auth.jwt()->>'email')
  ));
ALTER POLICY "Admins can manage reference templates" ON reference_templates
  USING (EXISTS (
    SELECT 1 FROM sales_users
    WHERE lower(email) = lower(auth.jwt()->>'email') AND role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM sales_users
    WHERE lower(email) = lower(auth.jwt()->>'email') AND role = 'admin'
  ));

-- ---- demo_jobs ----
ALTER POLICY "Sales users can read own demo jobs" ON demo_jobs
  USING (lead_id IN (
    SELECT id FROM leads WHERE sales_user_id IN (
      SELECT id FROM sales_users WHERE lower(email) = lower(auth.jwt()->>'email')
    )
  ));
ALTER POLICY "Sales users can update own demo jobs" ON demo_jobs
  USING (lead_id IN (
    SELECT id FROM leads WHERE sales_user_id IN (
      SELECT id FROM sales_users WHERE lower(email) = lower(auth.jwt()->>'email')
    )
  ));

-- ---- email_drafts ----
ALTER POLICY "Sales users can read own email drafts" ON email_drafts
  USING (lead_id IN (
    SELECT id FROM leads WHERE sales_user_id IN (
      SELECT id FROM sales_users WHERE lower(email) = lower(auth.jwt()->>'email')
    )
  ));
ALTER POLICY "Sales users can update own email drafts" ON email_drafts
  USING (lead_id IN (
    SELECT id FROM leads WHERE sales_user_id IN (
      SELECT id FROM sales_users WHERE lower(email) = lower(auth.jwt()->>'email')
    )
  ));

-- ---- demo_engagements ----
ALTER POLICY "Sales users can read own demo engagements" ON demo_engagements
  USING (demo_job_id IN (
    SELECT id FROM demo_jobs WHERE lead_id IN (
      SELECT id FROM leads WHERE sales_user_id IN (
        SELECT id FROM sales_users WHERE lower(email) = lower(auth.jwt()->>'email')
      )
    )
  ));

-- ---- notification_channels ----
ALTER POLICY "Sales users read own channels" ON notification_channels
  USING (sales_user_id IN (
    SELECT id FROM sales_users WHERE lower(email) = lower(auth.jwt()->>'email')
  ));
ALTER POLICY "Sales users update own channels" ON notification_channels
  USING (sales_user_id IN (
    SELECT id FROM sales_users WHERE lower(email) = lower(auth.jwt()->>'email')
  ));
ALTER POLICY "Sales users delete own channels" ON notification_channels
  USING (sales_user_id IN (
    SELECT id FROM sales_users WHERE lower(email) = lower(auth.jwt()->>'email')
  ));
ALTER POLICY "Admins read all channels" ON notification_channels
  USING (EXISTS (
    SELECT 1 FROM sales_users
    WHERE lower(email) = lower(auth.jwt()->>'email') AND role = 'admin'
  ));

-- ---- notification_sends ----
ALTER POLICY "Sales users read own sends" ON notification_sends
  USING (sales_user_id IN (
    SELECT id FROM sales_users WHERE lower(email) = lower(auth.jwt()->>'email')
  ));
ALTER POLICY "Admins read all sends" ON notification_sends
  USING (EXISTS (
    SELECT 1 FROM sales_users
    WHERE lower(email) = lower(auth.jwt()->>'email') AND role = 'admin'
  ));

-- ---- aim_growth_overrides ----
ALTER POLICY "Admins manage aim growth overrides" ON aim_growth_overrides
  USING (EXISTS (
    SELECT 1 FROM sales_users
    WHERE lower(email) = lower(auth.jwt()->>'email') AND role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM sales_users
    WHERE lower(email) = lower(auth.jwt()->>'email') AND role = 'admin'
  ));
ALTER POLICY "Sales users read own overrides" ON aim_growth_overrides
  USING (sales_user_id IN (
    SELECT id FROM sales_users WHERE lower(email) = lower(auth.jwt()->>'email')
  ));

-- ---- calls / tasks / meetings (created via a loop in 20260604010000) ----
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['calls','tasks','meetings'] LOOP
    EXECUTE format($f$
      ALTER POLICY "Reps read own %1$s" ON %1$s
        USING (lead_id IN (SELECT id FROM leads WHERE sales_user_id IN
          (SELECT id FROM sales_users WHERE lower(email) = lower(auth.jwt()->>'email'))));
    $f$, t);
    EXECUTE format($f$
      ALTER POLICY "Reps insert own %1$s" ON %1$s
        WITH CHECK (lead_id IN (SELECT id FROM leads WHERE sales_user_id IN
          (SELECT id FROM sales_users WHERE lower(email) = lower(auth.jwt()->>'email'))));
    $f$, t);
    EXECUTE format($f$
      ALTER POLICY "Reps update own %1$s" ON %1$s
        USING (lead_id IN (SELECT id FROM leads WHERE sales_user_id IN
          (SELECT id FROM sales_users WHERE lower(email) = lower(auth.jwt()->>'email'))));
    $f$, t);
    EXECUTE format($f$
      ALTER POLICY "Reps delete own %1$s" ON %1$s
        USING (lead_id IN (SELECT id FROM leads WHERE sales_user_id IN
          (SELECT id FROM sales_users WHERE lower(email) = lower(auth.jwt()->>'email'))));
    $f$, t);
  END LOOP;
END $$;
