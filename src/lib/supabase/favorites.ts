/**
 * Supabase Favorites Helpers
 * User favorites management
 */

import { supabase } from './client';
import type { Story, FavoriteJoin } from './types';

// ========================================
// Favorites Operations
// ========================================

export async function getFavorites(userId: string): Promise<Story[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('favorites')
        .select('story_id, stories (*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching favorites:', error);
        return [];
    }

    const stories = (data as unknown as FavoriteJoin[])
        .map((item) => item.stories)
        .filter((s): s is Story => s != null);

    return stories;
}

export async function toggleFavorite(userId: string, storyId: string): Promise<boolean> {
    if (!supabase) return false;

    const { data } = await supabase
        .from('favorites')
        .select('*')
        .match({ user_id: userId, story_id: storyId })
        .single();

    if (data) {
        const { error } = await supabase
            .from('favorites')
            .delete()
            .match({ user_id: userId, story_id: storyId });

        return error ? false : false; // Returns current state (false = not favorite)
    } else {
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

    if (error && error.code !== 'PGRST116') {
        console.error("Error checking favorite:", error);
    }

    return !!data;
}
