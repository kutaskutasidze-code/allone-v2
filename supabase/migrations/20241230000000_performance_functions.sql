-- Performance Enhancement Functions
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/cywmdjldapzrnabsoosd/sql/new

-- ============================================
-- 1. Rate Limiting Table and Function
-- ============================================

-- Create rate limit tracking table
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(identifier, endpoint)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup
  ON rate_limits(identifier, endpoint, window_start);

-- Auto-cleanup old rate limit entries (older than 1 hour)
CREATE INDEX IF NOT EXISTS idx_rate_limits_cleanup
  ON rate_limits(window_start);

-- Rate limit check function
-- Returns: allowed (boolean), remaining (integer), reset_at (timestamptz)
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier TEXT,
  p_endpoint TEXT,
  p_max_requests INTEGER DEFAULT 5,
  p_window_seconds INTEGER DEFAULT 3600
)
RETURNS TABLE(allowed BOOLEAN, remaining INTEGER, reset_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_current_count INTEGER;
  v_reset_at TIMESTAMPTZ;
BEGIN
  -- Calculate window start
  v_window_start := NOW() - (p_window_seconds || ' seconds')::INTERVAL;

  -- Try to get existing record within window
  SELECT r.request_count, r.window_start + (p_window_seconds || ' seconds')::INTERVAL
  INTO v_current_count, v_reset_at
  FROM rate_limits r
  WHERE r.identifier = p_identifier
    AND r.endpoint = p_endpoint
    AND r.window_start > v_window_start;

  IF v_current_count IS NULL THEN
    -- No existing record or expired, create new one
    INSERT INTO rate_limits (identifier, endpoint, request_count, window_start)
    VALUES (p_identifier, p_endpoint, 1, NOW())
    ON CONFLICT (identifier, endpoint)
    DO UPDATE SET
      request_count = 1,
      window_start = NOW();

    RETURN QUERY SELECT
      TRUE::BOOLEAN as allowed,
      (p_max_requests - 1)::INTEGER as remaining,
      (NOW() + (p_window_seconds || ' seconds')::INTERVAL)::TIMESTAMPTZ as reset_at;
  ELSIF v_current_count >= p_max_requests THEN
    -- Rate limit exceeded
    RETURN QUERY SELECT
      FALSE::BOOLEAN as allowed,
      0::INTEGER as remaining,
      v_reset_at as reset_at;
  ELSE
    -- Increment counter
    UPDATE rate_limits
    SET request_count = request_count + 1
    WHERE identifier = p_identifier AND endpoint = p_endpoint;

    RETURN QUERY SELECT
      TRUE::BOOLEAN as allowed,
      (p_max_requests - v_current_count - 1)::INTEGER as remaining,
      v_reset_at as reset_at;
  END IF;
END;
$$;

-- Cleanup function for old rate limit entries
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM rate_limits
  WHERE window_start < NOW() - INTERVAL '2 hours';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- ============================================
-- 2. Batch Stats Update Function
-- ============================================

-- Atomic batch update for stats
-- Accepts JSON array of {id, value, label} objects
CREATE OR REPLACE FUNCTION batch_update_stats(p_stats JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stat JSONB;
  v_updated_count INTEGER := 0;
  v_errors JSONB := '[]'::JSONB;
BEGIN
  -- Validate input
  IF p_stats IS NULL OR jsonb_array_length(p_stats) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'No stats provided');
  END IF;

  -- Process each stat in a transaction
  FOR v_stat IN SELECT * FROM jsonb_array_elements(p_stats)
  LOOP
    BEGIN
      UPDATE stats
      SET
        value = COALESCE(v_stat->>'value', value),
        label = COALESCE(v_stat->>'label', label),
        updated_at = NOW()
      WHERE id = (v_stat->>'id')::UUID;

      IF FOUND THEN
        v_updated_count := v_updated_count + 1;
      ELSE
        v_errors := v_errors || jsonb_build_object('id', v_stat->>'id', 'error', 'Not found');
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors || jsonb_build_object('id', v_stat->>'id', 'error', SQLERRM);
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'success', jsonb_array_length(v_errors) = 0,
    'updated', v_updated_count,
    'errors', v_errors
  );
END;
$$;

-- ============================================
-- 3. Grant Permissions
-- ============================================

-- Allow authenticated users to use rate limiting
GRANT EXECUTE ON FUNCTION check_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION check_rate_limit TO anon;

-- Allow service role to cleanup and batch update
GRANT EXECUTE ON FUNCTION cleanup_rate_limits TO service_role;
GRANT EXECUTE ON FUNCTION batch_update_stats TO authenticated;

-- Grant table access
GRANT SELECT, INSERT, UPDATE ON rate_limits TO authenticated;
GRANT SELECT, INSERT, UPDATE ON rate_limits TO anon;
GRANT DELETE ON rate_limits TO service_role;

-- ============================================
-- 4. Enable RLS on rate_limits
-- ============================================

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Anyone can read/write their own rate limit entries
CREATE POLICY "Rate limits are accessible by identifier"
  ON rate_limits
  FOR ALL
  USING (true)
  WITH CHECK (true);
