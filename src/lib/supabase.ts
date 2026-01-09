import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ========================================
// Supabase Client Configuration
// ========================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Checking Supabase config:', { url: !!supabaseUrl, key: !!supabaseAnonKey });

// Create client only if both env vars are set
import { createSupabaseBrowserClient } from './supabase-browser';

// Create client only if both env vars are set
// Use Browser Client for Client-Side to ensure Cookie persistence for Auth
export const supabase: SupabaseClient | null =
    typeof window !== 'undefined'
        ? createSupabaseBrowserClient()
        : supabaseUrl && supabaseAnonKey
            ? createClient(supabaseUrl, supabaseAnonKey) // Fallback for pure server-side (data fetching only)
            : null;

if (!supabase) console.error('Supabase client failed to initialize');

// Check if Supabase is configured
export const isSupabaseConfigured = !!supabase;

// ========================================
// Auth Helpers
// ========================================

export async function signUp(email: string, password: string) {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
}

export async function signIn(email: string, password: string) {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
}

export async function signOut() {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

// ... (import is already at the top)

export async function signInWithGoogle() {
    const supabaseBrowser = createSupabaseBrowserClient();
    const { data, error } = await supabaseBrowser.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${window.location.origin}/auth/callback`,
        },
    });
    if (error) throw error;
    return data;
}

export async function signInWithDiscord() {
    const supabaseBrowser = createSupabaseBrowserClient();
    const { data, error } = await supabaseBrowser.auth.signInWithOAuth({
        provider: 'discord',
        options: {
            redirectTo: `${window.location.origin}/auth/callback`,
        },
    });
    if (error) throw error;
    return data;
}

// ========================================
// Database Types
// ========================================

export interface UserProfile {
    id: string;
    email: string;
    username: string | null;
    avatar_url: string | null;
    is_premium: boolean;
    role?: 'user' | 'admin';
    created_at: string;
}

export interface Story {
    id: string;
    title: string;
    description: string;
    author: string;
    cover_url: string;
    cover_portrait_url?: string; // Vertical (2:3)
    cover_landscape_url?: string; // Horizontal (16:9)
    audio_url: string;
    duration: number; // in seconds
    category: string;
    tags: string[];
    is_premium: boolean;
    is_published: boolean; // Added in previous steps, ensuring it's here
    script_text?: string;
    audio_phases?: any[];
    voice_id?: string; // ElevenLabs voice ID used for narration
    social_reel_url?: string;
    social_status?: 'draft' | 'generated' | 'approved' | 'posted';
    created_at: string;
}

export interface Collection {
    id: string;
    title: string;
    slug: string;
    category?: string; // Optional for now
    description: string | null;
    cover_url: string | null;
    cover_portrait_url?: string;
    cover_landscape_url?: string;
    is_featured: boolean;
    is_published: boolean;
    stories?: Story[]; // Joined stories
}

export interface ListeningProgress {
    id: string;
    user_id: string;
    story_id: string;
    progress_seconds: number;
    completed: boolean;
    last_played_at: string;
    stories?: Story; // Joined Story data
}

// ========================================
// Database Helpers
// ========================================

export async function getProfile(userId: string, accessToken?: string): Promise<UserProfile | null> {
    try {
        if (!supabaseUrl || !supabaseAnonKey) return null;

        const headers: Record<string, string> = {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${accessToken || supabaseAnonKey}`
        };

        const res = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=*`, {
            headers
        });

        if (!res.ok) {
            console.error('Profile fetch error:', res.statusText);
            return null;
        }

        const data = await res.json();
        return data?.[0] || null;
    } catch (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
}

export async function getStories(categories?: string[], includeUnpublished: boolean = false): Promise<Story[]> {
    if (!supabase) return [];
    let query = supabase.from('stories').select('*').order('created_at', { ascending: false });

    if (categories && categories.length > 0) {
        // If 'all' is passed (legacy or intentional), we skip filtering, but usually we pass specific list
        if (!categories.includes('all')) {
            query = query.in('category', categories);
        }
    }

    // Only show published stories unless includeUnpublished is true (for admin)
    if (!includeUnpublished) {
        query = query.eq('is_published', true);
    }
    const { data, error } = await query;
    if (error) {
        console.error('Error fetching stories:', error);
        return [];
    }
    return data || [];
}

export async function getStoryById(id: string): Promise<Story | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching story:', error);
        return null;
    }
    return data;
}

export async function getListeningProgress(userId: string): Promise<ListeningProgress[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
        .from('listening_progress')
        .select('*, stories(*)')
        .eq('user_id', userId)
        .order('last_played_at', { ascending: false }); // Most recent first

    if (error) {
        console.error('Error fetching progress:', error);
        return [];
    }

    // Flatten/check data structure if needed, but Supabase returns { ...progress, stories: { ...story } }
    return data || [];
}

export async function updateListeningProgress(
    userId: string,
    storyId: string,
    progressSeconds: number,
    completed: boolean = false
): Promise<void> {
    if (!supabase) return;
    await supabase
        .from('listening_progress')
        .upsert({
            user_id: userId,
            story_id: storyId,
            progress_seconds: progressSeconds,
            completed,
            last_played_at: new Date().toISOString(),
        }, {
            onConflict: 'user_id,story_id'
        });
}

// ========================================
// Collection Helpers
// ========================================

export async function getFeaturedCollections(): Promise<Collection[]> {
    if (!supabase) return [];

    // 1. Fetch collections
    const { data: collections, error } = await supabase
        .from('collections')
        .select(`
            *,
            collection_stories (
                sort_order,
                stories (*)
            )
        `)
        .eq('is_featured', true)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching featured collections:', error);
        return [];
    }

    // 2. Transform nested structure
    // Supabase returns: { ...collection, collection_stories: [{sort_order, stories: {...}}, ...] }
    // We want: { ...collection, stories: [Story, Story...] }

    const formatted: Collection[] = collections.map((col: any) => {
        const sortedStories = (col.collection_stories || [])
            .sort((a: any, b: any) => a.sort_order - b.sort_order)
            .map((item: any) => item.stories)
            .filter((s: any) => s && s.is_published);

        return {
            ...col,
            stories: sortedStories
        };
    });

    return formatted;
}

export async function getCollections(category?: string): Promise<Collection[]> {
    if (!supabase) return [];

    let query = supabase
        .from('collections')
        .select(`
            *,
            collection_stories (
                sort_order,
                stories (*)
            )
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

    if (category && category !== 'all') {
        query = query.eq('category', category);
    }

    const { data: collections, error } = await query;

    if (error) {
        console.error('Error fetching collections:', error);
        return [];
    }

    // Transform nested structure (reuse logic if possible, but duplicating for safety in this snippet)
    const formatted: Collection[] = collections.map((col: any) => {
        const sortedStories = (col.collection_stories || [])
            .sort((a: any, b: any) => a.sort_order - b.sort_order)
            .map((item: any) => item.stories)
            .filter((s: any) => s && s.is_published);

        return {
            ...col,
            stories: sortedStories
        };
    });

    return formatted;
}

