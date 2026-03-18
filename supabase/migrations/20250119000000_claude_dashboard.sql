-- Claude Dashboard Schema
-- Tracks Claude capabilities, upgrades, and usage analytics

-- ============================================
-- 1. Claude Capabilities Registry
-- ============================================
CREATE TABLE IF NOT EXISTS claude_capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL, -- 'mcp_server', 'skill', 'module', 'tool', 'framework', 'repository'
  source VARCHAR(255),            -- Where it came from (e.g., 'kenkaiii/minimal-claude')
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'deprecated', 'pending'
  version VARCHAR(50),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_claude_capabilities_category ON claude_capabilities(category);
CREATE INDEX IF NOT EXISTS idx_claude_capabilities_status ON claude_capabilities(status);
CREATE INDEX IF NOT EXISTS idx_claude_capabilities_name ON claude_capabilities(name);

-- ============================================
-- 2. Claude Upgrade Events
-- ============================================
CREATE TABLE IF NOT EXISTS claude_upgrades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  capability_id UUID REFERENCES claude_capabilities(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,    -- 'install', 'update', 'remove', 'configure'
  capability_name VARCHAR(255),   -- Denormalized for display when capability deleted
  capability_category VARCHAR(100),
  description TEXT NOT NULL,
  details JSONB DEFAULT '{}',     -- What changed, commands run, etc.
  verified BOOLEAN DEFAULT FALSE, -- Manual verification by admin
  verification_notes TEXT,
  reported_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_claude_upgrades_reported ON claude_upgrades(reported_at DESC);
CREATE INDEX IF NOT EXISTS idx_claude_upgrades_action ON claude_upgrades(action);
CREATE INDEX IF NOT EXISTS idx_claude_upgrades_verified ON claude_upgrades(verified);

-- ============================================
-- 3. Claude Usage Tracking
-- ============================================
CREATE TABLE IF NOT EXISTS claude_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  capability_id UUID REFERENCES claude_capabilities(id) ON DELETE SET NULL,
  capability_name VARCHAR(255) NOT NULL, -- Denormalized for fast queries
  success BOOLEAN DEFAULT TRUE,
  duration_ms INTEGER,
  context TEXT,                   -- What task it was used for
  used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics
CREATE INDEX IF NOT EXISTS idx_claude_usage_capability ON claude_usage(capability_id);
CREATE INDEX IF NOT EXISTS idx_claude_usage_name ON claude_usage(capability_name);
CREATE INDEX IF NOT EXISTS idx_claude_usage_used_at ON claude_usage(used_at DESC);
CREATE INDEX IF NOT EXISTS idx_claude_usage_success ON claude_usage(success);

-- ============================================
-- Triggers for updated_at
-- ============================================
CREATE TRIGGER update_claude_capabilities_updated_at BEFORE UPDATE ON claude_capabilities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE claude_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE claude_upgrades ENABLE ROW LEVEL SECURITY;
ALTER TABLE claude_usage ENABLE ROW LEVEL SECURITY;

-- Admin read/write access (authenticated users)
CREATE POLICY "Admin full access for claude_capabilities" ON claude_capabilities FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access for claude_upgrades" ON claude_upgrades FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access for claude_usage" ON claude_usage FOR ALL USING (auth.role() = 'authenticated');

-- API key access for Claude self-reporting (using service role key)
-- Service role bypasses RLS, so Claude can POST via service role

-- ============================================
-- Seed Initial Capabilities
-- ============================================

-- MCP Servers (9)
INSERT INTO claude_capabilities (name, category, source, status, description, metadata) VALUES
  ('native-access', 'mcp_server', 'built-in', 'active', 'HTTP, email, databases, PDFs, Excel, macOS native (PyObjC), processes, keychain', '{"tools": ["http_request", "email_send", "sqlite_query", "postgres_query", "pdf_read", "excel_read", "macos_run"]}'),
  ('puppeteer-browser', 'mcp_server', 'built-in', 'active', 'Browser automation for JS-heavy sites', '{"tools": ["puppeteer_navigate", "puppeteer_click", "puppeteer_fill", "puppeteer_screenshot"]}'),
  ('filesystem', 'mcp_server', 'built-in', 'active', 'Official MCP file operations', '{"tools": ["read_file", "write_file", "list_directory", "move_file"]}'),
  ('memory', 'mcp_server', 'built-in', 'active', 'Knowledge graph persistent memory', '{"tools": ["create_entities", "create_relations", "search_nodes"]}'),
  ('context7', 'mcp_server', 'built-in', 'active', 'Version-specific documentation lookup', '{"tools": ["resolve_library_id", "query_docs"]}'),
  ('sequentialthinking', 'mcp_server', 'built-in', 'active', 'Structured problem decomposition', '{"tools": ["sequentialthinking"]}'),
  ('notion', 'mcp_server', 'built-in', 'active', 'Notion API integration', '{"tools": ["search", "read_page", "create_page"]}'),
  ('rube', 'mcp_server', 'built-in', 'active', '500+ app integrations via Composio', '{"integrations": 500}'),
  ('everything', 'mcp_server', 'built-in', 'active', 'Reference/test MCP server', '{}')
ON CONFLICT DO NOTHING;

-- Skills - Web (6)
INSERT INTO claude_capabilities (name, category, source, status, description) VALUES
  ('create-nextjs', 'skill', '~/.claude/skills', 'active', 'Create Next.js project'),
  ('create-component', 'skill', '~/.claude/skills', 'active', 'Create React component'),
  ('create-api', 'skill', '~/.claude/skills', 'active', 'Create API endpoint'),
  ('create-landing', 'skill', '~/.claude/skills', 'active', 'Create landing page'),
  ('setup-supabase', 'skill', '~/.claude/skills', 'active', 'Setup Supabase integration'),
  ('setup-auth', 'skill', '~/.claude/skills', 'active', 'Setup authentication')
ON CONFLICT DO NOTHING;

-- Skills - Deploy (3)
INSERT INTO claude_capabilities (name, category, source, status, description) VALUES
  ('deploy-vercel', 'skill', '~/.claude/skills', 'active', 'Deploy to Vercel'),
  ('deploy-cloudflare', 'skill', '~/.claude/skills', 'active', 'Deploy to Cloudflare'),
  ('git-push', 'skill', '~/.claude/skills', 'active', 'Git push workflow')
ON CONFLICT DO NOTHING;

-- Skills - Games (8)
INSERT INTO claude_capabilities (name, category, source, status, description) VALUES
  ('create-phaser-game', 'skill', '~/.claude/skills', 'active', 'Create Phaser game'),
  ('create-kaboom-game', 'skill', '~/.claude/skills', 'active', 'Create Kaboom game'),
  ('create-threejs-game', 'skill', '~/.claude/skills', 'active', 'Create Three.js game'),
  ('create-pixi-game', 'skill', '~/.claude/skills', 'active', 'Create PixiJS game'),
  ('add-game-scene', 'skill', '~/.claude/skills', 'active', 'Add game scene'),
  ('add-game-entity', 'skill', '~/.claude/skills', 'active', 'Add game entity'),
  ('add-game-physics', 'skill', '~/.claude/skills', 'active', 'Add game physics'),
  ('add-game-audio', 'skill', '~/.claude/skills', 'active', 'Add game audio')
ON CONFLICT DO NOTHING;

-- Skills - Automation (5)
INSERT INTO claude_capabilities (name, category, source, status, description) VALUES
  ('native-access-skill', 'skill', '~/.claude/skills', 'active', 'Native access automation'),
  ('device-control', 'skill', '~/.claude/skills', 'active', 'Device control'),
  ('browser-automate', 'skill', '~/.claude/skills', 'active', 'Browser automation'),
  ('web-scrape', 'skill', '~/.claude/skills', 'active', 'Web scraping'),
  ('api-automate', 'skill', '~/.claude/skills', 'active', 'API automation')
ON CONFLICT DO NOTHING;

-- Skills - System (4)
INSERT INTO claude_capabilities (name, category, source, status, description) VALUES
  ('macos-automate', 'skill', '~/.claude/skills', 'active', 'macOS automation'),
  ('file-automate', 'skill', '~/.claude/skills', 'active', 'File automation'),
  ('schedule-task', 'skill', '~/.claude/skills', 'active', 'Task scheduling'),
  ('workflow-automate', 'skill', '~/.claude/skills', 'active', 'Workflow automation')
ON CONFLICT DO NOTHING;

-- Skills - Tools (2)
INSERT INTO claude_capabilities (name, category, source, status, description) VALUES
  ('create-cli', 'skill', '~/.claude/skills', 'active', 'Create CLI tool'),
  ('data-transform', 'skill', '~/.claude/skills', 'active', 'Data transformation')
ON CONFLICT DO NOTHING;

-- KenKaiii Repositories
INSERT INTO claude_capabilities (name, category, source, status, description, metadata) VALUES
  ('minimal-claude', 'repository', 'github.com/KenKaiii/minimal-claude', 'active', 'Claude Code plugin for code quality', '{"commands": ["/setup-code-quality", "/setup-claude-md", "/setup-commits", "/setup-tests", "/setup-updates"]}'),
  ('voice-noob', 'repository', 'github.com/KenKaiii/voice-noob', 'active', 'AI Voice Agent Platform', '{"stack": ["FastAPI", "Next.js", "PostgreSQL", "Redis"]}'),
  ('social-bro', 'repository', 'github.com/KenKaiii/social-bro', 'active', 'Unified social media search + repurposing', '{"stack": ["Next.js", "PostgreSQL", "Prisma"]}'),
  ('n8nboy_workflows', 'repository', 'github.com/KenKaiii/n8nboy_workflows', 'active', '2000+ n8n workflow patterns', '{"workflows": 2000}'),
  ('content-cat', 'repository', 'github.com/KenKaiii/content-cat', 'pending', 'AI Content Generation Platform', '{"stack": ["Next.js", "XYFlow", "PostgreSQL"]}')
ON CONFLICT DO NOTHING;

-- ============================================
-- END OF CLAUDE DASHBOARD SCHEMA
-- ============================================
