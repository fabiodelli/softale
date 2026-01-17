import { CATEGORIES } from '../lib/constants';

// Re-export Mood type from constants
export type { Mood } from '../lib/constants';

// Category type derived from CATEGORIES constant
export type Category = typeof CATEGORIES[number]['id'];

// Filter types for Library page
export type FilterType = 'all' | 'favorites' | 'continue' | 'collections' | 'playlists' | Category;

// Story with progress information
export interface StoryWithProgress {
    id: string;
    title: string;
    description: string;
    category: string;
    duration: number;
    cover_url: string;
    cover_portrait_url?: string;
    cover_landscape_url?: string;
    audio_url: string;
    author: string;
    author_image_url?: string;
    is_premium: boolean;
    progress_percent?: number;
}
