-- Lead scoring: rank leads by fit for Allone's services (websites / chatbots /
-- AI automation / apps), so reps work the hottest first. Rules-based v1 over
-- existing fields (free, deterministic); a Groq description-intent layer can be
-- added later. Score 0-100 = web-presence gap + industry fit + reachability +
-- info richness. Also stores a recommended service (pitch hook) + a reason.
-- Idempotent (re-runnable).

ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_score integer;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS recommended_service text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS score_reason text;
CREATE INDEX IF NOT EXISTS idx_leads_lead_score ON leads(lead_score DESC NULLS LAST);

-- 0-100 fit score. No website is the core opportunity (we sell websites); a
-- real phone = reachable; a substantive listing description = a real, workable
-- business. (Georgian description/tags intent is deferred to the Groq layer.)
CREATE OR REPLACE FUNCTION compute_lead_score(
  p_website text, p_industry text, p_phone text,
  p_facebook_url text, p_instagram_url text, p_description text
) RETURNS integer LANGUAGE sql IMMUTABLE AS $$
  SELECT LEAST(100, GREATEST(0,
      -- web-presence gap (35)
      (CASE WHEN p_website IS NULL OR p_website = '' THEN 35 ELSE 5 END)
      -- industry fit (≤30)
    + (CASE
         WHEN p_industry ILIKE '%retail%' OR p_industry ILIKE '%shop%' THEN 30
         WHEN p_industry ILIKE '%financ%' OR p_industry ILIKE '%insur%' THEN 26
         WHEN p_industry ILIKE '%law%' THEN 22
         WHEN p_industry ILIKE '%construc%' THEN 18
         WHEN p_industry ILIKE '%manufact%' OR p_industry ILIKE '%production%' THEN 18
         WHEN p_industry ILIKE '%other%' THEN 8
         ELSE 4 END)
      -- reachability (≤20): a phone with ≥7 real digits is callable (incl. landlines)
    + (CASE WHEN length(regexp_replace(coalesce(p_phone,''), '[^0-9]', '', 'g')) >= 7 THEN 14 ELSE 0 END)
    + (CASE WHEN (p_facebook_url IS NOT NULL AND p_facebook_url <> '')
              OR (p_instagram_url IS NOT NULL AND p_instagram_url <> '') THEN 6 ELSE 0 END)
      -- info richness (≤15): a fleshed-out listing = a real, researchable business
    + (CASE WHEN char_length(coalesce(p_description,'')) >= 60 THEN 15
            WHEN char_length(coalesce(p_description,'')) > 0 THEN 7 ELSE 0 END)
  ));
$$;

-- The service to lead the pitch with. No website → sell a website (+ the
-- industry's strongest add-on); already has one → the add-on alone.
CREATE OR REPLACE FUNCTION recommend_service(p_website text, p_industry text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN p_website IS NULL OR p_website = '' THEN
      CASE
        WHEN p_industry ILIKE '%retail%' OR p_industry ILIKE '%shop%' THEN 'Website + chatbot'
        WHEN p_industry ILIKE '%financ%' OR p_industry ILIKE '%insur%'
          OR p_industry ILIKE '%law%' OR p_industry ILIKE '%construc%'
          OR p_industry ILIKE '%manufact%' OR p_industry ILIKE '%production%' THEN 'Website + automation'
        ELSE 'Website'
      END
    ELSE
      CASE
        WHEN p_industry ILIKE '%retail%' OR p_industry ILIKE '%shop%' THEN 'Chatbot'
        WHEN p_industry ILIKE '%financ%' OR p_industry ILIKE '%insur%'
          OR p_industry ILIKE '%law%' OR p_industry ILIKE '%construc%'
          OR p_industry ILIKE '%manufact%' OR p_industry ILIKE '%production%' THEN 'AI automation'
        ELSE 'Chatbot or automation'
      END
  END;
$$;

CREATE OR REPLACE FUNCTION lead_score_reason(
  p_website text, p_industry text, p_phone text, p_description text
) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT concat_ws(' · ',
    CASE WHEN p_website IS NULL OR p_website = '' THEN 'No website' ELSE 'Has website' END,
    NULLIF(coalesce(p_industry,''), ''),
    CASE WHEN length(regexp_replace(coalesce(p_phone,''), '[^0-9]', '', 'g')) >= 7 THEN 'reachable' ELSE 'no phone' END,
    CASE WHEN char_length(coalesce(p_description,'')) >= 60 THEN 'detailed listing' ELSE NULL END
  );
$$;

-- Auto-score new leads + re-score when a scoring input changes.
CREATE OR REPLACE FUNCTION leads_set_score() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.lead_score := compute_lead_score(NEW.website, NEW.industry, NEW.phone, NEW.facebook_url, NEW.instagram_url, NEW.description);
  NEW.recommended_service := recommend_service(NEW.website, NEW.industry);
  NEW.score_reason := lead_score_reason(NEW.website, NEW.industry, NEW.phone, NEW.description);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_leads_set_score ON leads;
CREATE TRIGGER trg_leads_set_score
  BEFORE INSERT OR UPDATE OF website, industry, phone, facebook_url, instagram_url, description ON leads
  FOR EACH ROW EXECUTE FUNCTION leads_set_score();

-- Backfill all existing leads. Disable USER triggers so this mass update does
-- not bump updated_at / re-run assigned_at on 25k rows. (RI/FK triggers stay on.)
ALTER TABLE leads DISABLE TRIGGER USER;
UPDATE leads SET
  lead_score = compute_lead_score(website, industry, phone, facebook_url, instagram_url, description),
  recommended_service = recommend_service(website, industry),
  score_reason = lead_score_reason(website, industry, phone, description);
ALTER TABLE leads ENABLE TRIGGER USER;
