/**
 * Supabase Database Types
 * All interfaces and type definitions for database entities
 */

// ========================================
// User Profile Types
// ========================================

export interface UserProfile {
    id: string;
    email: string;
    username: string | null;
    avatar_url: string | null;
    is_premium: boolean;
    stripe_customer_id?: string;
    subscription_id?: string;
    subscription_status?: string;
    subscription_end_date?: string | null;
    role?: 'user' | 'admin';
    created_at: string;
    // Stats
    total_minutes_listened?: number;
    stories_completed?: number;
    current_streak?: number;
    last_active_date?: string;
    // Waitlist
    waitlist_joined_at?: string | null;
}

// ========================================
// Story Types
// ========================================

export interface Story {
    id: string;
    title: string;
    description: string;
    author: string;
    author_image_url?: string;
    cover_url: string;
    cover_portrait_url?: string;
    cover_landscape_url?: string;
    audio_url: string;
    duration: number;
    category: string;
    tags: string[];
    is_premium: boolean;
    is_published: boolean;
    script_text?: string;
    audio_phases?: any[];
    voice_id?: string;
    social_reel_url?: string;
    social_status?: 'draft' | 'generated' | 'approved' | 'posted';
    cost_metadata?: any;
    created_at: string;
    // V6 Audio Stems
    voice_url?: string | null;
    ambient_url?: string | null;
    music_url?: string | null;
    slug?: string;
}

// ========================================
// Collection Types
// ========================================

export interface Collection {
    id: string;
    title: string;
    slug: string;
    category?: string;
    description: string | null;
    cover_url: string | null;
    cover_portrait_url?: string;
    cover_landscape_url?: string;
    is_featured: boolean;
    is_published: boolean;
    stories?: Story[];
}

// ========================================
// Progress Types
// ========================================

export interface ListeningProgress {
    id: string;
    user_id: string;
    story_id: string;
    progress_seconds: number;
    completed: boolean;
    last_played_at: string;
    stories?: Story;
}

export interface StoryWithProgress extends Story {
    progress_seconds: number;
    progress_percent: number;
}

// ========================================
// Playlist Types
// ========================================

export interface Playlist {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    created_at: string;
    items?: Story[];
    item_count?: number;
    cover_url?: string;
}

export interface PlaylistItem {
    id: string;
    playlist_id: string;
    story_id: string;
    position: number;
    added_at: string;
    story?: Story;
}

// ========================================
// Join Types (for Supabase queries)
// ========================================

export interface CollectionStoryJoin {
    sort_order: number;
    stories: Story | null;
}

export interface CollectionWithJoin extends Omit<Collection, 'stories'> {
    collection_stories?: CollectionStoryJoin[];
    stories?: Story[];
}

export interface FavoriteJoin {
    story_id: string;
    stories: Story | null;
}

export interface ProgressJoin {
    story_id: string;
    progress_seconds: number;
    completed: boolean;
    stories: Story | null;
}

// ========================================
// Admin Types
// ========================================

export interface TagStat {
    tag: string;
    count: number;
}
