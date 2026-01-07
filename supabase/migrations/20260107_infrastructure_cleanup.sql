
-- Migration: 20260107_infrastructure_cleanup
-- Purpose: Remove legacy unused tables and ensure clean state for V4 Factory

-- Drop unused legacy tables
DROP TABLE IF EXISTS social_posts CASCADE;
DROP TABLE IF EXISTS generations CASCADE;
DROP TABLE IF EXISTS prompts CASCADE;
DROP TABLE IF EXISTS rendered_assets CASCADE;
DROP TABLE IF EXISTS users CASCADE; -- If this was a custom users table separate from auth.users

-- Note: We keep 'stories', 'collections', 'profiles' (and 'audio_phases' type if exists)

-- Comment on progress
-- "Infrastructure cleaned. Legacy tables dropped."
