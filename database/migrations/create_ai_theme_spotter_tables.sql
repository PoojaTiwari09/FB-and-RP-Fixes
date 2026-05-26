-- AI Theme Spotter Tables Migration
-- Run after create_ai_smart_tracker_tables.sql

-- Theme Analysis Jobs
CREATE TABLE IF NOT EXISTS theme_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255) NOT NULL,
  business_question TEXT NOT NULL,
  filters JSONB DEFAULT '{}',
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  call_count_analyzed INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Detected Themes
CREATE TABLE IF NOT EXISTS themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES theme_analyses(id) ON DELETE CASCADE,
  tenant_id VARCHAR(255) NOT NULL,
  name VARCHAR(500) NOT NULL,
  summary TEXT,
  call_count INTEGER DEFAULT 0,
  account_count INTEGER DEFAULT 0,
  associated_revenue DECIMAL(15,2) DEFAULT 0,
  confidence_score DECIMAL(5,4) DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING_REVIEW',
  detection_source VARCHAR(100) DEFAULT 'GROQ_AI',
  trend VARCHAR(50) DEFAULT 'STABLE',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Representative Quotes per Theme
CREATE TABLE IF NOT EXISTS theme_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id UUID REFERENCES themes(id) ON DELETE CASCADE,
  tenant_id VARCHAR(255) NOT NULL,
  conversation_id VARCHAR(255),
  snippet TEXT NOT NULL,
  speaker_side VARCHAR(50) DEFAULT 'any',
  confidence_score DECIMAL(5,4) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Alert Configurations per Theme
CREATE TABLE IF NOT EXISTS theme_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id UUID REFERENCES themes(id) ON DELETE CASCADE,
  tenant_id VARCHAR(255) NOT NULL,
  condition_type VARCHAR(100) DEFAULT 'COUNT_THRESHOLD',
  threshold_value INTEGER DEFAULT 10,
  time_window_days INTEGER DEFAULT 7,
  is_active BOOLEAN DEFAULT TRUE,
  last_triggered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_theme_analyses_tenant ON theme_analyses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_themes_analysis ON themes(analysis_id);
CREATE INDEX IF NOT EXISTS idx_themes_tenant ON themes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_themes_status ON themes(status);
CREATE INDEX IF NOT EXISTS idx_theme_quotes_theme ON theme_quotes(theme_id);
CREATE INDEX IF NOT EXISTS idx_theme_alerts_theme ON theme_alerts(theme_id);
CREATE INDEX IF NOT EXISTS idx_theme_alerts_tenant ON theme_alerts(tenant_id);
