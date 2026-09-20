-- Migration: Add display_order column to club_members
-- Lower number = appears first. NULL = not yet ordered (falls to end, sorted by created_at).
ALTER TABLE public.club_members
  ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT NULL;

-- Index for fast ORDER BY
CREATE INDEX IF NOT EXISTS idx_club_members_display_order
  ON public.club_members (display_order ASC NULLS LAST, created_at ASC);
