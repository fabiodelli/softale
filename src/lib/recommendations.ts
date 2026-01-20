import { supabase, Story, FavoriteJoin, ProgressJoin } from './supabase';

// ========================================
// Types
// ========================================

export interface RecommendationScore {
    storyId: string;
    score: number;
    matchReasons: string[]; // e.g., ["Favorite Tag: Rain", "Morning Context"]
}

type TimeContext = 'morning' | 'day' | 'evening' | 'night';

// ========================================
// Configuration
// ========================================

const TIME_CONTEXT_MAP: Record<TimeContext, string[]> = {
    morning: ['Morning', 'Sunrise', 'Energy', 'Focus', 'Awaken', 'Positive'],
    day: ['Focus', 'Work', 'Deep Work', 'Background', 'Study', 'Nature'],
    evening: ['Relax', 'Unwind', 'Sunset', 'Calm', 'Reading', 'Decompress'],
    night: ['Sleep', 'Dream', 'Night', 'Rain', 'Binaural', 'Deep', 'Insomnia']
};

const SCORING = {
    FAVORITE_TAG_MATCH: 5,
    COMPLETED_TAG_MATCH: 3,
    PARTIAL_TAG_MATCH: 1,
    CONTEXT_MATCH: 10, // High boost for time-relevant content
    CATEGORY_MATCH: 3
};

// ========================================
// Helpers
// ========================================

function getTimeContext(): TimeContext {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 10) return 'morning';
    if (hour >= 10 && hour < 18) return 'day';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
}

function normalizeTags(tags: string[] | null): string[] {
    if (!tags) return [];
    return tags.map(t => t.toLowerCase().trim());
}

// ========================================
// Core Logic
// ========================================

export async function getRecommendedStories(userId: string): Promise<Story[]> {
    if (!supabase) return [];

    console.log(`[Recommender] Starting for user ${userId}...`);

    // 1. Fetch User History (Favorites & Progress)
    const [favoritesRes, progressRes, allStoriesRes] = await Promise.all([
        supabase.from('favorites').select('stories (tags, category)').eq('user_id', userId),
        supabase.from('listening_progress').select('completed, stories (tags, category)').eq('user_id', userId),
        supabase.from('stories').select('*').eq('is_published', true)
    ]);

    if (favoritesRes.error || progressRes.error || allStoriesRes.error || !allStoriesRes.data) {
        console.error('[Recommender] Error fetching data', { favoritesRes, progressRes, allStoriesRes });
        return [];
    }

    const allStories = allStoriesRes.data as Story[];
    const favorites = (favoritesRes.data || []).map((f: unknown) => (f as FavoriteJoin).stories).filter(Boolean);
    const progress = (progressRes.data || []).map((p: unknown) => ({ story: (p as ProgressJoin).stories, completed: (p as ProgressJoin).completed })).filter((p) => p.story);

    // 2. Build User Profile (Tag Affinity)
    const tagScores: Record<string, number> = {};
    const categoryScores: Record<string, number> = {};

    // Process Favorites
    favorites.forEach((story: any) => {
        const tags = normalizeTags(story.tags);
        tags.forEach(tag => {
            tagScores[tag] = (tagScores[tag] || 0) + SCORING.FAVORITE_TAG_MATCH;
        });
        if (story.category) {
            categoryScores[story.category] = (categoryScores[story.category] || 0) + SCORING.FAVORITE_TAG_MATCH;
        }
    });

    // Process History
    progress.forEach((item: any) => {
        const tags = normalizeTags(item.story.tags);
        const weight = item.completed ? SCORING.COMPLETED_TAG_MATCH : SCORING.PARTIAL_TAG_MATCH;
        tags.forEach(tag => {
            tagScores[tag] = (tagScores[tag] || 0) + weight;
        });
        if (item.story.category) {
            categoryScores[item.story.category] = (categoryScores[item.story.category] || 0) + weight;
        }
    });

    // 3. Determine Context
    const timeContext = getTimeContext();
    const contextTags = TIME_CONTEXT_MAP[timeContext].map(t => t.toLowerCase());

    console.log(`[Recommender] Context: ${timeContext}, Top Tags:`, tagScores);

    // 4. Score Candidate Stories
    const scoredStories = allStories.map(story => {
        let score = 0;
        const matchReasons: string[] = [];
        const storyTags = normalizeTags(story.tags);

        // A. Affinity Score
        storyTags.forEach(tag => {
            if (tagScores[tag]) {
                score += tagScores[tag];
                // Limit reasons to avoid spam
                if (matchReasons.length < 2) matchReasons.push(`Matches '${tag}'`);
            }
        });

        if (story.category && categoryScores[story.category]) {
            score += categoryScores[story.category];
        }

        // B. Context Score
        const contextMatches = storyTags.filter(tag => contextTags.includes(tag));
        if (contextMatches.length > 0) {
            score += SCORING.CONTEXT_MATCH * contextMatches.length;
            matchReasons.push(`Perfect for ${timeContext}`);
        } else {
            // If category matches broad context? (Optional, maybe category 'Sleep' matches 'night')
            // Simple fallback:
            if (timeContext === 'night' && story.category === 'sleep') score += SCORING.CONTEXT_MATCH;
            if (timeContext === 'morning' && story.category === 'motivation') score += SCORING.CONTEXT_MATCH;
        }

        // C. Freshness Boost (Newer stories get small boost)
        const daysOld = (new Date().getTime() - new Date(story.created_at).getTime()) / (1000 * 60 * 60 * 24);
        if (daysOld < 7) score += 5; // New Content Boost

        return { story, score, matchReasons };
    });

    // 5. Sort & Return
    // Filter out 0 scores? No, maybe show randoms if no history.
    // Sort descending
    scoredStories.sort((a, b) => b.score - a.score);

    // Return top 10
    return scoredStories.slice(0, 10).map(s => s.story);
}

