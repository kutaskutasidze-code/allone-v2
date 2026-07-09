-- ============================================================
-- Sales-panel performance: composite indexes for the hot query shapes.
--
-- Background: as lead volume grew (~48k leads, ~5k per rep), the sales list,
-- dashboard, and analytics slowed down. The existing leads indexes are all
-- single-column (sales_user_id, status, created_at, lead_score separately),
-- so the planner could filter on ONE of them but then had to sort/scan the
-- rest of each rep's slice on every request. These composite indexes match
-- the actual WHERE + ORDER BY shapes so those become index-only scans.
--
-- Additive and non-destructive: only CREATE INDEX IF NOT EXISTS. No data is
-- touched; drop any index to revert.
--
-- These are plain (non-CONCURRENT) CREATE INDEX so the whole file can be pasted
-- and run in one go in the Supabase SQL editor (which runs a paste as a single
-- transaction — CONCURRENTLY would be rejected there). A plain build takes a
-- brief write lock on the table (reads are unaffected); at ~48k rows each index
-- builds in well under a second. If you'd rather avoid the write lock entirely,
-- add CONCURRENTLY to each statement and run them ONE AT A TIME instead.
-- ============================================================

-- Main rep list:  WHERE sales_user_id = ?
--                 ORDER BY lead_score DESC NULLS LAST, created_at DESC
-- Eliminates the per-request in-memory sort of the rep's whole slice, and makes
-- the paginated range()/exact-count an index-only scan.
CREATE INDEX IF NOT EXISTS idx_leads_rep_score_created
  ON leads (sales_user_id, lead_score DESC NULLS LAST, created_at DESC);

-- Per-status counts: dashboard stats (7 counts) + analytics byStatus.
CREATE INDEX IF NOT EXISTS idx_leads_rep_status
  ON leads (sales_user_id, status);

-- Per-service counts: analytics byService (5 counts).
CREATE INDEX IF NOT EXISTS idx_leads_rep_service
  ON leads (sales_user_id, matched_service);

-- "Today's queue" count: WHERE sales_user_id = ? AND assigned_at >= midnight.
CREATE INDEX IF NOT EXISTS idx_leads_rep_assigned_at
  ON leads (sales_user_id, assigned_at DESC);

-- "Calls today by me" + won-in-window: filters on status_changed_at per rep.
CREATE INDEX IF NOT EXISTS idx_leads_rep_status_changed
  ON leads (sales_user_id, status_changed_at DESC);

-- Analytics "new in period" + daily trend: WHERE sales_user_id = ? AND created_at >= ?.
CREATE INDEX IF NOT EXISTS idx_leads_rep_created
  ON leads (sales_user_id, created_at DESC);

-- Call KPIs by rep + time window (calls today/week/month, connected).
CREATE INDEX IF NOT EXISTS idx_calls_rep_occurred
  ON calls (sales_user_id, occurred_at DESC);

-- Open follow-up tasks by rep (dashboard followup counts, leads "followups" scope).
CREATE INDEX IF NOT EXISTS idx_tasks_rep_status_due
  ON tasks (sales_user_id, status, due_at);

-- After applying, refresh planner stats so the new indexes are costed correctly:
ANALYZE leads;
ANALYZE calls;
ANALYZE tasks;
