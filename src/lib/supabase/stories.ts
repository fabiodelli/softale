/**
 * Supabase Stories Helpers
 * CRUD operations for stories
 */

import { supabase } from './client';
import type { Story } from './types';

// ========================================
// Read Operations
// ========================================

export async function getStories(categories?: string[], includeUnpublished: boolean = false): Promise<Story[]> {
    if (!supabase) return [];
    let query = supabase.from('stories').select('*').order('created_at', { ascending: false });

    if (categories && categories.length > 0) {
        if (!categories.includes('all')) {
            query = query.in('category', categories);
        }
    }

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

export async function getStoryBySlug(slug: string): Promise<Story | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error) {
        console.error('Error fetching story by slug:', error);
        return null;
    }
    return data;
}
