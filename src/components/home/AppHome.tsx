'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { getStories, getCollections, type Story, type Collection } from '@/lib/supabase';
import StoryCard from '@/components/StoryCard';
import CollectionCard from '@/components/CollectionCard';
import MoodSelector, { Mood } from '@/components/MoodSelector';
import { usePlayer } from '@/lib/PlayerContext';
import { useAmbience } from '@/context/AmbienceContext';
import { Layers } from 'lucide-react';
import { getLayoutForMood } from '@/config/home-layout';
import ContentSection from '@/components/ContentSection';
import FeaturedCard from '@/components/FeaturedCard';
import { useSearchParams } from 'next/navigation'; // Keeping for mood param

// Mood to Categories Mapping (synced with Factory RECIPE_MATRIX)
// Factory categories: sleep, meditation, fantasy, kids, motivation, work_break, nature, soundscape, music_instrumental, binaural
const moodToCategories: Record<string, string[]> = {
    'sleep': ['sleep', 'meditation', 'nature', 'soundscape', 'binaural', 'music_instrumental'],
    'meditation': ['meditation', 'binaural', 'work_break', 'nature', 'soundscape', 'music_instrumental'],
    'fantasy': ['fantasy', 'kids', 'sleep', 'nature', 'music_instrumental'],
    'nature': ['nature', 'soundscape', 'meditation', 'music_instrumental'],
    'energized': ['motivation', 'work_break', 'kids', 'nature', 'music_instrumental']
};

export default function AppHome() {
    const { play } = usePlayer();
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('q') || '';

    const [allStories, setAllStories] = useState<Story[]>([]);
    const [allCollections, setAllCollections] = useState<Collection[]>([]);
    const [loading, setLoading] = useState(true);

    // Mood State
    const [activeMood, setActiveMood] = useState<Mood>('sleep');
    const [greeting, setGreeting] = useState('');

    // Time-based Greeting Logic
    useEffect(() => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) setGreeting('Good Morning');
        else if (hour >= 12 && hour < 18) setGreeting('Good Afternoon');
        else setGreeting('Good Evening');
    }, []);

    // Sync Mood with URL Query Param (e.g. from Footer links)
    useEffect(() => {
        const moodParam = searchParams.get('mood');
        if (moodParam && moodToCategories[moodParam]) {
            // Direct state update + storage update
            const mood = moodParam as Mood;
            setActiveMood(mood);
            sessionStorage.setItem('reverie_active_mood', mood!);
        }
    }, [searchParams]);

    // Restore Mood from SessionStorage
    useEffect(() => {
        const savedMood = sessionStorage.getItem('reverie_active_mood');
        if (savedMood) {
            setActiveMood(savedMood as Mood);
        }
    }, []);


    // Ambience Integration
    const { setTrack, setVolume } = useAmbience();

    const moodToAmbience: Record<string, string> = {
        'sleep': 'night',        // Relaxed -> Night Nature (Crickets)
        'meditation': 'river',   // Focused -> River
        'fantasy': 'wind',       // Dreamy -> Wind
        'nature': 'forest',      // Peaceful -> Forest
        'energized': 'ocean'     // Energized -> Ocean
    };

    // Mood Handler with Persistence and Ambience Trigger
    const handleMoodSelect = (mood: Mood) => {
        setActiveMood(mood);
        sessionStorage.setItem('reverie_active_mood', mood);

        // Trigger Ambience
        const trackId = moodToAmbience[mood];
        if (trackId) {
            setTrack(trackId);
        }
    };

    // Data Fetching - Stories and Collections
    useEffect(() => {
        async function fetchData() {
            const [stories, collections] = await Promise.all([
                getStories(),
                getCollections()
            ]);
            setAllStories(stories);
            setAllCollections(collections);
            setLoading(false);
        }
        fetchData();
    }, []);

    // Filter stories based on Active Mood or Search
    const displayedStories = allStories.filter(story => {
        if (!searchQuery && !activeMood) return true; // Should not happen with default mood

        if (searchQuery) {
            return story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                story.description.toLowerCase().includes(searchQuery.toLowerCase());
        }

        if (activeMood) {
            const targetCategories = moodToCategories[activeMood] || [];
            return targetCategories.includes(story.category);
        }

        return true;
    });

    // Filter collections based on Active Mood
    const displayedCollections = allCollections.filter(collection => {
        if (searchQuery) return false; // Hide collections during search

        const targetCategories = moodToCategories[activeMood] || [];
        return targetCategories.includes(collection.category || '');
    });


    // Layout Engine
    const layout = getLayoutForMood(activeMood, allStories);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">

            {/* Mood Selector (Hero Section) */}
            <MoodSelector
                activeMood={activeMood}
                onSelect={handleMoodSelect}
                greeting={greeting}
            />

            {/* Main Content Feed */}
            <div className="max-w-[100vw] overflow-x-clip px-6 md:px-12 py-6">

                {/* --- SEARCH MODE --- */}
                {searchQuery ? (
                    <>
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-slate-800">Results for "{searchQuery}"</h2>
                        </div>
                        {displayedStories.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
                                {displayedStories.map((story) => (
                                    <StoryCard key={story.id} story={story} aspectRatio="square" />
                                ))}
                            </div>
                        ) : (
                            <div className="py-20 text-center text-slate-500">No results found.</div>
                        )}
                    </>
                ) : (
                    /* --- CONTEXTUAL MODE (Mood Layout) --- */
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

                        {/* 1. Featured Hero Card */}
                        {layout.featured && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                                <FeaturedCard story={layout.featured} />
                            </motion.div>
                        )}

                        {/* 2. Collections Row (Legacy logic preserved) */}
                        {displayedCollections.length > 0 && (
                            <div className="mb-12">
                                <div className="flex items-center gap-2 mb-4">
                                    <Layers className="w-4 h-4 text-indigo-600" />
                                    <h3 className="text-lg font-bold text-slate-900">Collections</h3>
                                </div>
                                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-6 md:-mx-12 px-6 md:px-12">
                                    {displayedCollections.slice(0, 6).map((collection, i) => (
                                        <motion.div
                                            key={collection.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.05 * i }}
                                            className="flex-shrink-0 w-40 md:w-48"
                                        >
                                            <CollectionCard collection={collection} />
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 3. Content Sections */}
                        {layout.sections.map((section, idx) => (
                            <ContentSection
                                key={section.id}
                                {...section}
                                delay={0.1 * idx}
                            />
                        ))}

                        {/* Empty State Fallback */}
                        {!layout.featured && layout.sections.length === 0 && (
                            <div className="py-20 text-center">
                                <div className="text-4xl mb-4">🍂</div>
                                <h3 className="text-lg font-medium text-slate-900">Coming Soon</h3>
                                <p className="text-slate-500 mt-2 max-w-xs mx-auto">
                                    We are crafting content for this mood.
                                </p>
                            </div>
                        )}

                    </div>
                )}

            </div>
        </div>
    );
}
