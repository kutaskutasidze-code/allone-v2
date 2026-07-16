-- Composite lead score (0-100) so the queue prioritizes itself instead of every
-- lead looking the same. Signals: contact completeness (email/phone), source
-- intent (inbound > manual > scraped), scraper relevance, and recency. One SQL
-- statement over the whole `new` pool — cheap enough to refresh from the
-- assign-leads cron. Applied via the Management API on 2026-07-17.
CREATE OR REPLACE FUNCTION rescore_new_leads() RETURNS void LANGUAGE sql AS $fn$
  UPDATE leads SET lead_score = LEAST(100, GREATEST(0,
      (CASE WHEN email IS NOT NULL AND email <> '' THEN 25 ELSE 0 END)
    + (CASE WHEN phone IS NOT NULL AND phone <> '' THEN 20 ELSE 0 END)
    + (CASE
         WHEN source IN ('contact_form','bot','Referral','Website','LinkedIn','wings','web') THEN 30
         WHEN source IN ('manual','manual_import','Cold Call','Other') THEN 12
         ELSE 3 END)
    + LEAST(20, (COALESCE(relevance_score,0) * 2.5))::int
    + (CASE WHEN created_at > now() - interval '7 days' THEN 10 ELSE 0 END)
  ))
  WHERE status = 'new';
$fn$;
