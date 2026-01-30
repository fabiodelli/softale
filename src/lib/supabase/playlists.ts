/**
 * Supabase Playlists Helpers
 * User playlist management
 */

import { supabase } from './client';
import type { Playlist } from './types';

// ========================================
// Playlist CRUD
// ========================================

export async function createPlaylist(userId: string, title: string, description?: string): Promise<Playlist | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('playlists')
        .insert({ user_id: userId, title, description })
        .select()
        .single();

    if (error) {
        console.error('Error creating playlist:', error);
        return null;
    }
    return data;
}

export async function getUserPlaylists(userId: string): Promise<Playlist[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('playlists')
        .select(`
            *,
            playlist_items(count),
            items_ref:playlist_items(
                position,
                stories(cover_url)
            )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching playlists:', error);
        return [];
    }

    return data.map((d: any) => {
        const sorted = d.items_ref?.sort((a: any, b: any) => a.position - b.position);
        const cover = sorted?.[0]?.stories?.cover_url;

        return {
            ...d,
            item_count: d.playlist_items?.[0]?.count || 0,
            cover_url: cover
        };
    }) || [];
}

export async function getPlaylistDetails(playlistId: string): Promise<Playlist | null> {
    if (!supabase) return null;

    const { data: playlist, error } = await supabase
        .from('playlists')
        .select('*')
        .eq('id', playlistId)
        .single();

    if (error || !playlist) {
        console.error('Error fetching playlist details:', error);
        return null;
    }

    const { data: items, error: itemsError } = await supabase
        .from('playlist_items')
        .select(`
            *,
            stories:stories (*)
        `)
        .eq('playlist_id', playlistId)
        .order('added_at', { ascending: true });

    if (itemsError) {
        console.error('Error fetching playlist items:', itemsError);
        return playlist;
    }

    const stories = items
        .map((item: any) => item.stories)
        .filter((s: any) => s != null && s.is_published);

    return { ...playlist, items: stories, item_count: stories.length };
}

export async function deletePlaylist(playlistId: string): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase.from('playlists').delete().eq('id', playlistId);
    if (error) return false;
    return true;
}

// ========================================
// Playlist Items
// ========================================

export async function addStoryToPlaylist(playlistId: string, storyId: string): Promise<boolean> {
    if (!supabase) return false;

    const { data } = await supabase
        .from('playlist_items')
        .select('id')
        .match({ playlist_id: playlistId, story_id: storyId })
        .single();

    if (data) return true;

    const { error } = await supabase
        .from('playlist_items')
        .insert({ playlist_id: playlistId, story_id: storyId });

    if (error) {
        console.error('Error adding to playlist:', error);
        return false;
    }
    return true;
}

export async function removeStoryFromPlaylist(playlistId: string, storyId: string): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
        .from('playlist_items')
        .delete()
        .match({ playlist_id: playlistId, story_id: storyId });

    if (error) {
        console.error('Error removing from playlist:', error);
        return false;
    }
    return true;
}
