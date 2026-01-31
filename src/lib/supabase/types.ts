import { Database } from './database.types';

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// ========================================
// User Profile Types
// ========================================

export type UserProfile = Tables<'profiles'>;
// Note: 'profiles' table must exist in DB. If manual type differs, we should map it.
// Checking previous manual type: seems to include 'subscription_status' etc.
// If valid columns are in DB, this is safe.

// ========================================
// Story Types
// ========================================

export type Story = Tables<'stories'>;

// ========================================
// Collection Types
// ========================================

// ========================================
// Collection Types
// ========================================

export type Collection = Tables<'collections'> & {
    stories?: Story[];
};

// ========================================
// Progress Types
// ========================================

export type ListeningProgress = Tables<'listening_progress'> & {
    stories?: Story;
};

export interface StoryWithProgress extends Story {
    progress_seconds: number;
    progress_percent: number;
}

// ========================================
// Playlist Types
// ========================================

export type Playlist = Tables<'playlists'> & {
    items?: Story[];
    item_count?: number;
};

export type PlaylistItem = Tables<'playlist_items'> & {
    story?: Story;
};

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
