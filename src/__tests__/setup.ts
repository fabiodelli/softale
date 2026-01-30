import { vi } from 'vitest';

// Mock Supabase Env Vars
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

// Mock Supabase module
vi.mock('@/lib/supabase/client', () => ({
    supabase: {
        auth: {
            signUp: vi.fn(),
            signInWithPassword: vi.fn(),
            signOut: vi.fn(),
            signInWithOAuth: vi.fn(),
        },
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                order: vi.fn(() => ({ data: [], error: null })),
                eq: vi.fn(() => ({ single: vi.fn(() => ({ data: null, error: null })) })),
            })),
        })),
    },
    isSupabaseConfigured: true,
}));

// Mock ResizeObserver for UI components
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));