// ========================================
// Mood-Based Scoring (New)
// ========================================

// Extended from MoodSelector but defined here to avoid circular imports if possible, 
// or we just accept the string type.
type Mood = 'sleep' | 'meditation' | 'fantasy' | 'nature' | 'energized';

const MOOD_TAG_MAP: Record<Mood, string[]> = {
    sleep: ['Sleep', 'Dream', 'Night', 'Relax', 'Calm', 'Soft', 'Ethereal', 'Binaural', 'Slow'],
    meditation: ['Focus', 'Meditate', 'Deep Work', 'Zen', 'Mindfulness', 'Binaural', 'Drone', 'Ambient'],
    fantasy: ['Fantasy', 'Magic', 'Adventure', 'Story', 'Journey', 'Ethereal', 'Cinematic', 'Kids'],
    nature: ['Nature', 'Forest', 'Rain', 'Ocean', 'Water', 'Wind', 'Fire', 'Atmospheric', 'Field Recording'],
    energized: ['Energy', 'Morning', 'Upbeat', 'Motivation', 'Positivity', 'Cinematic', 'Fast', 'Rhythmic']
};

export function scoreStoryForMood(story: Story, mood: Mood): number {
    const targetTags = MOOD_TAG_MAP[mood]?.map(t => t.toLowerCase()) || [];
    const storyTags = normalizeTags(story.tags);
    let score = 0;

    // 1. Tag Matches (High Weight)
    storyTags.forEach(tag => {
        if (targetTags.includes(tag)) {
            score += 10;
        }
    });

    // 2. Category Relevance (Medium Weight)
    // We already have hardcoded categories in page.tsx, but scoring supports cross-category discovery
    // E.g. A 'Nature' story might be great for 'Sleep' if it has 'Night' tag.

    // 3. Fallback/Base Score
    // Newer stories get a slight boost to keep Featured fresh?
    const daysOld = (new Date().getTime() - new Date(story.created_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysOld < 14) score += 2; // Freshness boost

    return score;
}

export function sortStoriesByMood(stories: Story[], mood: Mood): Story[] {
    return [...stories].sort((a, b) => {
        const scoreA = scoreStoryForMood(a, mood);
        const scoreB = scoreStoryForMood(b, mood);
        return scoreB - scoreA; // Descending
    });
}
