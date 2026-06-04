-- Duplicate-merge support.
-- An audit table + an ATOMIC merge_leads() function that re-points EVERY foreign
-- key referencing leads(id) onto the kept lead, snapshots the source for recovery,
-- then deletes the source — all in one transaction. Dynamic FK discovery means a
-- new child table can never be silently orphaned by a merge.

CREATE TABLE IF NOT EXISTS public.lead_merge_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL,
  target_id uuid NOT NULL,
  merged_by text,
  source_snapshot jsonb NOT NULL,
  merged_at timestamptz NOT NULL DEFAULT now()
);

-- Touched only by service-role endpoints; RLS on with no policy = no direct
-- anon/authenticated access.
ALTER TABLE public.lead_merge_audit ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.merge_leads(p_source uuid, p_target uuid, p_actor text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_source public.leads;
  r record;
BEGIN
  IF p_source = p_target THEN
    RAISE EXCEPTION 'source and target lead are the same';
  END IF;

  SELECT * INTO v_source FROM public.leads WHERE id = p_source;
  IF NOT FOUND THEN RAISE EXCEPTION 'source lead % not found', p_source; END IF;

  PERFORM 1 FROM public.leads WHERE id = p_target;
  IF NOT FOUND THEN RAISE EXCEPTION 'target lead % not found', p_target; END IF;

  -- Snapshot the source BEFORE any change (recoverable audit).
  INSERT INTO public.lead_merge_audit (source_id, target_id, merged_by, source_snapshot)
  VALUES (p_source, p_target, p_actor, to_jsonb(v_source));

  -- Re-point every single-column FK that references leads(id) onto the target,
  -- so deleting the source can't cascade-delete or orphan any child rows.
  FOR r IN
    SELECT con.conrelid::regclass::text AS tbl, att.attname AS col
    FROM pg_constraint con
    JOIN pg_attribute att
      ON att.attrelid = con.conrelid AND att.attnum = con.conkey[1]
    WHERE con.contype = 'f'
      AND con.confrelid = 'public.leads'::regclass
      AND array_length(con.conkey, 1) = 1
  LOOP
    EXECUTE format('UPDATE %s SET %I = $1 WHERE %I = $2', r.tbl, r.col, r.col)
    USING p_target, p_source;
  END LOOP;

  -- Fill gaps on the kept lead from the source (only where the target is empty).
  UPDATE public.leads t SET
    email        = COALESCE(t.email, v_source.email),
    phone        = COALESCE(t.phone, v_source.phone),
    company      = COALESCE(NULLIF(t.company, ''), v_source.company),
    website      = COALESCE(t.website, v_source.website),
    industry     = COALESCE(t.industry, v_source.industry),
    city         = COALESCE(t.city, v_source.city),
    facebook_url = COALESCE(t.facebook_url, v_source.facebook_url),
    source_url   = COALESCE(t.source_url, v_source.source_url),
    notes        = COALESCE(NULLIF(t.notes, ''), v_source.notes),
    value        = CASE WHEN COALESCE(t.value, 0) = 0 THEN v_source.value ELSE t.value END,
    updated_at   = now()
  WHERE t.id = p_target;

  DELETE FROM public.leads WHERE id = p_source;
END;
$$;
