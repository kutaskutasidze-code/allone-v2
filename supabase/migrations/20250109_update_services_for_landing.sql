-- Migration: Add new fields to services table for landing page content
-- This allows editing service card text from admin panel while keeping animations

-- Add new columns to services table
ALTER TABLE services
ADD COLUMN IF NOT EXISTS subtitle TEXT,
ADD COLUMN IF NOT EXISTS secondary_description TEXT,
ADD COLUMN IF NOT EXISTS stats JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS footer_text TEXT,
ADD COLUMN IF NOT EXISTS cta_text VARCHAR(100),
ADD COLUMN IF NOT EXISTS cta_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS card_type VARCHAR(50);

-- Add comment for documentation
COMMENT ON COLUMN services.subtitle IS 'Short headline displayed below title (e.g., "Conversations that actually help")';
COMMENT ON COLUMN services.secondary_description IS 'Additional description paragraph';
COMMENT ON COLUMN services.stats IS 'Array of stat objects: [{value: "94%", label: "Resolution rate"}]';
COMMENT ON COLUMN services.footer_text IS 'Footer text for cards that have it';
COMMENT ON COLUMN services.cta_text IS 'CTA button text (e.g., "Book a free call")';
COMMENT ON COLUMN services.cta_url IS 'CTA button URL';
COMMENT ON COLUMN services.card_type IS 'Card layout type: chatbot, custom_ai, workflow, website, consulting';

-- Insert/Update the 5 default services for the landing page
-- Use ON CONFLICT to update if they exist, insert if not

-- Clear existing services first (optional - comment out if you want to preserve existing)
-- DELETE FROM services;

-- Insert the 5 service cards with all content
INSERT INTO services (title, description, icon, subtitle, secondary_description, stats, features, footer_text, cta_text, cta_url, card_type, display_order, is_published)
VALUES
  (
    'AI Chatbots & Assistants',
    'Context-aware, helpful, human. Our AI learns your business and resolves issues 24/7.',
    'MessageSquare',
    'Conversations that actually help.',
    NULL,
    '[{"value": "94%", "label": "Resolution rate"}, {"value": "<2s", "label": "Response time"}]'::jsonb,
    ARRAY['Support', 'Sales', 'Onboarding'],
    NULL,
    NULL,
    NULL,
    'chatbot',
    1,
    true
  ),
  (
    'Custom AI Solutions',
    'Tailored models trained on your data. From document analysis to predictive insights.',
    'Brain',
    NULL,
    'We build AI systems that understand your specific domain, integrate with your existing tools, and deliver actionable results.',
    '[{"value": "10x", "label": "Faster processing"}, {"value": "94%", "label": "Accuracy"}, {"value": "24/7", "label": "Availability"}]'::jsonb,
    ARRAY['NLP', 'Vision', 'Predictions'],
    NULL,
    NULL,
    NULL,
    'custom_ai',
    2,
    true
  ),
  (
    'Workflow Automation',
    'We connect your existing tools into seamless automated pipelines. No more manual data entry or missed handoffs.',
    'Workflow',
    NULL,
    NULL,
    '[]'::jsonb,
    ARRAY[]::text[],
    'Connect your tools. Data flows automatically.',
    NULL,
    NULL,
    'workflow',
    3,
    true
  ),
  (
    'Website Development',
    'Beautiful, responsive interfaces that load instantly and convert visitors into customers.',
    'Code',
    NULL,
    'We craft pixel-perfect designs with modern frameworks. SEO-optimized, accessible, and built for performance.',
    '[]'::jsonb,
    ARRAY['Next.js', 'React', 'Tailwind', 'Vercel'],
    NULL,
    NULL,
    NULL,
    'website',
    4,
    true
  ),
  (
    'Strategy & Consulting',
    'Not sure what you need? We''ll map out your AI journey—from first idea to full deployment.',
    'Settings',
    NULL,
    NULL,
    '[]'::jsonb,
    ARRAY[]::text[],
    NULL,
    'Book a free call →',
    '/contact',
    'consulting',
    5,
    true
  )
ON CONFLICT (id) DO NOTHING;
