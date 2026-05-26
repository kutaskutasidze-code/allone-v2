-- Sales → Personalized Demo Pipeline
-- Spec: docs/superpowers/specs/2026-05-25-sales-demo-pipeline-design.md
--
-- Adds the data model required to turn a lead into a deployed personalized
-- demo + audit + drafted email, then surface it for one-click human-review send.

-- ============================================================================
-- 1. Extend leads with enrichment fields
-- ============================================================================

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS segment TEXT,
  ADD COLUMN IF NOT EXISTS company_spec JSONB,
  ADD COLUMN IF NOT EXISTS enrichment_status TEXT DEFAULT 'pending'
    CHECK (enrichment_status IN ('pending', 'enriching', 'enriched', 'failed'));

CREATE INDEX IF NOT EXISTS idx_leads_segment ON leads(segment);
CREATE INDEX IF NOT EXISTS idx_leads_enrichment_status ON leads(enrichment_status);

-- ============================================================================
-- 2. reference_templates — pre-cloned best-in-segment sites
-- ============================================================================

CREATE TABLE IF NOT EXISTS reference_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_label TEXT,
  pre_cloned_path TEXT NOT NULL,
  aesthetic_tier INTEGER NOT NULL DEFAULT 3 CHECK (aesthetic_tier BETWEEN 1 AND 5),
  xfly_check_score INTEGER CHECK (xfly_check_score BETWEEN 0 AND 100),
  ref_map_path TEXT,
  last_refreshed_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reference_templates_segment
  ON reference_templates(segment) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_reference_templates_tier
  ON reference_templates(aesthetic_tier DESC) WHERE is_active;

-- ============================================================================
-- 3. demo_jobs — one row per pipeline run for a lead
-- ============================================================================

CREATE TABLE IF NOT EXISTS demo_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  sales_user_id UUID REFERENCES sales_users(id) ON DELETE SET NULL,
  reference_template_id UUID REFERENCES reference_templates(id) ON DELETE SET NULL,

  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN (
    'queued',
    'enriching',
    'skinning',
    'wiring_admin',
    'deploying',
    'auditing',
    'drafting',
    'draft_ready',
    'sent',
    'expired',
    'deleted',
    'failed'
  )),
  current_phase TEXT,
  progress INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  phase_history JSONB NOT NULL DEFAULT '[]'::jsonb,

  demo_url TEXT,
  demo_vercel_project_id TEXT,
  demo_supabase_org_id UUID,

  audit_results JSONB,
  email_draft_id UUID,

  error_message TEXT,

  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  engagement_count INTEGER NOT NULL DEFAULT 0,
  last_engaged_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_demo_jobs_status ON demo_jobs(status);
CREATE INDEX IF NOT EXISTS idx_demo_jobs_lead ON demo_jobs(lead_id);
CREATE INDEX IF NOT EXISTS idx_demo_jobs_sales_user ON demo_jobs(sales_user_id);
CREATE INDEX IF NOT EXISTS idx_demo_jobs_expires
  ON demo_jobs(expires_at) WHERE status NOT IN ('expired', 'deleted');

CREATE TRIGGER update_demo_jobs_updated_at
  BEFORE UPDATE ON demo_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. email_drafts — staged emails awaiting sales-user send
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  demo_job_id UUID REFERENCES demo_jobs(id) ON DELETE SET NULL,
  sales_user_id UUID REFERENCES sales_users(id) ON DELETE SET NULL,
  email_template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,

  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  variables JSONB,

  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'revoked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_email_drafts_status ON email_drafts(status);
CREATE INDEX IF NOT EXISTS idx_email_drafts_lead ON email_drafts(lead_id);
CREATE INDEX IF NOT EXISTS idx_email_drafts_demo_job ON email_drafts(demo_job_id);

-- Back-link from demo_jobs.email_draft_id (added now that email_drafts exists)
ALTER TABLE demo_jobs
  ADD CONSTRAINT fk_demo_jobs_email_draft
  FOREIGN KEY (email_draft_id) REFERENCES email_drafts(id) ON DELETE SET NULL;

-- ============================================================================
-- 5. Extend email_templates with segment + source + variable declarations
-- ============================================================================

ALTER TABLE email_templates
  ADD COLUMN IF NOT EXISTS segment TEXT,
  ADD COLUMN IF NOT EXISTS lead_source TEXT,
  ADD COLUMN IF NOT EXISTS swap_variables JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_email_templates_segment_source
  ON email_templates(segment, lead_source);

