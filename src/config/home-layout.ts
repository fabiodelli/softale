
import { Story } from '@/lib/supabase';
import { Mood } from '@/components/MoodSelector';
import { sortStoriesByMood, scoreStoryForMood } from '@/lib/recommendations';

export interface ContentSection {
    id: string;
    title: string;
    subtitle?: string;
    items: Story[];
    type: 'row' | 'grid' | 'mixed';
    displayType?: 'slider' | 'list'; // New property for UI control
    /** Category filter to use when navigating to Library via "View All" */
    filterCategory?: string;
    avgScore?: number;
}

export interface HomeLayout {
    featured?: Story;
    sections: ContentSection[];
}

export const getLayoutForMood = (mood: Mood, allStories: Story[]): HomeLayout => {
    // 1. Sort ALL stories by Relevance
    const sortedStories = sortStoriesByMood(allStories, mood);
    const usedStoryIds = new Set<string>();

    // 2. Select Featured (Top 1)
    const featured = sortedStories[0];
    if (featured) {
        usedStoryIds.add(featured.id);
    }

    // 3. Best Matches Section (Next Top 5 - List View)
    // Filter out featured
    const bestMatchCandidates = sortedStories.filter(s => !usedStoryIds.has(s.id));
    const bestMatchItems = bestMatchCandidates.slice(0, 5); // Limit to 5 for list view

    // Mark best matches as used
    bestMatchItems.forEach(s => usedStoryIds.add(s.id));

    const bestMatches: ContentSection = {
        id: 'best_matches',
        title: 'Mood Driven',
        subtitle: `Selected for your current vibe`,
        items: bestMatchItems,
        type: 'mixed',
        displayType: 'list', // Explicit List Mode
        filterCategory: 'all',
        avgScore: 9999
    };

    // Helper to get from SORTED list avoiding duplicates
    const getOrderedAndUnused = (cats: string[]) => {
        return sortedStories.filter(s => cats.includes(s.category) && !usedStoryIds.has(s.id));
    };

    // Helper to create and score a section
    const createSection = (id: string, title: string, subtitle: string | undefined, categories: string[], filterCat: string): ContentSection => {
        const items = getOrderedAndUnused(categories);

        // Mark these as used? 
        // Logic: The user wants "Global Deduplication".
        // But sections run in parallel? No, valid code executes sequentially.
        // BUT, getOrderedAndUnused runs for ALL sections. If Section A claims a story, Section B shouldn't avail it?
        // In current implementation logic, we define candidates array.
        // This implies we need to process sections sequentially to mark IDs as used.
        // Re-architecture needed: We can't define candidates in an array literal if they depend on shared state mutation.

        // We will do this differently immediately below.

        let avgScore = 0;
        if (items.length > 0) {
            const totalScore = items.reduce((sum, s) => sum + scoreStoryForMood(s, mood), 0);
            avgScore = totalScore / items.length;
        }

        return {
            id,
            title,
            subtitle,
            items,
            type: 'mixed',
            displayType: 'slider', // Defaults to slider
            filterCategory: filterCat,
            avgScore
        };
    };

    // 4. Define Section Definitions (Meta-data only)
    type SectionDef = { id: string, title: string, subtitle?: string, cats: string[], filterCat: string };

    let sectionDefs: SectionDef[] = [];

    if (mood === 'sleep') {
        sectionDefs = [
            { id: 'sleep_tales', title: 'Sleep Tales', subtitle: 'Drift off with soothing narratives', cats: ['sleep'], filterCat: 'sleep' },
            { id: 'peaceful', title: 'Peaceful Environments', cats: ['soundscape', 'nature'], filterCat: 'soundscape' },
            { id: 'deep_rest', title: 'Deep Rest Frequencies', cats: ['binaural', 'meditation'], filterCat: 'binaural' },
            { id: 'wind_down', title: 'Wind Down', cats: ['music_instrumental', 'fantasy'], filterCat: 'music_instrumental' }
        ];
    } else if (mood === 'meditation') {
        sectionDefs = [
            { id: 'deep_work', title: 'Deep Work Music', cats: ['music_instrumental'], filterCat: 'music_instrumental' },
            { id: 'science_focus', title: 'Focus Science', cats: ['binaural'], filterCat: 'binaural' },
            { id: 'quick_reset', title: 'Quick Resets', cats: ['work_break', 'meditation'], filterCat: 'work_break' },
            { id: 'ambient_flow', title: 'Ambient Flow', cats: ['soundscape'], filterCat: 'soundscape' }
        ];
    } else if (mood === 'energized') {
        sectionDefs = [
            { id: 'morning', title: 'Morning Routine', cats: ['motivation', 'meditation'], filterCat: 'motivation' },
            { id: 'upbeat', title: 'Energizing Audio', cats: ['music_instrumental', 'nature'], filterCat: 'music_instrumental' },
            { id: 'kids_energy', title: 'For Kids', cats: ['kids', 'fantasy'], filterCat: 'kids' }
        ];
    } else if (mood === 'nature') {
        sectionDefs = [
            { id: 'pure_nature', title: 'Pure Nature', cats: ['nature', 'soundscape'], filterCat: 'nature' },
            { id: 'grounding', title: 'Grounding Practices', cats: ['meditation'], filterCat: 'meditation' },
            { id: 'instrumental_nature', title: 'Nature Inspired Music', cats: ['music_instrumental'], filterCat: 'music_instrumental' }
        ];
    } else if (mood === 'fantasy') {
        sectionDefs = [
            { id: 'fantasy_journeys', title: 'Fantasy Journeys', cats: ['fantasy', 'kids'], filterCat: 'fantasy' },
            { id: 'surreal', title: 'Surreal Soundscapes', cats: ['soundscape', 'music_instrumental'], filterCat: 'soundscape' },
            { id: 'sleep_stories', title: 'Sleepy Tales', cats: ['sleep'], filterCat: 'sleep' }
        ];
    }

    // 5. Instantiate Sections Sequentially (Greedy Allocation)
    // We want to sort definitions by POTENTIAL relevance first? 
    // Or just iterate? User wants dynamic ordering.
    // If we iterate defined order, "Sleep Tales" always grabs stories first.
    // If "Sleep Tales" is low relevance, does it matter?
    // Problem: Dynamic Ordering was based on content. But content allocation depends on order.
    // Solution:
    // A. Calculate Potential Score for each def (without claiming IDs).
    // B. Sort Defs by Potential Score.
    // C. Allocate IDs.

    const validSections: ContentSection[] = [];

    // A. Estimate Score (Peek)
    const scoredDefs = sectionDefs.map(def => {
        // Just peek at what matches from unused (without marking used yet)
        const potentialItems = sortedStories.filter(s => def.cats.includes(s.category) && !usedStoryIds.has(s.id));
        let avgScore = 0;
        if (potentialItems.length > 0) {
            avgScore = potentialItems.reduce((sum, s) => sum + scoreStoryForMood(s, mood), 0) / potentialItems.length;
        }
        return { ...def, avgScore, potentialItems };
    });

    // B. Sort
    scoredDefs.sort((a, b) => b.avgScore - a.avgScore);

    // C. Allocate (Real)
    // Now we iterate the sorted definitions and actually claim the stories.
    // Since we sorted by "Potential Quality", the best sections get first pick.

    for (const def of scoredDefs) {
        // Re-filter because previous sections might have stolen matches?
        // Actually, if themes are distinct, unlikely. But if "Nature" and "Soundscape" overlap, yes.
        const realItems = sortedStories.filter(s => def.cats.includes(s.category) && !usedStoryIds.has(s.id));

        if (realItems.length > 0) {
            realItems.forEach(s => usedStoryIds.add(s.id));

            validSections.push({
                id: def.id,
                title: def.title,
                subtitle: def.subtitle,
                items: realItems,
                type: 'mixed',
                displayType: 'slider',
                filterCategory: def.filterCat,
                avgScore: def.avgScore
            });
        }
    }

    // Return Layout
    // If Best Match has items, include it.
    const sections = [];
    if (bestMatchItems.length > 0) sections.push(bestMatches);
    sections.push(...validSections);

    return {
        featured,
        sections
    };
};
