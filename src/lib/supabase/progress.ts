/**
 * Supabase Progress Helpers
 * Listening progress tracking
 */

import { supabase } from './client';
import type { ListeningProgress, StoryWithProgress, ProgressJoin } from './types';

// ========================================
// Progress Read Operations
// ========================================

export async function getListeningProgress(userId: string): Promise<ListeningProgress[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
        .from('listening_progress')
        .select('*, stories(*)')
        .eq('user_id', userId)
        .order('last_played_at', { ascending: false });

    if (error) {
        console.error('Error fetching progress:', error);
        return [];
    }

    return data || [];
}

export async function getInProgressStories(userId: string): Promise<StoryWithProgress[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('listening_progress')
        .select('story_id, progress_seconds, completed, stories (*)')
        .eq('user_id', userId)
        .eq('completed', false)
        .gt('progress_seconds', 10)
        .order('last_played_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error fetching in-progress stories:', error);
        return [];
    }

    return (data as unknown as ProgressJoin[])
        .filter((item) => item.stories != null)
        .map((item) => ({
            ...item.stories!,
            progress_seconds: item.progress_seconds,
            progress_percent: Math.round((item.progress_seconds / item.stories!.duration) * 100)
        }));
}

// ========================================
// Progress Write Operations
// ========================================

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
