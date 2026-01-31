'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { type Story, type Collection } from '@/lib/supabase';
import StoryCard from '@/components/StoryCard';
import CollectionCard from '@/components/CollectionCard';
import MoodSelector, { Mood } from '@/components/MoodSelector';
import MoodToggleButton from '@/components/MoodToggleButton';
import { usePlayer } from '@/context/PlayerContext';
import { useAmbience } from '@/context/AmbienceContext';
import { useMood } from '@/context/MoodContext';
import { useLanding } from '@/context/LandingContext';
import { Layers } from 'lucide-react';
import { getLayoutForMood } from '@/config/home-layout';
import ContentSection from '@/components/ContentSection';
import FeaturedCard from '@/components/FeaturedCard';
import { trackEvent } from '@/lib/analytics';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/AuthProvider';
import LandingPage from '@/components/landing/LandingPage';
import BreathingLoader from '@/components/BreathingLoader';

// Mood to Categories Mapping
const moodToCategories: Record<string, string[]> = {
    'sleep': ['sleep', 'meditation', 'nature', 'soundscape', 'binaural', 'music_instrumental'],
    'meditation': ['meditation', 'binaural', 'work_break', 'nature', 'soundscape', 'music_instrumental'],
    'fantasy': ['fantasy', 'kids', 'sleep', 'nature', 'music_instrumental'],
    'nature': ['nature', 'soundscape', 'meditation', 'music_instrumental'],
    'energized': ['motivation', 'work_break', 'kids', 'nature', 'music_instrumental']
};

interface HomeClientProps {
    initialStories: Story[];
    initialCollections: Collection[];
}

