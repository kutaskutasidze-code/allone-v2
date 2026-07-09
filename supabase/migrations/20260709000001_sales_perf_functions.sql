-- ============================================================
-- Sales-panel performance: server-side aggregate functions.
--
-- These replace "count fan-out" (one round-trip per status/service) and
-- JS-side tallying (pulling every matching row into Node to sum/count) with
-- single GROUP BY queries. Each is a drop-in for an existing code path; the
-- app calls the RPC and falls back to the old path if the function is absent,
-- so applying this migration is safe in any order relative to a deploy.
--
-- All functions are STABLE, read-only, and SECURITY INVOKER (default). They are
-- called from server routes using the service-role key. Additive: DROP FUNCTION
-- to revert.
-- ============================================================

-- Dashboard stats: one row per status with count + summed value, scoped to a
-- rep. Replaces 7 count(head) queries + 2 full value fetches (9 round-trips)
-- in src/app/sales/dashboard/page.tsx :: getLeadStats.
CREATE OR REPLACE FUNCTION sales_lead_stats(p_uid uuid)
RETURNS TABLE (status text, cnt bigint, total_value numeric)
LANGUAGE sql
STABLE
AS $$
  SELECT status, count(*)::bigint AS cnt, coalesce(sum(value), 0)::numeric AS total_value
  FROM leads
  WHERE sales_user_id = p_uid
  GROUP BY status;
$$;

-- Pipeline stage aggregate: count + total value per working-pipeline stage
-- (everything except 'new'). p_uid NULL = all reps (admin funnel); otherwise
-- scoped to one rep. Replaces the fetchAllRows() full-slice pull + JS tally in
-- src/lib/pipeline.ts :: buildPipeline.
CREATE OR REPLACE FUNCTION pipeline_stage_agg(p_uid uuid)
RETURNS TABLE (status text, cnt bigint, total_value numeric)
LANGUAGE sql
STABLE
AS $$
  SELECT status, count(*)::bigint AS cnt, coalesce(sum(value), 0)::numeric AS total_value
  FROM leads
  WHERE status IN ('in_process', 'interested', 'proposal', 'on_hold', 'won', 'lost')
    AND (p_uid IS NULL OR sales_user_id = p_uid)
  GROUP BY status;
$$;

-- Analytics lead aggregates in one round-trip: overview counts, per-status and
-- per-service breakdowns, and the daily-new trend since p_since. Replaces 16
-- count(head) queries + a fetchAllRows() pull of every lead in the period in
-- src/app/api/sales/analytics/route.ts.
--
-- Returns raw byService for ALL non-null matched_service values; the caller
-- keeps the 5 known services and derives "unclassified" = total - sum(known),
-- exactly as the previous code did. Daily-trend keys are UTC dates
-- (YYYY-MM-DD), matching the old `new Date(created_at).toISOString()` bucketing.
CREATE OR REPLACE FUNCTION sales_analytics_leads(p_uid uuid, p_since timestamptz)
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  WITH base AS (
    SELECT status, matched_service, created_at, phone, email
    FROM leads
    WHERE sales_user_id = p_uid
  )
  SELECT jsonb_build_object(
    'total',       (SELECT count(*) FROM base),
    'withPhone',   (SELECT count(*) FROM base WHERE phone IS NOT NULL),
    'withEmail',   (SELECT count(*) FROM base WHERE email IS NOT NULL),
    'newInPeriod', (SELECT count(*) FROM base WHERE created_at >= p_since),
    'byStatus', (
      SELECT coalesce(jsonb_object_agg(status, c), '{}'::jsonb)
      FROM (SELECT status, count(*) AS c FROM base GROUP BY status) s
    ),
    'byService', (
      SELECT coalesce(jsonb_object_agg(matched_service, c), '{}'::jsonb)
      FROM (
        SELECT matched_service, count(*) AS c
        FROM base
        WHERE matched_service IS NOT NULL
        GROUP BY matched_service
      ) s
    ),
    'dailyTrend', (
      SELECT coalesce(jsonb_object_agg(d, c), '{}'::jsonb)
      FROM (
        SELECT to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS d, count(*) AS c
        FROM base
        WHERE created_at >= p_since
        GROUP BY 1
      ) t
    )
  );
$$;
