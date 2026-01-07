
import { Story } from '@/lib/supabase';
import { Mood } from '@/components/MoodSelector';

export interface ContentSection {
    id: string;
    title: string;
    subtitle?: string;
    items: Story[];
    type: 'row' | 'grid'; // 'row' for horizontal scroll, 'grid' for standard
    /** Category filter to use when navigating to Library via "View All" */
    filterCategory?: string;
}

export interface HomeLayout {
    featured?: Story; // The "Hero" content for this mood
    sections: ContentSection[];
}

/**
 * Helper to filter stories by exact category or list of categories
 */
const getByCat = (stories: Story[], cats: string[]) => {
    return stories.filter(s => cats.includes(s.category));
}

const getById = (stories: Story[], idPartial: string) => {
    return stories.find(s => s.id.includes(idPartial) || s.title.toLowerCase().includes(idPartial.toLowerCase()));
}

export const getLayoutForMood = (mood: Mood, allStories: Story[]): HomeLayout => {

    // DEFAULT LAYOUT (No Mood)
    if (!mood) {
        // Show everything categorized
        return {
            sections: [
                {
                    id: 'new',
                    title: 'New Arrivals',
                    items: allStories.slice(0, 5), // Just top 5 for now
                    type: 'row',
                    filterCategory: 'all'
                },
                {
                    id: 'soundscapes',
                    title: 'Immersive Soundscapes',
                    subtitle: 'Transport yourself to another world',
                    items: getByCat(allStories, ['soundscape', 'nature']),
                    type: 'row',
                    filterCategory: 'soundscape'
                },
                {
                    id: 'binaural',
                    title: 'Binaural Frequencies',
                    subtitle: 'Science-backed audio for focus and rest',
                    items: getByCat(allStories, ['binaural']),
                    type: 'row',
                    filterCategory: 'binaural'
                },
                {
                    id: 'instrumental',
                    title: 'Focus Music',
                    subtitle: 'Pure instrumental tracks',
                    items: getByCat(allStories, ['music_instrumental']),
                    type: 'row',
                    filterCategory: 'music_instrumental'
                },
                {
                    id: 'all',
                    title: 'All Content',
                    items: allStories,
                    type: 'grid'
                }
            ]
        };
    }

    // === RELAXED (Sleep) ===
    if (mood === 'sleep') {
        return {
            featured: getById(allStories, 'Monsoon') || getById(allStories, 'Velvet'), // Fallback until Velvet exists
            sections: [
                {
                    id: 'sleep_tales',
                    title: 'Sleep Tales',
                    subtitle: 'Drift off with soothing narratives',
                    items: getByCat(allStories, ['sleep']),
                    type: 'row',
                    filterCategory: 'sleep'
                },
                {
                    id: 'peaceful',
                    title: 'Peaceful Environments',
                    items: getByCat(allStories, ['soundscape', 'nature']),
                    type: 'row',
                    filterCategory: 'soundscape'
                },
                {
                    id: 'deep_rest',
                    title: 'Deep Rest Frequencies',
                    items: getByCat(allStories, ['binaural', 'meditation']),
                    type: 'row',
                    filterCategory: 'binaural'
                }
            ]
        };
    }

    // === FOCUSED (Work) ===
    if (mood === 'meditation') { // Mapped to 'meditation' internally but means Focused/Work often
        // Actually UI says "Focused" -> 'meditation' intent in logic usually
        // Let's check typical mapping. In page.tsx: 'meditation' -> ['meditation', 'binaural', 'work_break'...]
        return {
            featured: getById(allStories, 'Gamma') || getById(allStories, 'Focus'),
            sections: [
                {
                    id: 'deep_work',
                    title: 'Deep Work Music',
                    items: getByCat(allStories, ['music_instrumental']),
                    type: 'row',
                    filterCategory: 'music_instrumental'
                },
                {
                    id: 'science_focus',
                    title: 'Focus Science',
                    items: getByCat(allStories, ['binaural']),
                    type: 'row',
                    filterCategory: 'binaural'
                },
                {
                    id: 'quick_reset',
                    title: 'Quick Resets',
                    items: getByCat(allStories, ['work_break', 'meditation']),
                    type: 'row',
                    filterCategory: 'work_break'
                }
            ]
        };
    }

    // === ENERGIZED ===
    if (mood === 'energized') {
        return {
            featured: getById(allStories, 'Acoustic') || getById(allStories, 'Morning'),
            sections: [
                {
                    id: 'morning',
                    title: 'Morning Routine',
                    items: getByCat(allStories, ['motivation', 'meditation']),
                    type: 'row',
                    filterCategory: 'motivation'
                },
                {
                    id: 'upbeat',
                    title: 'Energizing Audio',
                    items: getByCat(allStories, ['music_instrumental', 'nature']),
                    type: 'row',
                    filterCategory: 'music_instrumental'
                }
            ]
        };
    }

    // === PEACEFUL (Nature) ===
    if (mood === 'nature') {
        return {
            featured: getById(allStories, 'Bamboo') || getById(allStories, 'Forest'),
            sections: [
                {
                    id: 'pure_nature',
                    title: 'Pure Nature',
                    items: getByCat(allStories, ['nature', 'soundscape']),
                    type: 'row',
                    filterCategory: 'nature'
                },
                {
                    id: 'grounding',
                    title: 'Grounding Practices',
                    items: getByCat(allStories, ['meditation']),
                    type: 'row',
                    filterCategory: 'meditation'
                }
            ]
        };
    }

    // === DREAMY (Fantasy) ===
    if (mood === 'fantasy') {
        return {
            featured: getById(allStories, 'Apiary') || getById(allStories, 'Space'),
            sections: [
                {
                    id: 'fantasy_journeys',
                    title: 'Fantasy Journeys',
                    items: getByCat(allStories, ['fantasy', 'kids']),
                    type: 'row',
                    filterCategory: 'fantasy'
                },
                {
                    id: 'surreal',
                    title: 'Surreal Soundscapes',
                    items: getByCat(allStories, ['soundscape', 'music_instrumental']),
                    type: 'row',
                    filterCategory: 'soundscape'
                }
            ]
        };
    }

    return { sections: [] };
};
