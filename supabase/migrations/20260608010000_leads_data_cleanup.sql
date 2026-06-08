-- Reversible leads data cleanup (2026-06-08).
--
-- Backs up the FULL original of every touched row (as jsonb) into
-- leads_cleanup_backup_20260608, then:
--   Tier 1 — delete junk (each row guarded to have NO calls/tasks/meetings/
--     payments, so nothing with real activity is ever removed):
--       • obvious test leads
--       • true duplicates — same phone + name + ADDRESS (keep assigned/oldest).
--         Address must match: chains share one call-center number across branches
--         with different addresses, which are distinct leads, not duplicates.
--       • uncontactable, unassigned, still-'new' leads (no phone/email/site/FB)
--   Tier 2 — field fixes, no deletion:
--       • social URL sitting in `website` → move FB/IG to its own field, then
--         null `website` so the lead correctly reads as "no website"
--       • truncated phones (1–8 digits of junk) → null `phone`
--         (phone_digits is GENERATED, so it recomputes automatically)
--
-- Re-runnable: backup table is created if-not-exists; once applied the predicates
-- no longer match. Rollback notes are at the bottom of this file.

-- ============================================================
-- 0. Backup table — full original rows of everything we touch
-- ============================================================
CREATE TABLE IF NOT EXISTS leads_cleanup_backup_20260608 (
  backup_id      bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cleanup_action text        NOT NULL,
  backed_up_at   timestamptz NOT NULL DEFAULT now(),
  lead_id        uuid        NOT NULL,
  lead           jsonb       NOT NULL
);

-- Resolve the delete set once. Duplicates are matched on EXACT identity
-- (phone + name + address): within each identical group the "best" row
-- (assigned/worked first, then oldest) is kept (rn=1) and the rest are
-- deletable. Matching on phone+name alone is unsafe — chains share one
-- call-center number across branches with DIFFERENT addresses, which are
-- distinct leads. Every candidate must also have zero real activity.
CREATE TEMP TABLE _to_delete ON COMMIT DROP AS
WITH dupes AS (
  SELECT id, row_number() OVER (
    PARTITION BY phone_digits, lower(trim(name)), lower(coalesce(trim(address), ''))
    ORDER BY (sales_user_id IS NOT NULL OR status <> 'new') DESC, created_at ASC
  ) AS rn
  FROM leads
  WHERE phone_digits IS NOT NULL AND length(phone_digits) >= 9
    AND name IS NOT NULL AND name <> ''
)
SELECT l.id,
  CASE
    WHEN l.name ~* '(^test|test fields|test minimal|^123$|^test c website$)' THEN 'delete_test'
    WHEN d.rn > 1 THEN 'delete_dupe'
    ELSE 'delete_uncontactable'
  END AS reason
FROM leads l
LEFT JOIN dupes d ON d.id = l.id
WHERE NOT EXISTS (SELECT 1 FROM calls         x WHERE x.lead_id = l.id)
  AND NOT EXISTS (SELECT 1 FROM tasks         x WHERE x.lead_id = l.id)
  AND NOT EXISTS (SELECT 1 FROM meetings      x WHERE x.lead_id = l.id)
  AND NOT EXISTS (SELECT 1 FROM lead_payments x WHERE x.lead_id = l.id)
  AND (
    l.name ~* '(^test|test fields|test minimal|^123$|^test c website$)'
    OR d.rn > 1
    OR (l.status = 'new' AND l.sales_user_id IS NULL
        AND (l.phone_digits IS NULL OR length(l.phone_digits) < 9)
        AND (l.email IS NULL OR l.email NOT LIKE '%@%.%')
        AND (l.website IS NULL OR l.website = '' OR l.website ILIKE '%infoshop.ge%')
        AND (l.facebook_url IS NULL OR l.facebook_url = ''))
  );

-- ============================================================
-- 1. Snapshot every touched row BEFORE changing anything
-- ============================================================
INSERT INTO leads_cleanup_backup_20260608 (cleanup_action, lead_id, lead)
SELECT td.reason, l.id, to_jsonb(l) FROM leads l JOIN _to_delete td ON td.id = l.id;

INSERT INTO leads_cleanup_backup_20260608 (cleanup_action, lead_id, lead)
SELECT 'fix_website', id, to_jsonb(leads) FROM leads
WHERE website ~* '(facebook\.com|instagram\.com|booking\.com|wa\.me|t\.me|twitter\.com|fb\.com|linktr)'
  AND id NOT IN (SELECT id FROM _to_delete);

INSERT INTO leads_cleanup_backup_20260608 (cleanup_action, lead_id, lead)
SELECT 'fix_phone', id, to_jsonb(leads) FROM leads
WHERE phone_digits IS NOT NULL AND length(phone_digits) BETWEEN 1 AND 8
  AND id NOT IN (SELECT id FROM _to_delete);

-- ============================================================
-- 2. Apply. Disable USER triggers so the field fixes don't bump updated_at on
--    686 leads (FK cascade is unaffected by this — it is not a user trigger).
-- ============================================================
ALTER TABLE leads DISABLE TRIGGER USER;

-- 2a. Tier 1 deletes (junk children cascade away).
DELETE FROM leads WHERE id IN (SELECT id FROM _to_delete);

-- 2b. Tier 2 — reclassify social-URL-as-website. Move FB/IG into their own
--     field first (while `website` still holds the value), then null `website`.
UPDATE leads SET facebook_url = website
  WHERE website ~* '(facebook\.com|fb\.com)' AND (facebook_url IS NULL OR facebook_url = '');
UPDATE leads SET instagram_url = website
  WHERE website ~* 'instagram\.com' AND (instagram_url IS NULL OR instagram_url = '');
UPDATE leads SET website = NULL
  WHERE website ~* '(facebook\.com|instagram\.com|booking\.com|wa\.me|t\.me|twitter\.com|fb\.com|linktr)';

-- 2c. Tier 2 — null truncated junk phones (phone_digits regenerates from phone).
UPDATE leads SET phone = NULL
  WHERE phone_digits IS NOT NULL AND length(phone_digits) BETWEEN 1 AND 8;

ALTER TABLE leads ENABLE TRIGGER USER;

-- ============================================================
-- ROLLBACK (run by hand if ever needed):
--   -- restore deleted leads (phone_digits is generated, so it is excluded):
--   INSERT INTO leads
--   SELECT (jsonb_populate_record(NULL::leads, lead)).* FROM leads_cleanup_backup_20260608
--   WHERE cleanup_action LIKE 'delete%';   -- if this errors on phone_digits,
--   -- insert by explicit column list excluding phone_digits.
--
--   -- restore the field fixes:
--   UPDATE leads l SET website = b.lead->>'website',
--     facebook_url = b.lead->>'facebook_url', instagram_url = b.lead->>'instagram_url'
--   FROM leads_cleanup_backup_20260608 b
--   WHERE b.lead_id = l.id AND b.cleanup_action = 'fix_website';
--   UPDATE leads l SET phone = b.lead->>'phone'
--   FROM leads_cleanup_backup_20260608 b
--   WHERE b.lead_id = l.id AND b.cleanup_action = 'fix_phone';
--
--   -- when satisfied: DROP TABLE leads_cleanup_backup_20260608;
-- ============================================================
