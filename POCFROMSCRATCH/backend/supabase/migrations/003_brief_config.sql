-- Phase 4: Add brief_type and brief_period_days to board_config
ALTER TABLE board_config
  ADD COLUMN IF NOT EXISTS brief_type TEXT NOT NULL DEFAULT 'full',
  ADD COLUMN IF NOT EXISTS brief_period_days INT NOT NULL DEFAULT 30;
