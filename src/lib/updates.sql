-- Add cost_metadata column to stories table
ALTER TABLE stories 
ADD COLUMN IF NOT EXISTS cost_metadata JSONB DEFAULT NULL;

-- Comment for documentation
COMMENT ON COLUMN stories.cost_metadata IS 'Stores exact usage stats (tokens, chars) and calculated cost for the story generation.';

-- SECURITY UPDATES (Lint Fixes)

-- 1. Fix mutable search_path for security functions to prevent search_path hijacking
ALTER FUNCTION public.get_tag_stats() SET search_path = public;
ALTER FUNCTION public.merge_tags(text, text) SET search_path = public;

-- 2. Harden Analytics RLS (Fixes "RLS Policy Always True")
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Enable insert for everyone" ON public.analytics_events;

-- Create strict policy: Anon must send NULL user_id, Auth must send OWN user_id
CREATE POLICY "Strict insert for analytics" 
ON public.analytics_events 
FOR INSERT 
WITH CHECK (
  (auth.role() = 'anon' AND user_id IS NULL) 
  OR 
  (auth.role() = 'authenticated' AND user_id = auth.uid())
);
