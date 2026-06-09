-- M01 — Full-text search GIN indexes (US-06)
--
-- The unified schema.prisma file documents these indexes as required for
-- search performance but Prisma 5 cannot emit expression-based GIN indexes
-- through @@index, so we manage them with raw SQL applied once.

CREATE INDEX IF NOT EXISTS idx_utterances_text_fts
  ON utterances USING GIN (to_tsvector('english', text));

CREATE INDEX IF NOT EXISTS idx_transcripts_fulltext
  ON transcripts USING GIN (to_tsvector('english', "fullText"));
