-- Phase 2: Add parent_board_slug to board_config to support duplicated boards.
-- Duplicated boards reference the same company pool as their source board.
ALTER TABLE board_config
  ADD COLUMN IF NOT EXISTS parent_board_slug TEXT DEFAULT NULL;
