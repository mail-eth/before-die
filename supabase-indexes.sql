-- ============================================================
-- Before Die — Database Indexes & Optimizations
-- Run this in Supabase SQL Editor to add performance indexes
-- ============================================================

-- ── Indexes ─────────────────────────────────────────────────

-- Composite index for the main query: filter by status + sort by created_at
-- This covers: SELECT ... WHERE status = 'published' ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_dreams_status_created_at
ON public.dreams (status, created_at DESC);

-- Index on created_at alone for cursor-based pagination
CREATE INDEX IF NOT EXISTS idx_dreams_created_at
ON public.dreams (created_at DESC);

-- Index on language for bilingual filtering
CREATE INDEX IF NOT EXISTS idx_dreams_language
ON public.dreams (language);

-- ── Table Statistics ─────────────────────────────────────────
-- Update table statistics for query planner
ANALYZE public.dreams;

-- ── Optional: Add updated_at trigger ────────────────────────
-- Keep updated_at in sync when records are modified
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_dreams_updated_at ON public.dreams;
CREATE TRIGGER update_dreams_updated_at
  BEFORE UPDATE ON public.dreams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Verification ──────────────────────────────────────────────
-- Check existing indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'dreams';
