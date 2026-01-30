/**
 * Supabase Client Configuration
 * Central module for Supabase client initialization
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Create browser client for client-side usage
 * Uses SSR package for proper cookie persistence
 */
const createSupabaseBrowserClient = () =>
    createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

/**
 * Supabase client singleton
 * - Uses browser client on client-side for cookie persistence
 * - Falls back to standard client for server-side data fetching
 */
export const supabase: SupabaseClient | null =
    typeof window !== 'undefined'
        ? createSupabaseBrowserClient()
        : supabaseUrl && supabaseAnonKey
            ? createClient(supabaseUrl, supabaseAnonKey)
            : null;

if (!supabase) console.error('Supabase client failed to initialize');

/**
 * Check if Supabase is properly configured
 */
export const isSupabaseConfigured = !!supabase;

// Export URL and keys for modules that need direct access
export { supabaseUrl, supabaseAnonKey };
