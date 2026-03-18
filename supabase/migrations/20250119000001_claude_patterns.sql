-- Claude Sessions (batch reports)
CREATE TABLE IF NOT EXISTS claude_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(100) NOT NULL,
  duration_mins INT,
  task_type VARCHAR(100),
  tools_used TEXT[],
  tool_counts JSONB DEFAULT '{}',
  outcome VARCHAR(50) DEFAULT 'unknown',
  error_summary TEXT,
  tokens_used INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Claude Patterns (tool combinations)
CREATE TABLE IF NOT EXISTS claude_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence TEXT[] NOT NULL,
  sequence_hash VARCHAR(64) NOT NULL,
  task_type VARCHAR(100),
  success_count INT DEFAULT 0,
  fail_count INT DEFAULT 0,
  total_duration_ms BIGINT DEFAULT 0,
  last_used TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sequence_hash, task_type)
);

-- Session patterns junction (which patterns appeared in which sessions)
CREATE TABLE IF NOT EXISTS claude_session_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES claude_sessions(id) ON DELETE CASCADE,
  pattern_id UUID REFERENCES claude_patterns(id) ON DELETE CASCADE,
  occurrences INT DEFAULT 1,
  succeeded BOOLEAN
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_created ON claude_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_task ON claude_sessions(task_type);
CREATE INDEX IF NOT EXISTS idx_patterns_success ON claude_patterns(success_count DESC);
CREATE INDEX IF NOT EXISTS idx_patterns_hash ON claude_patterns(sequence_hash);
CREATE INDEX IF NOT EXISTS idx_patterns_task ON claude_patterns(task_type);

-- RLS
ALTER TABLE claude_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE claude_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE claude_session_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read sessions" ON claude_sessions FOR SELECT USING (true);
CREATE POLICY "Service insert sessions" ON claude_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read patterns" ON claude_patterns FOR SELECT USING (true);
CREATE POLICY "Service insert patterns" ON claude_patterns FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update patterns" ON claude_patterns FOR UPDATE USING (true);
CREATE POLICY "Public read session_patterns" ON claude_session_patterns FOR SELECT USING (true);
CREATE POLICY "Service insert session_patterns" ON claude_session_patterns FOR INSERT WITH CHECK (true);
