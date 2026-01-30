/**
 * Supabase - Backward Compatibility Export
 * 
 * This file re-exports everything from the modular structure
 * to maintain compatibility with existing imports.
 * 
 * All 45+ files that import from '@/lib/supabase' will continue to work.
 * 
 * For new code, you can import directly from the modules:
 * - import { supabase } from '@/lib/supabase/client';
 * - import { getStories } from '@/lib/supabase/stories';
 */

export * from './supabase/index';
