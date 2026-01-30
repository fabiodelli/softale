/**
 * Supabase Admin Helpers
 * Admin-only operations (tags, bulk operations)
 */

import { supabase } from './client';
import type { TagStat } from './types';

// ========================================
// Tag Management
// ========================================

export async function getTagStats(): Promise<TagStat[]> {
    if (!supabase) return [];

    const { data, error } = await supabase.rpc('get_tag_stats');

    if (error) {
        console.error('Error fetching tag stats:', error);
        return [];
    }

    return data || [];
}

export async function mergeTags(oldTag: string, newTag: string): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase.rpc('merge_tags', { old_tag: oldTag, new_tag: newTag });

    if (error) {
        console.error('Error merging tags:', error);
        return false;
    }
    return true;
}