export async function getCollectionBySlug(slug: string): Promise<Collection | null> {
    if (!supabase) return null;

    // 1. Get Collection
    const { data: collection, error } = await supabase
        .from('collections')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error || !collection) {
        console.error('Error fetching collection:', error);
        return null;
    }

    // 2. Get Stories with sort order
    // We join collection_stories -> stories
    const { data: junctionData, error: junctionError } = await supabase
        .from('collection_stories')
        .select(`
            sort_order,
            stories:stories (*)
        `)
        .eq('collection_id', collection.id)
        .order('sort_order', { ascending: true });

    if (junctionError) {
        console.error('Error fetching collection stories:', junctionError);
        return collection;
    }

    // Transform result: flatten the array
    const stories = junctionData
        .map((item: any) => item.stories)
        .filter((story: any) => story !== null && (story.is_published === true)); // Ensure only published stories

    return { ...collection, stories };
}

export async function getCollectionById(id: string): Promise<Collection | null> {
    if (!supabase) return null;

    // Validate UUID format to prevent DB errors if a slug is passed
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) return null;

    // 1. Get Collection
    const { data: collection, error } = await supabase
        .from('collections')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !collection) {
        console.error('Error fetching collection by id:', error);
        return null;
    }

    // 2. Get Stories with sort order
    const { data: junctionData, error: junctionError } = await supabase
        .from('collection_stories')
        .select(`
            sort_order,
            stories:stories (*)
        `)
        .eq('collection_id', collection.id)
        .order('sort_order', { ascending: true });

    if (junctionError) {
        console.error('Error fetching collection stories:', junctionError);
        return collection;
    }

    // Transform result
    const stories = junctionData
        .map((item: any) => item.stories)
        .filter((story: any) => story !== null && (story.is_published === true));

    return { ...collection, stories };
}

// ========================================
// Admin Helpers
// ========================================

export async function getAllProfiles(): Promise<UserProfile[]> {
    if (!supabase) return [];

    // RLS Note: This will only return rows visible to the user.
    // If the user is 'admin' (and we set up the policy right), they should see all.
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching all profiles:', error);
        return [];
    }
    return data || [];
}

export async function updateUserStatus(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

    if (error) {
        console.error('Error updating user:', error);
        return false;
    }
    return true;
}

