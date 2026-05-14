CREATE TABLE IF NOT EXISTS api_usage (
  api text NOT NULL,
  date date NOT NULL,
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (api, date)
);

CREATE OR REPLACE FUNCTION increment_api_usage(p_api text)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_count integer;
BEGIN
  INSERT INTO api_usage (api, date, count)
  VALUES (p_api, (now() AT TIME ZONE 'UTC')::date, 1)
  ON CONFLICT (api, date)
  DO UPDATE SET count = api_usage.count + 1
  RETURNING count INTO v_count;
  RETURN v_count;
END;
$$;