export default function HomeClient({ initialStories, initialCollections }: HomeClientProps) {
    const { user, loading: authLoading } = useAuth();
    const { play } = usePlayer();
    const { isPlaying } = useAmbience();
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('q') || '';

    // STATE: Landing vs App
    const [showLanding, setShowLanding] = useState(true);
    const [showBreathing, setShowBreathing] = useState(false);
    const [appReady, setAppReady] = useState(false);
    const { setIsShowingLanding } = useLanding();

    // DATA STATE (Initialized from server props)
    const [allStories] = useState<Story[]>(initialStories);
    const [allCollections] = useState<Collection[]>(initialCollections);
    const [dataLoading, setDataLoading] = useState(false); // No longer needed for fetching, but kept for transition logic

    // MOOD STATE - Using shared context
    const { activeMood, setActiveMood } = useMood();
    const [greeting, setGreeting] = useState('');

    // SCROLL STATE
    const [heroVisible, setHeroVisible] = useState(true);
    const [maskSize, setMaskSize] = useState('25vh');

    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            const windowHeight = window.innerHeight;

            // Hero visibility controller
            setHeroVisible(scrollY < windowHeight * 0.5);

            // Dynamic Background & Mask Calculation
            const transitionStart = windowHeight * 0.5;
            const transitionEnd = windowHeight * 0.85;
            const transitionDistance = transitionEnd - transitionStart;

            let progress = 0;
            if (scrollY > transitionStart) {
                progress = Math.min((scrollY - transitionStart) / transitionDistance, 1);
            }

            const newMaskSize = Math.max(25 - (25 * progress), 0);
            setMaskSize(`${newMaskSize}vh`);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // Init
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // 1. CHECK VISITOR STATUS (Hybrid Logic)
    useEffect(() => {
        if (authLoading) return;

        if (user) {
            setShowLanding(false);
            setAppReady(true);
            return;
        }

        const hasVisited = localStorage.getItem('softale_has_visited');
        if (hasVisited === 'true') {
            setShowLanding(false);
            setAppReady(true);
        } else {
            setShowLanding(true);
        }
    }, [user, authLoading]);

    // Sync landing state with context for Navbar visibility
    useEffect(() => {
        setIsShowingLanding(showLanding && !user);
    }, [showLanding, user, setIsShowingLanding]);

    // Transition Handler
    const handleEnterApp = () => {
        localStorage.setItem('softale_has_visited', 'true');
        setShowLanding(false);
        setShowBreathing(true);
    };

    const handleBreathingComplete = () => {
        setShowBreathing(false);
        setAppReady(true);
    };

    // Autoplay from Vision page
    useEffect(() => {
        if (!appReady) return;

        const autoplayData = sessionStorage.getItem('softale_autoplay_story');
        if (autoplayData) {
            try {
                const story = JSON.parse(autoplayData);
                if (story && story.id) {
                    setTimeout(() => play(story), 300);
                }
            } catch (e) {
                console.error('Failed to parse autoplay story:', e);
            }
            sessionStorage.removeItem('softale_autoplay_story');
        }

        const preferencesData = sessionStorage.getItem('softale_preferences');
        if (preferencesData) {
            try {
                const preferences = JSON.parse(preferencesData);
                const prefToMood: Record<string, Mood> = {
                    'sleep': 'sleep',
                    'stress': 'meditation',
                    'peace': 'nature',
                    'escape': 'fantasy',
                    'energy': 'energized'
                };
                if (preferences.length > 0 && prefToMood[preferences[0]]) {
                    setActiveMood(prefToMood[preferences[0]]);
                    sessionStorage.setItem('reverie_active_mood', prefToMood[preferences[0]]);
                }
            } catch (e) {
                console.error('Failed to parse preferences:', e);
            }
            sessionStorage.removeItem('softale_preferences');
        }
    }, [appReady, play, setActiveMood]);

    // Time-based Greeting
    useEffect(() => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) setGreeting('Good Morning');
        else if (hour >= 12 && hour < 18) setGreeting('Good Afternoon');
        else setGreeting('Good Evening');
    }, []);

    // Sync Mood with URL
    useEffect(() => {
        const moodParam = searchParams.get('mood');
        if (moodParam && moodToCategories[moodParam]) {
            setActiveMood(moodParam as Mood);
            sessionStorage.setItem('reverie_active_mood', moodParam);
        }
    }, [searchParams, setActiveMood]);

    // Restore Mood
    useEffect(() => {
        const savedMood = sessionStorage.getItem('reverie_active_mood');
        if (savedMood) setActiveMood(savedMood as Mood);
    }, [setActiveMood]);

    // Ambience Integration
    const { setTrack } = useAmbience();
    const moodToAmbience: Record<string, string> = {
        'sleep': 'night',
        'meditation': 'river',
        'fantasy': 'wind',
        'nature': 'forest',
        'energized': 'ocean'
    };

    const handleMoodSelect = (mood: Mood) => {
        setActiveMood(mood);
        trackEvent('mood_select', { mood });
        sessionStorage.setItem('reverie_active_mood', mood);
        const trackId = moodToAmbience[mood];
        if (trackId) setTrack(trackId);
    };

    // ... Filter Logic ...
    const displayedStories = allStories.filter(story => {
        if (!searchQuery && !activeMood) return true;
        if (searchQuery) return story.title.toLowerCase().includes(searchQuery.toLowerCase()) || (story.description && story.description.toLowerCase().includes(searchQuery.toLowerCase()));
        if (activeMood) return (moodToCategories[activeMood] || []).includes(story.category);
        return true;
    });

    const displayedCollections = allCollections.filter(c => {
        if (searchQuery) return false;
        return (moodToCategories[activeMood] || []).includes(c.category || '');
    });

    const layout = getLayoutForMood(activeMood, allStories);

    // --- RENDER ---

    if (showLanding && !user) {
        return <LandingPage onEnterApp={handleEnterApp} showNav={false} />;
    }

    if (showBreathing) {
        return <BreathingLoader onComplete={handleBreathingComplete} minDuration={3500} />;
    }

    if (!appReady) {
        return <div className="min-h-screen bg-slate-50" />;
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="min-h-screen bg-slate-50 selection:bg-indigo-100 selection:text-indigo-900"
        >
            <div className="fixed top-0 inset-x-0 h-[100dvh] z-0">
                <MoodSelector
                    activeMood={activeMood}
                    onSelect={handleMoodSelect}
                    greeting={greeting}
                    isControllerVisible={heroVisible}
                />
            </div>

            <div className="fixed top-4 left-4 z-50 md:hidden">
                <MoodToggleButton
                    activeMood={activeMood}
                    onMoodSelect={handleMoodSelect}
                    variant="mobile"
                />
            </div>

            <div
                className="relative z-10 mt-[40vh] md:mt-[70vh] bg-slate-50/60 backdrop-blur-2xl min-h-screen pb-20 md:pb-12 shadow-none transition-all duration-75 ease-out"
                style={{
                    maskImage: `linear-gradient(to bottom, transparent, black ${maskSize})`,
                    WebkitMaskImage: `linear-gradient(to bottom, transparent, black ${maskSize})`
                }}
            >
                <div className="max-w-[1600px] mx-auto px-6 md:px-12 pt-[15vh]">

                    {/* SEARCH MODE */}
                    {searchQuery ? (
                        <div className="mb-20">
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-slate-900">Results for "{searchQuery}"</h2>
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
                        </div>
                    ) : (
                        /* CONTEXTUAL FEED MODE */
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

                            {/* 0. Featured Hero Card */}
                            {layout.featured && (
                                <div className="mb-16">
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 px-1">Featured for {activeMood}</h3>
                                    <FeaturedCard story={layout.featured} />
                                </div>
                            )}

                            {/* 1. Collections Row */}
                            {displayedCollections.length > 0 && (
                                <div className="mb-12">
                                    <div className="flex items-center gap-2 mb-4 px-1">
                                        <Layers className="w-4 h-4 text-indigo-600" />
                                        <h3 className="text-lg font-bold text-slate-900">Collections</h3>
                                    </div>
                                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide w-full items-start">
                                        {displayedCollections.slice(0, 6).map((collection, i) => (
                                            <motion.div
                                                key={collection.id}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.05 * i }}
                                                className="flex-shrink-0"
                                            >
                                                <CollectionCard collection={collection} className="w-60 md:w-80" />
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 2. Content Sections */}
                            {layout.sections.map((section, idx) => (
                                <div key={section.id}>
                                    {idx > 0 && <div className="border-t border-slate-200/60 mx-6 md:mx-12 my-10" />}
                                    <ContentSection
                                        title={section.title}
                                        subtitle={section.subtitle}
                                        items={section.items}
                                        type={section.type}
                                        displayType={section.displayType}
                                    />
                                </div>
                            ))}

                            {layout.sections.length === 0 && (
                                <div className="text-center py-20 text-slate-400">
                                    <p>No stories found for this mood.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </motion.div >
    );
}
