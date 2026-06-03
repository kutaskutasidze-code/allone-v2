-- Migration: seed_admin_roles
-- Represent the current admins (the ADMIN_EMAILS allowlist in src/middleware.ts) as
-- sales_users rows with role='admin', so authorization can move off the email allowlist
-- onto sales_users.role. Idempotent and NON-DESTRUCTIVE: inserts a row if missing,
-- otherwise PROMOTES an existing row to admin — it never overwrites name/target/etc.
-- and never deletes a row.
--
-- REQUIRES: 20260603000000_role_authority.sql applied first (so role='admin' is permitted).
-- >>> TAKE A FULL SUPABASE DATABASE BACKUP BEFORE APPLYING (if not already taken). <<<
--
-- !!! VERIFY THE EMAIL LIST BEFORE APPLYING !!!
-- This mirrors the *fallback* allowlist hardcoded in src/middleware.ts. If the
-- ADMIN_EMAILS env var is set in Vercel with a different or larger set, ADD those
-- emails here too — any admin omitted here will lose access at the Phase 8 cutover
-- (when the allowlist is removed).

INSERT INTO sales_users (email, name, role) VALUES
  ('nikoloz.gaprindashvili@allonelabs.com', 'Nikoloz Gaprindashvili', 'admin'),
  ('luka.tsulukidze@allonelabs.com',        'Luka Tsulukidze',        'admin'),
  ('luka.adamia@allonelabs.com',            'Luka Adamia',            'admin'),
  ('team@allonelabs.com',                   'Allone Team',            'admin'),
  ('lizi.nodia@allonelabs.com',             'Lizi Nodia',             'admin')
ON CONFLICT (email) DO UPDATE
  SET role = 'admin'
  WHERE sales_users.role <> 'admin';   -- promote-only; other columns untouched

-- VERIFY (run after; expect ZERO rows = every allowlisted email is now an admin):
--   SELECT a.email FROM (VALUES
--     ('nikoloz.gaprindashvili@allonelabs.com'),
--     ('luka.tsulukidze@allonelabs.com'),
--     ('luka.adamia@allonelabs.com'),
--     ('team@allonelabs.com'),
--     ('lizi.nodia@allonelabs.com')
--   ) AS a(email)
--   EXCEPT
--   SELECT email FROM sales_users WHERE role = 'admin';
--
--   -- Confirm the full admin set is exactly who you expect:
--   SELECT email, name, role FROM sales_users WHERE role = 'admin' ORDER BY email;
--
-- ROLLBACK: prefer restoring from the pre-migration backup (clean). A manual demote
-- is imperfect because we don't record each email's prior role:
--   UPDATE sales_users SET role = 'salesperson'
--   WHERE email IN ('nikoloz.gaprindashvili@allonelabs.com','luka.tsulukidze@allonelabs.com',
--     'luka.adamia@allonelabs.com','team@allonelabs.com','lizi.nodia@allonelabs.com');
