'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { getStories, getFavorites, getInProgressStories, getCollections, type Story, type StoryWithProgress, type Collection } from '@/lib/supabase';
import StoryCard from '@/components/StoryCard';
import CollectionCard from '@/components/CollectionCard';
import { usePlayer } from '@/lib/PlayerContext';
import { useAuth } from '@/lib/AuthProvider';
import { Heart, Play, Layers, X } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

// Filter types - add new loopable categories
type FilterType = 'all' | 'favorites' | 'continue' | 'sleep' | 'meditation' | 'fantasy' | 'nature' | 'motivation' | 'kids' | 'soundscape' | 'binaural' | 'music_instrumental' | 'work_break';

export default function LibraryPage() {
    const { play } = usePlayer();
    const { user } = useAuth();

    const [allStories, setAllStories] = useState<Story[]>([]);
    const [allCollections, setAllCollections] = useState<Collection[]>([]);
    const [favorites, setFavorites] = useState<Story[]>([]);
    const [inProgress, setInProgress] = useState<StoryWithProgress[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [isFilterOpen, setIsFilterOpen] = useState(false);

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

    // Fetch favorites and in-progress when user is logged in
    useEffect(() => {
        async function fetchUserData() {
            if (user) {
                const [favs, progress] = await Promise.all([
                    getFavorites(user.id),
                    getInProgressStories(user.id)
                ]);
                setFavorites(favs);
                setInProgress(progress);
            } else {
                setFavorites([]);
                setInProgress([]);
            }
        }
        fetchUserData();
    }, [user]);

    // Restore Filter from SessionStorage
    useEffect(() => {
        const savedFilter = sessionStorage.getItem('reverie_library_active_filter');
        if (savedFilter) {
            setActiveFilter(savedFilter as FilterType);
        }
    }, []);

    // Filter Handler with Persistence
    const handleFilterSelect = (filter: FilterType) => {
        setActiveFilter(filter);
        if (filter !== 'all') {
            sessionStorage.setItem('reverie_library_active_filter', filter);
        } else {
            sessionStorage.removeItem('reverie_library_active_filter');
        }
    };

    // Get displayed stories based on active filter
    const getDisplayedStories = (): (Story | StoryWithProgress)[] => {
        switch (activeFilter) {
            case 'favorites':
                return favorites;
            case 'continue':
                return inProgress;
            case 'all':
                return allStories;
            default:
                // Category filter
                return allStories.filter(story => story.category === activeFilter);
        }
    };

    // Get displayed collections based on active filter
    const getDisplayedCollections = (): Collection[] => {
        if (activeFilter === 'favorites' || activeFilter === 'continue') {
            return []; // No collections for these special filters
        }
        if (activeFilter === 'all') {
            return allCollections;
        }
        return allCollections.filter(col => col.category === activeFilter);
    };

    const displayedStories = getDisplayedStories();
    const displayedCollections = getDisplayedCollections();

    // Special filters (navigation)
    const specialFilters: { id: FilterType; label: string; emoji: string; show: boolean }[] = [
        { id: 'all', label: 'All', emoji: '✨', show: true },
        { id: 'favorites', label: 'Favorites', emoji: '❤️', show: !!user && favorites.length > 0 },
        { id: 'continue', label: 'Continue', emoji: '▶️', show: !!user && inProgress.length > 0 },
    ];

    // Category filters
    const categoryFilters: { id: FilterType; label: string; emoji: string }[] = [
        { id: 'sleep', label: 'Sleep', emoji: '🌙' },
        { id: 'meditation', label: 'Meditation', emoji: '🧘' },
        { id: 'fantasy', label: 'Fantasy', emoji: '🌟' },
        { id: 'nature', label: 'Nature', emoji: '🌿' },
        { id: 'soundscape', label: 'Soundscapes', emoji: '🌊' },
        { id: 'binaural', label: 'Binaural', emoji: '🔮' },
        { id: 'music_instrumental', label: 'Instrumental', emoji: '🎵' },
        { id: 'motivation', label: 'Focus', emoji: '⚡' },
        { id: 'work_break', label: 'Work Break', emoji: '☕' },
        { id: 'kids', label: 'Kids', emoji: '🧸' },
    ];

    // Check if active filter is a category
    const isSpecialFilter = ['all', 'favorites', 'continue'].includes(activeFilter);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center pt-16">
                <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pt-16 pb-24">
            <div className="max-w-[100vw] overflow-hidden px-6 md:px-12">

                {/* Filters - Two Row Layout */}
                <div className="mb-6 space-y-3">
                    {/* Row 1: Special Filters + Category Pills */}
                    <div className="flex items-center gap-3">
                        {/* Special Filters - Fixed */}


                        {/* Category Pills - Scrollable */}
                        <div className="flex gap-1.5 flex-shrink-0">
                            {specialFilters.filter(f => f.show).map((filter) => (
                                <button
                                    key={filter.id}
                                    onClick={() => handleFilterSelect(filter.id)}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${activeFilter === filter.id
                                        ? 'bg-slate-900 text-white shadow-sm'
                                        : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    <span className="text-xs">{filter.emoji}</span>
                                    <span className="hidden sm:inline">{filter.label}</span>
                                    {filter.id === 'favorites' && user && (
                                        <span className="text-xs opacity-70">{favorites.length}</span>
                                    )}
                                    {filter.id === 'continue' && user && (
                                        <span className="text-xs opacity-70">{inProgress.length}</span>
                                    )}
                                </button>
                            ))}

                            {/* Filter Trigger Button */}
                            <button
                                onClick={() => setIsFilterOpen(true)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${!isSpecialFilter
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                                    }`}
                            >
                                <span className="text-xs">{!isSpecialFilter ? categoryFilters.find(f => f.id === activeFilter)?.emoji || '🔍' : '🔍'}</span>
                                <span>{!isSpecialFilter ? categoryFilters.find(f => f.id === activeFilter)?.label || 'Filter' : 'Filter'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filter Drawer / Modal */}
                <AnimatePresence>
                    {isFilterOpen && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsFilterOpen(false)}
                                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4"
                            >
                                {/* Drawer Content */}
                                <motion.div
                                    initial={{ y: "100%" }}
                                    animate={{ y: 0 }}
                                    exit={{ y: "100%" }}
                                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="bg-white/90 backdrop-blur-xl border border-white/20 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative"
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-bold text-slate-900">Browse Categories</h3>
                                        <button
                                            onClick={() => setIsFilterOpen(false)}
                                            className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition"
                                        >
                                            <X className="w-5 h-5 text-slate-500" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        {categoryFilters.map((filter) => (
                                            <button
                                                key={filter.id}
                                                onClick={() => {
                                                    handleFilterSelect(filter.id);
                                                    setIsFilterOpen(false);
                                                }}
                                                className={`flex flex-col items-center justify-center p-4 rounded-2xl gap-2 transition-all border ${activeFilter === filter.id
                                                    ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-[1.02]'
                                                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                                                    }`}
                                            >
                                                <span className="text-3xl filter drop-shadow-sm">{filter.emoji}</span>
                                                <span className="text-xs font-semibold">{filter.label}</span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Clear Filter Option */}
                                    {!isSpecialFilter && (
                                        <button
                                            onClick={() => {
                                                handleFilterSelect('all');
                                                setIsFilterOpen(false);
                                            }}
                                            className="w-full mt-6 py-3 rounded-xl border border-slate-200 text-slate-500 text-sm font-medium hover:bg-slate-50 transition"
                                        >
                                            Clear Filters
                                        </button>
                                    )}
                                </motion.div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>


                {/* Collections Row - If any collections match the filter */}
                {
                    displayedCollections.length > 0 && (
                        <div className="mb-8">
                            <div className="flex items-center gap-2 mb-4">
                                <Layers className="w-4 h-4 text-indigo-600" />
                                <h3 className="text-lg font-bold text-slate-900">Collections</h3>
                                <span className="text-sm text-slate-400">({displayedCollections.length})</span>
                            </div>
                            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-6 md:-mx-12 px-6 md:px-12">
                                {displayedCollections.map((collection, i) => (
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
                    )
                }

                {/* Stories Section */}
                {
                    (displayedStories.length > 0 || displayedCollections.length === 0) && (
                        <>
                            {displayedCollections.length > 0 && (
                                <div className="flex items-center gap-2 mb-4">
                                    <h3 className="text-lg font-bold text-slate-900">Stories</h3>
                                    <span className="text-sm text-slate-400">({displayedStories.length})</span>
                                </div>
                            )}

                            {/* Story Grid */}
                            {displayedStories.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
                                    {displayedStories.map((story, i) => (
                                        <motion.div
                                            key={story.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.03 * Math.min(i, 10) }}
                                        >
                                            <StoryCard
                                                story={story}
                                                aspectRatio="square"
                                                progress={(story as StoryWithProgress).progress_percent}
                                                className="hover:shadow-xl hover:-translate-y-1"
                                            />
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 text-center">
                                    <div className="text-4xl mb-4">
                                        {activeFilter === 'favorites' ? '❤️' : activeFilter === 'continue' ? '▶️' : '📚'}
                                    </div>
                                    <h3 className="text-lg font-medium text-slate-900">
                                        {activeFilter === 'favorites'
                                            ? 'No favorites yet'
                                            : activeFilter === 'continue'
                                                ? 'No stories in progress'
                                                : 'No content in this category'}
                                    </h3>
                                    <p className="text-slate-500 mt-2 max-w-xs mx-auto">
                                        {activeFilter === 'favorites'
                                            ? 'Tap the heart on any story to save it here.'
                                            : activeFilter === 'continue'
                                                ? 'Start listening to a story and it will appear here.'
                                                : 'Try selecting a different category.'}
                                    </p>
                                    <button
                                        onClick={() => setActiveFilter('all')}
                                        className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-full text-sm font-medium hover:bg-slate-800 transition"
                                    >
                                        Show All
                                    </button>
                                </div>
                            )}
                        </>
                    )
                }
            </div >
        </div >
    );
}