-- ============================================================================
-- 6. demo_engagements — opens + clicks; feeds engagement_count + expiry extension
-- ============================================================================

CREATE TABLE IF NOT EXISTS demo_engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demo_job_id UUID NOT NULL REFERENCES demo_jobs(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('email_open', 'demo_view', 'admin_view')),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_demo_engagements_job ON demo_engagements(demo_job_id);
CREATE INDEX IF NOT EXISTS idx_demo_engagements_occurred ON demo_engagements(occurred_at DESC);

-- ============================================================================
-- 7. Engagement-driven expiry extension trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION extend_demo_expiry() RETURNS TRIGGER AS $$
BEGIN
  UPDATE demo_jobs
  SET engagement_count = engagement_count + 1,
      last_engaged_at = NEW.occurred_at,
      expires_at = GREATEST(
        COALESCE(expires_at, NEW.occurred_at),
        NEW.occurred_at + INTERVAL '14 days'
      )
  WHERE id = NEW.demo_job_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER demo_engagement_extends_expiry
  AFTER INSERT ON demo_engagements
  FOR EACH ROW EXECUTE FUNCTION extend_demo_expiry();

-- ============================================================================
-- 8. Row Level Security — default deny, sales_users by role
-- ============================================================================

ALTER TABLE reference_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_engagements ENABLE ROW LEVEL SECURITY;

-- reference_templates — all sales users can read, only admins write
CREATE POLICY "Sales users can read reference templates" ON reference_templates
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sales_users
      WHERE email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Admins can manage reference templates" ON reference_templates
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sales_users
      WHERE email = auth.jwt()->>'email' AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sales_users
      WHERE email = auth.jwt()->>'email' AND role = 'admin'
    )
  );

-- demo_jobs — sales users see jobs for their own leads
CREATE POLICY "Sales users can read own demo jobs" ON demo_jobs
  FOR SELECT TO authenticated
  USING (
    lead_id IN (
      SELECT id FROM leads
      WHERE sales_user_id IN (
        SELECT id FROM sales_users WHERE email = auth.jwt()->>'email'
      )
    )
  );

CREATE POLICY "Sales users can update own demo jobs" ON demo_jobs
  FOR UPDATE TO authenticated
  USING (
    lead_id IN (
      SELECT id FROM leads
      WHERE sales_user_id IN (
        SELECT id FROM sales_users WHERE email = auth.jwt()->>'email'
      )
    )
  );

-- email_drafts — same scope as demo_jobs
CREATE POLICY "Sales users can read own email drafts" ON email_drafts
  FOR SELECT TO authenticated
  USING (
    lead_id IN (
      SELECT id FROM leads
      WHERE sales_user_id IN (
        SELECT id FROM sales_users WHERE email = auth.jwt()->>'email'
      )
    )
  );

CREATE POLICY "Sales users can update own email drafts" ON email_drafts
  FOR UPDATE TO authenticated
  USING (
    lead_id IN (
      SELECT id FROM leads
      WHERE sales_user_id IN (
        SELECT id FROM sales_users WHERE email = auth.jwt()->>'email'
      )
    )
  );

-- demo_engagements — write-only from public tracking endpoints (service role),
-- read-only for sales users on their own demos
CREATE POLICY "Sales users can read own demo engagements" ON demo_engagements
  FOR SELECT TO authenticated
  USING (
    demo_job_id IN (
      SELECT id FROM demo_jobs
      WHERE lead_id IN (
        SELECT id FROM leads
        WHERE sales_user_id IN (
          SELECT id FROM sales_users WHERE email = auth.jwt()->>'email'
        )
      )
    )
  );

-- Service role bypass for pipeline writes is implicit (RLS doesn't apply to service_role).

-- ============================================================================
-- 9. Helper view — current demo state per lead, for /sales/leads/[id]
-- ============================================================================

CREATE OR REPLACE VIEW lead_current_demo AS
SELECT DISTINCT ON (l.id)
  l.id                          AS lead_id,
  dj.id                         AS demo_job_id,
  dj.status                     AS demo_status,
  dj.current_phase,
  dj.progress,
  dj.demo_url,
  dj.audit_results,
  dj.email_draft_id,
  dj.expires_at,
  dj.engagement_count,
  dj.created_at                 AS demo_created_at
FROM leads l
LEFT JOIN demo_jobs dj ON dj.lead_id = l.id
ORDER BY l.id, dj.created_at DESC NULLS LAST;
