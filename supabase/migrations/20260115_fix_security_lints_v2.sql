-- FIX: Security Lints
-- 1. Enable RLS on public tables (rls_disabled_in_public)
ALTER TABLE public.voices ENABLE ROW LEVEL SECURITY;

-- Add policy for public read access to voices (since it's a reference table)
CREATE POLICY "Public read access" ON public.voices
    FOR SELECT USING (true);

-- 2. Fix Security Definer View (security_definer_view)
-- Views should typically execute with the permissions of the invoker (RLS friendly)
CREATE OR REPLACE VIEW poor_retention_stories WITH (security_invoker = true) AS
SELECT story_id, COUNT(*) as drops
FROM public.usage_logs
WHERE action = 'drop_off' AND position_seconds < 30
GROUP BY story_id
ORDER BY drops DESC;
