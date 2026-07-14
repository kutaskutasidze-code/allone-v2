-- Migration: followup_notifications
-- ADDITIVE + zero-risk: one new table, one new nullable column, indexes, RLS.
-- Powers the in-app notification bell + follow-up reminders. A cron scans open
-- tasks whose due_at has passed and, once per task, creates a notification row
-- and emails the rep. tasks.reminded_at is the once-only guard.
-- Mirrors existing conventions (gen_random_uuid, TIMESTAMPTZ DEFAULT NOW(),
-- service-role API access, is_supervisor_or_admin() RLS).

-- once-only guard: set when a follow-up reminder has been delivered for a task
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reminded_at TIMESTAMPTZ;

-- ============================================================ notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_user_id UUID NOT NULL REFERENCES sales_users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'followup_due',
  title TEXT NOT NULL,
  body TEXT,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  href TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- hottest read: "my notifications, newest first" + unread badge count
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON notifications(sales_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(sales_user_id) WHERE read_at IS NULL;

-- Reps read/update their own notifications; staff (admin/supervisor) read all.
-- (API uses the service role, which bypasses RLS — these guard direct client
--  reads, same posture as leads/tasks.)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reps read own notifications" ON notifications;
CREATE POLICY "Reps read own notifications" ON notifications FOR SELECT TO authenticated
  USING (sales_user_id IN (SELECT id FROM sales_users WHERE email = auth.jwt()->>'email'));

DROP POLICY IF EXISTS "Reps update own notifications" ON notifications;
CREATE POLICY "Reps update own notifications" ON notifications FOR UPDATE TO authenticated
  USING (sales_user_id IN (SELECT id FROM sales_users WHERE email = auth.jwt()->>'email'));

DROP POLICY IF EXISTS "Staff read all notifications" ON notifications;
CREATE POLICY "Staff read all notifications" ON notifications FOR SELECT TO authenticated
  USING (is_supervisor_or_admin(auth.jwt()->>'email'));
