-- Re-categorize leads that are NULL or 'Other' into their real sector, from
-- name + description keywords (Georgian + English). The original categorization
-- (20260519020000) only read `industry_raw`, which is NULL for these leads, so
-- 12 of the 18 sector filters (Hotels, Restaurants, Medical, …) were always
-- empty even though the leads exist. This fills them.
--
-- Scope: ONLY leads currently NULL or 'Other' — the confidently-categorized big
-- buckets (Shops/Retail, Construction, Law Firms, Manufacturing, Finance) are
-- left untouched. CASE is priority-ordered (first match wins): most specific
-- first (Medical before Beauty so dental clinics → Medical; Hotels before
-- Restaurants; generic Professional Services last). Reversible via
-- leads_recategorize_backup_20260609. Re-runnable (already-set rows no longer
-- match NULL/'Other').

CREATE TEMP TABLE _recat ON COMMIT DROP AS
SELECT id, industry AS old_industry,
  CASE
    WHEN t ~* 'clinic|pharmac|dental|hospital|კლინიკ|აფთიაქ|სტომატ|საავადმყოფ|სამედიცინ|ლაბორატორ|ამბულატორ|დიაგნოსტიკ' THEN 'Medical / Clinics'
    WHEN t ~* 'hotel|hostel|ჰოტელ|სასტუმრო|ჰოსტელ' THEN 'Hotels'
    WHEN t ~* 'school|university|სკოლა|უნივერსიტეტ|საბავშვო ბაღ|კოლეჯ|აკადემი|სასწავლ|საგანმანათლებლო|ბაგა-ბაღ' THEN 'Education / Schools'
    WHEN t ~* 'logistic|ლოჯისტიკ|transport|ტრანსპორტ|cargo|კარგო|გადაზიდვ|საკურიერ|ექსპედი|გადაზიდ' THEN 'Logistics / Transport'
    WHEN t ~* 'real estate|უძრავი ქონებ|რეალტ|დეველოპმენტ|საცხოვრებელი კომპლექს|არენდ' THEN 'Real Estate'
    WHEN t ~* 'restaurant|რესტორ|კაფე|პიცერ|საკონდიტრო|ფასტფუდ|fast food|bakery|საცხობ' THEN 'Restaurants & Cafes'
    WHEN t ~* 'ონლაინ მაღაზ|ონლაინ-მაღაზ|online shop|e-commerce|ელექტრონული კომერც|ონლაინ მარკეტ' THEN 'E-commerce'
    WHEN t ~* 'beauty|სილამაზ|კოსმეტ|ესთეტიკ|პარიკმახ|მაკიაჟ|ფრჩხილ|სპა-ცენტრ|სოლარიუმ' THEN 'Beauty & Wellness'
    WHEN t ~* 'ავტოსერვის|ავტომრეცხ|სამრეცხაო|ავტონაწილ|ავტოსალონ|car wash|car service|ავტოტექ|სათადარიგო' THEN 'Auto / Car services'
    WHEN t ~* 'software|პროგრამირ|პროგრამულ|ვებ-?საიტ|ვებგვერდ|აპლიკაცი|ინფორმაციული ტექნოლ|კიბერ' THEN 'IT / Tech'
    WHEN t ~* 'marketing|მარკეტინგ|advertising|სარეკლამო|რეკლამის სააგენტ|ბრენდინგ|დიჯიტალ მარკეტ' THEN 'Marketing / Advertising'
    WHEN t ~* 'კონსალტინგ|consulting|ბუღალტ|აუდიტ|ნოტარ|notar|თარჯიმ|translation' THEN 'Professional Services'
    ELSE NULL
  END AS new_industry
FROM (
  SELECT id, industry, coalesce(name, '') || ' ' || coalesce(description, '') AS t
  FROM leads
  WHERE industry IS NULL OR industry = 'Other'
) s;

-- Backup the rows we will change (old + new), before changing them.
CREATE TABLE IF NOT EXISTS leads_recategorize_backup_20260609 (
  lead_id      uuid PRIMARY KEY,
  old_industry text,
  new_industry text,
  backed_up_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO leads_recategorize_backup_20260609 (lead_id, old_industry, new_industry)
SELECT id, old_industry, new_industry FROM _recat WHERE new_industry IS NOT NULL
ON CONFLICT (lead_id) DO NOTHING;

-- Apply. Disable USER triggers so this doesn't bump updated_at / re-fire the
-- score trigger on ~hundreds of rows.
ALTER TABLE leads DISABLE TRIGGER USER;
UPDATE leads l
SET industry = r.new_industry
FROM _recat r
WHERE l.id = r.id AND r.new_industry IS NOT NULL;
ALTER TABLE leads ENABLE TRIGGER USER;

-- ROLLBACK (run by hand if needed):
--   ALTER TABLE leads DISABLE TRIGGER USER;
--   UPDATE leads l SET industry = b.old_industry
--     FROM leads_recategorize_backup_20260609 b WHERE b.lead_id = l.id;
--   ALTER TABLE leads ENABLE TRIGGER USER;
--   DROP TABLE leads_recategorize_backup_20260609;
