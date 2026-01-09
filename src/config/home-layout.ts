
import { Story } from '@/lib/supabase';
import { Mood } from '@/components/MoodSelector';

export interface ContentSection {
    id: string;
    title: string;
    subtitle?: string;
    items: Story[];
    type: 'row' | 'grid' | 'mixed'; // 'row' for horizontal scroll, 'grid' for standard, 'mixed' for Featured + List
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



    // === RELAXED (Sleep) ===
    if (mood === 'sleep') {
        // Dynamic: Get newest Sleep or Meditation story
        const featured = getByCat(allStories, ['sleep', 'meditation'])[0];
        return {
            featured,
            sections: [
                {
                    id: 'sleep_tales',
                    title: 'Sleep Tales',
                    subtitle: 'Drift off with soothing narratives',
                    items: getByCat(allStories, ['sleep']),
                    type: 'mixed',
                    filterCategory: 'sleep'
                },
                {
                    id: 'peaceful',
                    title: 'Peaceful Environments',
                    items: getByCat(allStories, ['soundscape', 'nature']),
                    type: 'mixed',
                    filterCategory: 'soundscape'
                },
                {
                    id: 'deep_rest',
                    title: 'Deep Rest Frequencies',
                    items: getByCat(allStories, ['binaural', 'meditation']),
                    type: 'mixed',
                    filterCategory: 'binaural'
                }
            ]
        };
    }

    // === FOCUSED (Work) ===
    if (mood === 'meditation') {
        // Dynamic: Get newest Instrumental or Binaural
        const featured = getByCat(allStories, ['music_instrumental', 'binaural', 'motivation'])[0];
        return {
            featured,
            sections: [
                {
                    id: 'deep_work',
                    title: 'Deep Work Music',
                    items: getByCat(allStories, ['music_instrumental']),
                    type: 'mixed',
                    filterCategory: 'music_instrumental'
                },
                {
                    id: 'science_focus',
                    title: 'Focus Science',
                    items: getByCat(allStories, ['binaural']),
                    type: 'mixed',
                    filterCategory: 'binaural'
                },
                {
                    id: 'quick_reset',
                    title: 'Quick Resets',
                    items: getByCat(allStories, ['work_break', 'meditation']),
                    type: 'mixed',
                    filterCategory: 'work_break'
                }
            ]
        };
    }

    // === ENERGIZED ===
    if (mood === 'energized') {
        // Dynamic: Get newest Motivation or Upbeat Instrumental
        const featured = getByCat(allStories, ['motivation', 'music_instrumental'])[0];
        return {
            featured,
            sections: [
                {
                    id: 'morning',
                    title: 'Morning Routine',
                    items: getByCat(allStories, ['motivation', 'meditation']),
                    type: 'mixed',
                    filterCategory: 'motivation'
                },
                {
                    id: 'upbeat',
                    title: 'Energizing Audio',
                    items: getByCat(allStories, ['music_instrumental', 'nature']),
                    type: 'mixed',
                    filterCategory: 'music_instrumental'
                }
            ]
        };
    }

    // === PEACEFUL (Nature) ===
    if (mood === 'nature') {
        // Dynamic: Get newest Nature or Soundscape
        const featured = getByCat(allStories, ['nature', 'soundscape'])[0];
        return {
            featured,
            sections: [
                {
                    id: 'pure_nature',
                    title: 'Pure Nature',
                    items: getByCat(allStories, ['nature', 'soundscape']),
                    type: 'mixed',
                    filterCategory: 'nature'
                },
                {
                    id: 'grounding',
                    title: 'Grounding Practices',
                    items: getByCat(allStories, ['meditation']),
                    type: 'mixed',
                    filterCategory: 'meditation'
                }
            ]
        };
    }

    // === DREAMY (Fantasy) ===
    if (mood === 'fantasy') {
        // Dynamic: Get newest Fantasy, Kids, Soundscape, or Nature story (Broader fallback)
        const featured = getByCat(allStories, ['fantasy', 'kids', 'soundscape', 'nature'])[0];
        return {
            featured,
            sections: [
                {
                    id: 'fantasy_journeys',
                    title: 'Fantasy Journeys',
                    items: getByCat(allStories, ['fantasy', 'kids']),
                    type: 'mixed',
                    filterCategory: 'fantasy'
                },
                {
                    id: 'surreal',
                    title: 'Surreal Soundscapes',
                    items: getByCat(allStories, ['soundscape', 'music_instrumental']),
                    type: 'mixed',
                    filterCategory: 'soundscape'
                }
            ]
        };
    }

    return { sections: [] };
};