export async function deleteProfile(userId: string): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

    if (error) {
        console.error('Error deleting profile:', error);
        return false;
    }
    return true;
}

// Admin: Collections
export async function getAllCollections(): Promise<Collection[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('collections')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching all collections:', error);
        return [];
    }
    return data || [];
}

export async function createCollection(collection: Partial<Collection>): Promise<Collection | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('collections')
        .insert(collection)
        .select()
        .single();

    if (error) {
        console.error('Error creating collection:', error);
        return null;
    }
    return data;
}

export async function updateCollection(id: string, updates: Partial<Collection>): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
        .from('collections')
        .update(updates)
        .eq('id', id);

    if (error) {
        console.error('Error updating collection:', error);
        return false;
    }
    return true;
}

export async function deleteCollection(id: string): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase.from('collections').delete().eq('id', id);
    if (error) return false;
    return true;
}

// Admin: Collection Stories Management
export async function addStoryToCollection(collectionId: string, storyId: string, sortOrder: number = 0): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase
        .from('collection_stories')
        .insert({ collection_id: collectionId, story_id: storyId, sort_order: sortOrder });

    if (error) {
        console.error('Error adding story to collection:', error);
        return false;
    }
    return true;
}

export async function removeStoryFromCollection(collectionId: string, storyId: string): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase
        .from('collection_stories')
        .delete()
        .match({ collection_id: collectionId, story_id: storyId });

    if (error) {
        console.error('Error removing story from collection:', error);
        return false;
    }
    return true;
}

export async function getCollectionStoriesForAdmin(collectionId: string): Promise<any[]> {
    if (!supabase) return [];

    // Returns junction info too
    const { data, error } = await supabase
        .from('collection_stories')
        .select(`
            *,
            stories:stories (id, title, is_published)
        `)
        .eq('collection_id', collectionId)
        .order('sort_order', { ascending: true });

    if (error) return [];
    return data || [];
}

// ========================================
// Favorites Helpers
// ========================================

export async function getFavorites(userId: string): Promise<Story[]> {
    if (!supabase) return [];

    // Join favorites -> stories
    const { data, error } = await supabase
        .from('favorites')
        .select('story_id, stories (*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching favorites:', error);
        return [];
    }

    // Transform result: flatten structure
    // data is [{ story_id, stories: Story }, ...]
    const stories = data
        .map((item: any) => item.stories)
        .filter((s: any) => s != null); // Remove any nulls if story was deleted

    return stories;
}

export async function toggleFavorite(userId: string, storyId: string): Promise<boolean> {
    if (!supabase) return false;

    // Check if exists
    const { data } = await supabase
        .from('favorites')
        .select('*')
        .match({ user_id: userId, story_id: storyId })
        .single();

    if (data) {
        // Remove
        const { error } = await supabase
            .from('favorites')
            .delete()
            .match({ user_id: userId, story_id: storyId });

        return error ? false : false; // Returns current state (false = not favorite)
    } else {
        // Add
        const { error } = await supabase
            .from('favorites')
            .insert({ user_id: userId, story_id: storyId });

        return error ? false : true; // Returns current state (true = favorite)
    }
}

export async function checkIsFavorite(userId: string, storyId: string): Promise<boolean> {
    if (!supabase) return false;

    const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .match({ user_id: userId, story_id: storyId })
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found" which is fine
        console.error("Error checking favorite:", error);
    }

    return !!data;
}

// ========================================
// Listening Progress Helpers
// ========================================

export interface StoryWithProgress extends Story {
    progress_seconds: number;
    progress_percent: number;
}

export async function getInProgressStories(userId: string): Promise<StoryWithProgress[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('listening_progress')
        .select('story_id, progress_seconds, completed, stories (*)')
        .eq('user_id', userId)
        .eq('completed', false)
        .gt('progress_seconds', 10) // Only show if listened for more than 10 seconds
        .order('last_played_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error fetching in-progress stories:', error);
        return [];
    }

    // Transform and calculate progress percentage
    return data
        .filter((item: any) => item.stories != null)
        .map((item: any) => ({
            ...item.stories,
            progress_seconds: item.progress_seconds,
            progress_percent: Math.round((item.progress_seconds / item.stories.duration) * 100)
        }));
}

export async function saveListeningProgress(
    userId: string,
    storyId: string,
    progressSeconds: number,
    completed: boolean = false
): Promise<void> {
    if (!supabase) return;

    const { error } = await supabase
        .from('listening_progress')
        .upsert({
            user_id: userId,
            story_id: storyId,
            progress_seconds: progressSeconds,
            completed,
            last_played_at: new Date().toISOString()
        }, {
            onConflict: 'user_id,story_id'
        });

    if (error) {
        console.error('Error saving listening progress:', error);
    }
}
