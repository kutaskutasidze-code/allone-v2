-- Migration: activity_tables  (Phase 2, step B)
-- ADDITIVE + zero-risk: pure CREATE TABLE/VIEW/TRIGGER. No existing data touched.
-- First-class activity records (calls/tasks/meetings) for the per-lead Stream and
-- real rep metrics. Mirrors existing conventions (gen_random_uuid, TIMESTAMPTZ
-- DEFAULT NOW(), update_updated_at_column(), is_supervisor_or_admin() RLS).
-- FK policy: lead_id -> CASCADE (matches lead_status_history/demo_jobs/email_drafts);
-- sales_user_id -> SET NULL (matches leads.sales_user_id — a removed rep must not
-- delete their call history, which feeds metrics).

-- ============================================================ calls
CREATE TABLE IF NOT EXISTS calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  sales_user_id UUID REFERENCES sales_users(id) ON DELETE SET NULL,
  direction TEXT NOT NULL DEFAULT 'outbound' CHECK (direction IN ('outbound','inbound')),
  outcome TEXT NOT NULL CHECK (outcome IN
    ('connected','no_answer','voicemail','busy','wrong_number','callback_requested','not_interested')),
  duration_seconds INTEGER CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  notes TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  external_call_id TEXT,   -- telephony-ready (unused for manual logging)
  recording_url TEXT,      -- telephony-ready
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_calls_lead      ON calls(lead_id);
CREATE INDEX IF NOT EXISTS idx_calls_user_time ON calls(sales_user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_occurred  ON calls(occurred_at DESC);
DROP TRIGGER IF EXISTS update_calls_updated_at ON calls;
CREATE TRIGGER update_calls_updated_at BEFORE UPDATE ON calls
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================ tasks (follow-ups)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  sales_user_id UUID REFERENCES sales_users(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Follow up',
  due_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','done','cancelled')),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- hottest read: "my open follow-ups due/overdue"
CREATE INDEX IF NOT EXISTS idx_tasks_user_due ON tasks(sales_user_id, due_at) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_tasks_lead     ON tasks(lead_id);
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- auto-stamp completed_at on done (modeled on set_lead_won_at)
CREATE OR REPLACE FUNCTION set_task_completed_at() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'done' AND OLD.status IS DISTINCT FROM 'done' THEN
    NEW.completed_at := COALESCE(NEW.completed_at, NOW());
  ELSIF NEW.status <> 'done' THEN
    NEW.completed_at := NULL;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_set_task_completed_at ON tasks;
CREATE TRIGGER trg_set_task_completed_at BEFORE INSERT OR UPDATE OF status ON tasks
  FOR EACH ROW EXECUTE FUNCTION set_task_completed_at();

-- ============================================================ meetings (lighter)
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  sales_user_id UUID REFERENCES sales_users(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Meeting',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','held','no_show','cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_meetings_lead      ON meetings(lead_id);
CREATE INDEX IF NOT EXISTS idx_meetings_user_time ON meetings(sales_user_id, starts_at DESC);
DROP TRIGGER IF EXISTS update_meetings_updated_at ON meetings;
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================ RLS
-- Reps manage activity for leads they own; staff (admin/supervisor) read all.
-- (API uses the service role, which bypasses RLS — these guard direct client reads,
--  same posture as the leads table.)
ALTER TABLE calls    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['calls','tasks','meetings'] LOOP
    EXECUTE format($f$
      CREATE POLICY "Reps read own %1$s" ON %1$s FOR SELECT TO authenticated
        USING (lead_id IN (SELECT id FROM leads WHERE sales_user_id IN
          (SELECT id FROM sales_users WHERE email = auth.jwt()->>'email')));
    $f$, t);
    EXECUTE format($f$
      CREATE POLICY "Reps insert own %1$s" ON %1$s FOR INSERT TO authenticated
        WITH CHECK (lead_id IN (SELECT id FROM leads WHERE sales_user_id IN
          (SELECT id FROM sales_users WHERE email = auth.jwt()->>'email')));
    $f$, t);
    EXECUTE format($f$
      CREATE POLICY "Reps update own %1$s" ON %1$s FOR UPDATE TO authenticated
        USING (lead_id IN (SELECT id FROM leads WHERE sales_user_id IN
          (SELECT id FROM sales_users WHERE email = auth.jwt()->>'email')));
    $f$, t);
    EXECUTE format($f$
      CREATE POLICY "Reps delete own %1$s" ON %1$s FOR DELETE TO authenticated
        USING (lead_id IN (SELECT id FROM leads WHERE sales_user_id IN
          (SELECT id FROM sales_users WHERE email = auth.jwt()->>'email')));
    $f$, t);
    EXECUTE format($f$
      CREATE POLICY "Staff read all %1$s" ON %1$s FOR SELECT TO authenticated
        USING (is_supervisor_or_admin(auth.jwt()->>'email'));
    $f$, t);
  END LOOP;
END $$;

-- ============================================================ unified stream view
CREATE OR REPLACE VIEW lead_activity_stream
WITH (security_invoker = on) AS
  SELECT 'call'::text    AS kind, id, lead_id, sales_user_id, occurred_at AS at, outcome AS subtype, notes FROM calls
  UNION ALL
  SELECT 'task'::text,    id, lead_id, sales_user_id, COALESCE(completed_at, due_at, created_at), status, notes FROM tasks
  UNION ALL
  SELECT 'meeting'::text, id, lead_id, sales_user_id, starts_at, status, notes FROM meetings;

-- VERIFY: SELECT count(*) FROM calls; FROM tasks; FROM meetings;  -- all 0
--   Insert+ROLLBACK one of each to confirm CHECKs.
-- ROLLBACK:
--   DROP VIEW IF EXISTS lead_activity_stream;
--   DROP TABLE IF EXISTS meetings, tasks, calls CASCADE;
--   DROP FUNCTION IF EXISTS set_task_completed_at();
