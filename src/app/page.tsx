'use client';

import { motion, AnimatePresence } from 'framer-motion';
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
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/AuthProvider'; // Import Auth
import LandingPage from '@/components/landing/LandingPage'; // Import Landing

// Mood to Categories Mapping
const moodToCategories: Record<string, string[]> = {
  'sleep': ['sleep', 'meditation', 'nature', 'soundscape', 'binaural', 'music_instrumental'],
  'meditation': ['meditation', 'binaural', 'work_break', 'nature', 'soundscape', 'music_instrumental'],
  'fantasy': ['fantasy', 'kids', 'sleep', 'nature', 'music_instrumental'],
  'nature': ['nature', 'soundscape', 'meditation', 'music_instrumental'],
  'energized': ['motivation', 'work_break', 'kids', 'nature', 'music_instrumental']
};

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const { play } = usePlayer();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  // STATE: Landing vs App
  const [showLanding, setShowLanding] = useState(true);
  const [appReady, setAppReady] = useState(false);

  // DATA STATE
  const [allStories, setAllStories] = useState<Story[]>([]);
  const [allCollections, setAllCollections] = useState<Collection[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // MOOD STATE
  const [activeMood, setActiveMood] = useState<Mood>('sleep');
  const [greeting, setGreeting] = useState('');

  // 1. CHECK VISITOR STATUS (Hybrid Logic)
  useEffect(() => {
    // If Auth is still loading, wait.
    if (authLoading) return;

    // If User is logged in, ALWAYS skip landing.
    if (user) {
      setShowLanding(false);
      setAppReady(true);
      return;
    }

    // If User is NOT logged in, check if they've visited before.
    const hasVisited = localStorage.getItem('softale_has_visited');
    if (hasVisited === 'true') {
      setShowLanding(false);
      setAppReady(true);
    } else {
      // First timer: Show Landing
      setShowLanding(true);
      // Pre-fetch App data in background while they read the landing page...
    }
  }, [user, authLoading]);

  // Transition Handler
  const handleEnterApp = () => {
    localStorage.setItem('softale_has_visited', 'true');
    setShowLanding(false);
    setTimeout(() => setAppReady(true), 500); // Small delay for fade effect if needed
  };

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
  }, [searchParams]);

  // Restore Mood
  useEffect(() => {
    const savedMood = sessionStorage.getItem('reverie_active_mood');
    if (savedMood) setActiveMood(savedMood as Mood);
  }, []);

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
    sessionStorage.setItem('reverie_active_mood', mood);
    const trackId = moodToAmbience[mood];
    if (trackId) setTrack(trackId);
  };

  // Data Fetching
  useEffect(() => {
    async function fetchData() {
      // If we are showing landing, we can still fetch in background
      const [stories, collections] = await Promise.all([
        getStories(),
        getCollections()
      ]);
      setAllStories(stories);
      setAllCollections(collections);
      setDataLoading(false);
    }
    fetchData();
  }, []); // Run once on mount

  // ... Filter Logic ...
  const displayedStories = allStories.filter(story => {
    if (!searchQuery && !activeMood) return true;
    if (searchQuery) return story.title.toLowerCase().includes(searchQuery.toLowerCase()) || story.description.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeMood) return (moodToCategories[activeMood] || []).includes(story.category);
    return true;
  });

  const displayedCollections = allCollections.filter(c => {
    if (searchQuery) return false;
    return (moodToCategories[activeMood] || []).includes(c.category || '');
  });

  const layout = getLayoutForMood(activeMood, allStories);

  // --- RENDER ---

  // 1. LANDING PAGE STATE
  if (showLanding && !user) {
    return <LandingPage onEnterApp={handleEnterApp} />;
  }

  // 2. APP LOADING STATE (Transition)
  if (!appReady && !dataLoading) {
    return <div className="min-h-screen bg-slate-50" />; // Empty flash during swap
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 3. APP DASHBOARD STATE
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="min-h-screen bg-slate-50 pb-20"
    >
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

            {/* 1. Collections Row (Top Priority) */}
            {displayedCollections.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-lg font-bold text-slate-900">Collections</h3>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide w-full">
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

            {/* Global Featured Card REMOVED as per user request */}
            {/* {layout.featured && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <FeaturedCard story={layout.featured} />
              </motion.div>
            )} */}

            {/* 3. Content Sections */}
            {layout.sections.map((section, idx) => (
              <div key={section.id}>
                {/* Horizontal Divider (Indented, subtle) - Between sections only */}
                {idx > 0 && <div className="border-t border-slate-200/60 mx-6 md:mx-12 my-10" />}

                <ContentSection
                  title={section.title}
                  subtitle={section.subtitle}
                  items={section.items}
                  type={section.type}
                />
              </div>
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
    </motion.div>
  );
}
