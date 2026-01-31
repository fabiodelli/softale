/**
 * Supabase Collections Helpers
 * Collection management and story relationships
 */

import { supabase } from './client';
import type { Collection, Story, CollectionWithJoin, CollectionStoryJoin } from './types';

// ========================================
// Public Read Operations
// ========================================

export async function getFeaturedCollections(): Promise<Collection[]> {
    if (!supabase) return [];

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

    return formatCollections(collections);
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

    return formatCollections(collections);
}

export async function getCollectionBySlug(slug: string): Promise<Collection | null> {
    if (!supabase) return null;

    const { data: collection, error } = await supabase
        .from('collections')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error || !collection) {
        console.error('Error fetching collection:', error);
        return null;
    }

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

    const stories = (junctionData as unknown as CollectionStoryJoin[])
        .map((item) => item.stories)
        .filter((story): story is Story => story !== null && (story.is_published === true));

    return { ...collection, stories };
}

export async function getCollectionById(id: string): Promise<Collection | null> {
    if (!supabase) return null;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) return null;

    const { data: collection, error } = await supabase
        .from('collections')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !collection) {
        console.error('Error fetching collection by id:', error);
        return null;
    }

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

    const stories = (junctionData as unknown as CollectionStoryJoin[])
        .map((item) => item.stories)
        .filter((story): story is Story => story !== null && (story.is_published === true));

    return { ...collection, stories };
}

// ========================================
// Admin Operations
// ========================================

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

// ========================================
// Collection Stories Management
// ========================================

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
// Helper Functions
// ========================================

function formatCollections(collections: CollectionWithJoin[]): Collection[] {
    return collections.map((col) => {
        const sortedStories = (col.collection_stories || [])
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((item) => item.stories)
            .filter((s): s is Story => s !== null && s.is_published === true);

        return {
            ...col,
            stories: sortedStories
        };
    });
}
