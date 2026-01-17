-- Add 'tags' column to stories table for Authorization & Recommendation Engine
ALTER TABLE public.stories 
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Optional: Add index for faster searching if using pg_trgm later
-- CREATE INDEX IF NOT EXISTS idx_stories_tags ON public.stories USING GIN (tags);

-- =============================================
-- ANALYTICS ENGINE (Phase 2)
-- =============================================

CREATE TABLE IF NOT EXISTS public.analytics_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id uuid, -- For tracking anonymous sessions or grouping actions
    event_name text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Users can insert their own events (or anonymous ones)
CREATE POLICY "Enable insert for everyone" ON public.analytics_events FOR INSERT WITH CHECK (true);

-- 2. Only Admins can view analytics (Assuming 'admin' claim or role check logic exists)
-- This implementation depends on your role setup. For now, we restrict to service_role or specific users.
-- CREATE POLICY "Admins can view all" ON public.analytics_events FOR SELECT USING ( ... );


-- =============================================
-- TAG GARDENER (Phase 1)
-- =============================================

-- 1. Get Tag Statistics
-- Returns unique tags and their usage count
CREATE OR REPLACE FUNCTION get_tag_stats()
RETURNS TABLE (tag text, count bigint)
LANGUAGE sql
AS $$
  SELECT 
    t.tag,
    COUNT(*) as count
  FROM public.stories s,
  UNNEST(s.tags) as t(tag)
  GROUP BY t.tag
  ORDER BY count DESC;
$$;

-- 2. Merge Tags
-- Replaces old_tag with new_tag in all stories
CREATE OR REPLACE FUNCTION merge_tags(old_tag text, new_tag text)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  affected_rows int;
BEGIN
  -- Update stories that have the old_tag
  -- Logic: Remove old_tag, Append new_tag (if not exists)
  -- Uses array_remove and array_append, distinct helps avoid duplicates if new_tag was already there?
  -- Actually, array_append allows duplicates? Yes.
  -- Better logic:
  -- 1. Remove old_tag
  -- 2. Add new_tag ONLY if it's not already in the array (to avoid [Sunset, Sunset])
  
  UPDATE public.stories
  SET tags = (array_remove(tags, old_tag) || new_tag)
  WHERE old_tag = ANY(tags) AND NOT (new_tag = ANY(tags));
  
  -- Handle case where NEW tag was ALREADY present (just remove OLD)
  UPDATE public.stories
  SET tags = array_remove(tags, old_tag)
  WHERE old_tag = ANY(tags) AND (new_tag = ANY(tags));
  
END;
$$;
