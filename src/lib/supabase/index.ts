/**
 * Supabase Module Barrel Export
 * Re-exports all modules for backward compatibility
 * 
 * Usage: import { supabase, getStories, UserProfile } from '@/lib/supabase';
 */

// Client & Configuration
export { supabase, isSupabaseConfigured, supabaseUrl, supabaseAnonKey } from './client';

// Types
export type {
    UserProfile,
    Story,
    Collection,
    ListeningProgress,
    StoryWithProgress,
    Playlist,
    PlaylistItem,
    CollectionStoryJoin,
    CollectionWithJoin,
    FavoriteJoin,
    ProgressJoin,
    TagStat
} from './types';

// Auth Functions
export {
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
    signInWithDiscord,
    signInWithApple
} from './auth';

// Stories Functions
export {
    getStories,
    getStoryById,
    getStoryBySlug
} from './stories';

// Profiles Functions
export {
    getProfile,
    createProfile,
    updateProfileStats,
    incrementListeningTime,
    checkAndIncrementStreak,
    incrementStoriesCompleted,
    getAllProfiles,
    updateUserStatus,
    deleteProfile
} from './profiles';

// Collections Functions
export {
    getFeaturedCollections,
    getCollections,
    getCollectionBySlug,
    getCollectionById,
    getAllCollections,
    createCollection,
    updateCollection,
    deleteCollection,
    addStoryToCollection,
    removeStoryFromCollection,
    getCollectionStoriesForAdmin
} from './collections';

// Favorites Functions
export {
    getFavorites,
    toggleFavorite,
    checkIsFavorite
} from './favorites';

// Progress Functions
export {
    getListeningProgress,
    getInProgressStories,
    updateListeningProgress,
    saveListeningProgress
} from './progress';

// Playlists Functions
export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistDetails,
    deletePlaylist,
    addStoryToPlaylist,
    removeStoryFromPlaylist
} from './playlists';

// Admin Functions
export {
    getTagStats,
    mergeTags
} from './admin';
