-- Lead Generation System Schema
-- Adds tables for automated lead scraping, email campaigns, and analytics

-- =============================================
-- 1. Lead Sources Configuration Table
-- Tracks data sources for scraping
-- =============================================
CREATE TABLE IF NOT EXISTS lead_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('maps', 'directory', 'jobs', 'registry', 'search', 'manual')),
    base_url TEXT NOT NULL,
    countries TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    scrape_config JSONB DEFAULT '{}',
    last_scraped_at TIMESTAMPTZ,
    leads_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for lead_sources
CREATE INDEX IF NOT EXISTS idx_lead_sources_active ON lead_sources(is_active);
CREATE INDEX IF NOT EXISTS idx_lead_sources_type ON lead_sources(source_type);

-- Update trigger for lead_sources
CREATE TRIGGER update_lead_sources_updated_at
    BEFORE UPDATE ON lead_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 2. Extend Leads Table with Scraping Fields
-- Add columns for automated lead data
-- =============================================
-- Add new columns to existing leads table
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS company_name_local TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS company_size TEXT CHECK (company_size IN ('small', 'medium', 'large', 'enterprise', NULL)),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS matched_service TEXT CHECK (matched_service IN ('chatbots', 'custom_ai', 'automation', 'website', 'consulting', NULL)),
ADD COLUMN IF NOT EXISTS relevance_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS source_id UUID REFERENCES lead_sources(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS source_url TEXT,
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS email_opened_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS email_replied_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_scraped BOOLEAN DEFAULT false;

-- New indexes for extended leads columns
CREATE INDEX IF NOT EXISTS idx_leads_country ON leads(country);
CREATE INDEX IF NOT EXISTS idx_leads_matched_service ON leads(matched_service);
CREATE INDEX IF NOT EXISTS idx_leads_relevance_score ON leads(relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_source_id ON leads(source_id);
CREATE INDEX IF NOT EXISTS idx_leads_is_scraped ON leads(is_scraped);
CREATE INDEX IF NOT EXISTS idx_leads_email_sent ON leads(email_sent_at);
CREATE INDEX IF NOT EXISTS idx_leads_website ON leads(website);

-- =============================================
-- 3. Scrape Jobs Table
-- Track scraping job status and results
-- =============================================
CREATE TABLE IF NOT EXISTS scrape_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES lead_sources(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    search_query TEXT,
    country TEXT,
    city TEXT,
    leads_found INTEGER DEFAULT 0,
    leads_new INTEGER DEFAULT 0,
    leads_duplicate INTEGER DEFAULT 0,
    leads_enriched INTEGER DEFAULT 0,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for scrape_jobs
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_status ON scrape_jobs(status);
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_source ON scrape_jobs(source_id);
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_created ON scrape_jobs(created_at DESC);

-- =============================================
-- 4. Email Campaigns Table
-- Store email campaign configurations
-- =============================================
CREATE TABLE IF NOT EXISTS email_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body_template TEXT NOT NULL,
    target_service TEXT CHECK (target_service IN ('chatbots', 'custom_ai', 'automation', 'website', 'consulting', NULL)),
    target_countries TEXT[] DEFAULT '{}',
    min_relevance_score INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    emails_sent INTEGER DEFAULT 0,
    emails_delivered INTEGER DEFAULT 0,
    emails_opened INTEGER DEFAULT 0,
    emails_clicked INTEGER DEFAULT 0,
    emails_replied INTEGER DEFAULT 0,
    emails_bounced INTEGER DEFAULT 0,
    daily_limit INTEGER DEFAULT 50,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for email_campaigns
CREATE INDEX IF NOT EXISTS idx_email_campaigns_active ON email_campaigns(is_active);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_service ON email_campaigns(target_service);

-- Update trigger for email_campaigns
CREATE TRIGGER update_email_campaigns_updated_at
    BEFORE UPDATE ON email_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 5. Email Logs Table
-- Track individual email sends and events
-- =============================================
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
    email_provider_id TEXT,
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'sending', 'sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'failed', 'unsubscribed')),
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    replied_at TIMESTAMPTZ,
    bounced_at TIMESTAMPTZ,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for email_logs
CREATE INDEX IF NOT EXISTS idx_email_logs_lead ON email_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_campaign ON email_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created ON email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_to_email ON email_logs(to_email);

-- =============================================
-- 6. Email Templates Table
-- Pre-built email templates
-- =============================================
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    target_service TEXT CHECK (target_service IN ('chatbots', 'custom_ai', 'automation', 'website', 'consulting', 'general')),
    language TEXT DEFAULT 'en',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update trigger for email_templates
CREATE TRIGGER update_email_templates_updated_at
    BEFORE UPDATE ON email_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 7. Lead Generation Analytics Table
-- Daily aggregated stats
-- =============================================
CREATE TABLE IF NOT EXISTS lead_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    leads_scraped INTEGER DEFAULT 0,
    leads_enriched INTEGER DEFAULT 0,
    leads_with_email INTEGER DEFAULT 0,
    leads_with_phone INTEGER DEFAULT 0,
    emails_sent INTEGER DEFAULT 0,
    emails_opened INTEGER DEFAULT 0,
    emails_replied INTEGER DEFAULT 0,
    scrape_jobs_run INTEGER DEFAULT 0,
    scrape_jobs_failed INTEGER DEFAULT 0,
    top_source_id UUID REFERENCES lead_sources(id),
    top_country TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for analytics
CREATE INDEX IF NOT EXISTS idx_lead_analytics_date ON lead_analytics(date DESC);

-- =============================================
-- 8. Row Level Security Policies
-- =============================================

-- Enable RLS on new tables
ALTER TABLE lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_analytics ENABLE ROW LEVEL SECURITY;

-- Lead Sources - Authenticated users can manage
CREATE POLICY "Authenticated users can manage lead_sources" ON lead_sources
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Scrape Jobs - Authenticated users can view
CREATE POLICY "Authenticated users can view scrape_jobs" ON scrape_jobs
    FOR SELECT TO authenticated USING (true);

-- Scrape Jobs - Service role can manage
CREATE POLICY "Service role can manage scrape_jobs" ON scrape_jobs
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Email Campaigns - Authenticated users can manage
CREATE POLICY "Authenticated users can manage email_campaigns" ON email_campaigns
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Email Logs - Authenticated users can view
CREATE POLICY "Authenticated users can view email_logs" ON email_logs
    FOR SELECT TO authenticated USING (true);

-- Email Logs - Service role can manage
CREATE POLICY "Service role can manage email_logs" ON email_logs
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Email Templates - Authenticated users can manage
CREATE POLICY "Authenticated users can manage email_templates" ON email_templates
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Lead Analytics - Authenticated users can view
CREATE POLICY "Authenticated users can view lead_analytics" ON lead_analytics
    FOR SELECT TO authenticated USING (true);

-- Lead Analytics - Service role can manage
CREATE POLICY "Service role can manage lead_analytics" ON lead_analytics
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================
-- 9. Seed Default Lead Sources
-- =============================================
INSERT INTO lead_sources (name, source_type, base_url, countries, scrape_config) VALUES
    ('2GIS Kazakhstan', 'maps', 'https://2gis.kz', ARRAY['KZ'], '{"cities": ["Almaty", "Astana", "Shymkent", "Aktobe"]}'),
    ('2GIS Uzbekistan', 'maps', 'https://2gis.uz', ARRAY['UZ'], '{"cities": ["Tashkent", "Samarkand", "Bukhara", "Namangan"]}'),
    ('Yandex Maps Georgia', 'maps', 'https://yandex.com/maps', ARRAY['GE'], '{"cities": ["Tbilisi", "Batumi", "Kutaisi"]}'),
    ('Yandex Maps Armenia', 'maps', 'https://yandex.com/maps', ARRAY['AM'], '{"cities": ["Yerevan", "Gyumri"]}'),
    ('Yandex Maps Azerbaijan', 'maps', 'https://yandex.com/maps', ARRAY['AZ'], '{"cities": ["Baku", "Ganja", "Sumqayit"]}'),
    ('Google Maps Turkey', 'maps', 'https://google.com/maps', ARRAY['TR'], '{"cities": ["Istanbul", "Ankara", "Izmir", "Antalya", "Bursa"]}'),
    ('HeadHunter Kazakhstan', 'jobs', 'https://hh.kz', ARRAY['KZ'], '{"type": "hiring_companies"}'),
    ('HeadHunter Uzbekistan', 'jobs', 'https://hh.uz', ARRAY['UZ'], '{"type": "hiring_companies"}'),
    ('Kariyer.net Turkey', 'jobs', 'https://kariyer.net', ARRAY['TR'], '{"type": "hiring_companies"}'),
    ('Clutch.co', 'directory', 'https://clutch.co', ARRAY['KZ', 'UZ', 'GE', 'TR', 'AM', 'AZ'], '{"type": "tech_companies"}'),
    ('Manual Import', 'manual', '', ARRAY['KZ', 'UZ', 'GE', 'TR', 'AM', 'AZ'], '{"type": "csv_import"}')
ON CONFLICT DO NOTHING;

-- =============================================
-- 10. Seed Default Email Templates
-- =============================================
INSERT INTO email_templates (name, description, subject, body, target_service, language) VALUES
(
    'AI Chatbot Pitch - English',
    'Cold email for companies that need customer support automation',
    'Automate {{company}} Customer Support with AI',
    E'Hi,\n\nI noticed {{company}} handles customer interactions and wanted to share how AI chatbots are helping similar companies in {{country}}:\n\n• 94% of customer queries resolved automatically\n• Available 24/7 in multiple languages\n• Reduces support costs by 60%\n\nWould a 15-minute call to explore this make sense?\n\nBest regards,\nAllone Team\n\n---\nUnsubscribe: {{unsubscribe_link}}',
    'chatbots',
    'en'
),
(
    'Workflow Automation Pitch - English',
    'Cold email for logistics/manufacturing companies',
    'Streamline {{company}} Operations with Automation',
    E'Hi,\n\nCompanies in {{industry}} like {{company}} often struggle with manual data entry and disconnected tools.\n\nOur workflow automation has helped businesses:\n• Eliminate 80% of manual data entry\n• Connect existing tools seamlessly\n• Reduce operational errors by 95%\n\nInterested in seeing how this could work for {{company}}?\n\nBest regards,\nAllone Team\n\n---\nUnsubscribe: {{unsubscribe_link}}',
    'automation',
    'en'
),
(
    'Custom AI Pitch - English',
    'Cold email for fintech/healthcare companies',
    'Custom AI Solutions for {{company}}',
    E'Hi,\n\n{{company}} operates in {{industry}} - a sector where AI is creating massive efficiency gains.\n\nWe''ve helped similar companies:\n• Automate document processing by 90%\n• Build predictive models for better decisions\n• Extract insights from unstructured data\n\nWould you be open to a brief conversation about how AI could benefit {{company}}?\n\nBest regards,\nAllone Team\n\n---\nUnsubscribe: {{unsubscribe_link}}',
    'custom_ai',
    'en'
),
(
    'Website Development Pitch - English',
    'Cold email for hotels/restaurants/startups',
    'Modern Website for {{company}}',
    E'Hi,\n\nI came across {{company}} and noticed an opportunity to strengthen your online presence.\n\nWe build high-performance websites that:\n• Load in under 2 seconds\n• Convert visitors into customers\n• Work beautifully on all devices\n• Include AI-powered features\n\nWould you like to see examples of what we''ve built for businesses like yours?\n\nBest regards,\nAllone Team\n\n---\nUnsubscribe: {{unsubscribe_link}}',
    'website',
    'en'
),
(
    'AI Consulting Pitch - English',
    'Cold email for enterprise companies',
    'AI Strategy for {{company}}',
    E'Hi,\n\nAs {{company}} continues to grow, having a clear AI strategy becomes essential for maintaining competitive advantage.\n\nWe help enterprises:\n• Identify high-impact AI opportunities\n• Build implementation roadmaps\n• Train teams on AI best practices\n• Measure and optimize ROI\n\nWould a strategic conversation about AI at {{company}} be valuable?\n\nBest regards,\nAllone Team\n\n---\nUnsubscribe: {{unsubscribe_link}}',
    'consulting',
    'en'
)
ON CONFLICT DO NOTHING;

-- =============================================
-- 11. Functions for Analytics
-- =============================================

-- Function to update daily analytics
CREATE OR REPLACE FUNCTION update_lead_analytics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO lead_analytics (date, leads_scraped)
    VALUES (CURRENT_DATE, 1)
    ON CONFLICT (date)
    DO UPDATE SET
        leads_scraped = lead_analytics.leads_scraped + 1,
        leads_with_email = (
            SELECT COUNT(*) FROM leads
            WHERE DATE(created_at) = CURRENT_DATE AND email IS NOT NULL
        ),
        leads_with_phone = (
            SELECT COUNT(*) FROM leads
            WHERE DATE(created_at) = CURRENT_DATE AND phone IS NOT NULL
        );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update analytics when lead is inserted
CREATE TRIGGER trigger_update_lead_analytics
    AFTER INSERT ON leads
    FOR EACH ROW
    WHEN (NEW.is_scraped = true)
    EXECUTE FUNCTION update_lead_analytics();

-- Function to get campaign stats
CREATE OR REPLACE FUNCTION get_campaign_stats(campaign_uuid UUID)
RETURNS TABLE (
    total_sent BIGINT,
    total_delivered BIGINT,
    total_opened BIGINT,
    total_clicked BIGINT,
    total_replied BIGINT,
    total_bounced BIGINT,
    open_rate NUMERIC,
    click_rate NUMERIC,
    reply_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) FILTER (WHERE status IN ('sent', 'delivered', 'opened', 'clicked', 'replied')) as total_sent,
        COUNT(*) FILTER (WHERE status IN ('delivered', 'opened', 'clicked', 'replied')) as total_delivered,
        COUNT(*) FILTER (WHERE status IN ('opened', 'clicked', 'replied')) as total_opened,
        COUNT(*) FILTER (WHERE status IN ('clicked', 'replied')) as total_clicked,
        COUNT(*) FILTER (WHERE status = 'replied') as total_replied,
        COUNT(*) FILTER (WHERE status = 'bounced') as total_bounced,
        CASE
            WHEN COUNT(*) FILTER (WHERE status IN ('delivered', 'opened', 'clicked', 'replied')) > 0
            THEN ROUND(COUNT(*) FILTER (WHERE status IN ('opened', 'clicked', 'replied'))::NUMERIC /
                 COUNT(*) FILTER (WHERE status IN ('delivered', 'opened', 'clicked', 'replied'))::NUMERIC * 100, 2)
            ELSE 0
        END as open_rate,
        CASE
            WHEN COUNT(*) FILTER (WHERE status IN ('opened', 'clicked', 'replied')) > 0
            THEN ROUND(COUNT(*) FILTER (WHERE status IN ('clicked', 'replied'))::NUMERIC /
                 COUNT(*) FILTER (WHERE status IN ('opened', 'clicked', 'replied'))::NUMERIC * 100, 2)
            ELSE 0
        END as click_rate,
        CASE
            WHEN COUNT(*) FILTER (WHERE status IN ('sent', 'delivered', 'opened', 'clicked', 'replied')) > 0
            THEN ROUND(COUNT(*) FILTER (WHERE status = 'replied')::NUMERIC /
                 COUNT(*) FILTER (WHERE status IN ('sent', 'delivered', 'opened', 'clicked', 'replied'))::NUMERIC * 100, 2)
            ELSE 0
        END as reply_rate
    FROM email_logs
    WHERE campaign_id = campaign_uuid;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Comments
-- =============================================
COMMENT ON TABLE lead_sources IS 'Configuration for data sources used in lead scraping';
COMMENT ON TABLE scrape_jobs IS 'Tracking for individual scraping jobs';
COMMENT ON TABLE email_campaigns IS 'Email outreach campaign configurations';
COMMENT ON TABLE email_logs IS 'Individual email send records and tracking events';
COMMENT ON TABLE email_templates IS 'Pre-built email templates for different services';
COMMENT ON TABLE lead_analytics IS 'Daily aggregated statistics for lead generation';
