'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getStories, getFavorites, getInProgressStories, getCollections, type Story, type StoryWithProgress, type Collection } from '@/lib/supabase';
import StoryCard from '@/components/StoryCard';
import CollectionCard from '@/components/CollectionCard';
import { usePlayer } from '@/lib/PlayerContext';
import { useAuth } from '@/lib/AuthProvider';
import { Heart, Play, Layers, X, Search, Headphones, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { AnimatePresence } from 'framer-motion';
import GlassLayout from '@/components/GlassLayout';

// Filter types
type FilterType = 'all' | 'favorites' | 'continue' | 'collections' | 'sleep' | 'meditation' | 'fantasy' | 'nature' | 'motivation' | 'kids' | 'soundscape' | 'binaural' | 'music_instrumental' | 'work_break';

// Category definitions
const categories: { id: string; label: string; emoji: string }[] = [
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

// Horizontal Slider Component
function HorizontalSlider({
    title,
    emoji,
    children,
    className = ''
}: {
    title: string;
    emoji?: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <section className={`mb-8 ${className}`}>
            <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    {emoji && <span className="text-base">{emoji}</span>}
                    {title}
                </h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-6 md:-mx-12 px-6 md:px-12">
                {children}
            </div>
        </section>
    );
}

export default function LibraryPage() {
    const { play } = usePlayer();
    const { user } = useAuth();

    const [allStories, setAllStories] = useState<Story[]>([]);
    const [allCollections, setAllCollections] = useState<Collection[]>([]);
    const [favorites, setFavorites] = useState<Story[]>([]);
    const [inProgress, setInProgress] = useState<StoryWithProgress[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Data Fetching
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

    // Fetch user-specific data
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

    // Get stories by category
    const getStoriesByCategory = (category: string) => {
        let stories = allStories.filter(s => s.category === category);
        if (searchQuery) {
            stories = stories.filter(s =>
                s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        return stories;
    };

    // Get collections by category
    const getCollectionsByCategory = (category: string) => {
        return allCollections.filter(c => c.category === category);
    };

    // Filter logic for specific filter selection
    const isShowAll = activeFilter === 'all';
    const isShowFavorites = activeFilter === 'favorites';
    const isShowContinue = activeFilter === 'continue';
    const isShowCollections = activeFilter === 'collections';
    const showCategoryFilter = !isShowAll && !isShowFavorites && !isShowContinue && !isShowCollections;

    const getFilteredData = () => {
        if (isShowFavorites) return { stories: favorites, collections: [] };
        if (isShowContinue) return { stories: inProgress, collections: [] };
        if (isShowCollections) return { stories: [], collections: allCollections };
        if (showCategoryFilter) {
            return {
                stories: getStoriesByCategory(activeFilter),
                collections: getCollectionsByCategory(activeFilter)
            };
        }
        return { stories: allStories, collections: allCollections };
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center pt-16">
                <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <GlassLayout>
            <div className="px-6 md:px-12">
                {/* Header */}
                <div className="mb-6">
                    <Link href="/" className="flex md:hidden items-center justify-center gap-2 mb-6 group">
                        <Headphones className="w-6 h-6 text-indigo-600 group-hover:scale-110 transition-transform" />
                        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent tracking-tight">
                            Softale
                        </h1>
                    </Link>

                    <h1 className="text-3xl font-bold text-slate-900 mb-4">Library</h1>

                    {/* Mobile Search */}
                    <div className="relative group md:hidden mb-4">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-slate-200 text-slate-900 rounded-2xl py-3 pl-12 pr-4 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
                            placeholder="Search stories..."
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Quick Filters */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0">
                    <button
                        onClick={() => setActiveFilter('all')}
                        className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${activeFilter === 'all'
                            ? 'bg-slate-900 text-white'
                            : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                            }`}
                    >
                        ✨ All
                    </button>
                    {user && favorites.length > 0 && (
                        <button
                            onClick={() => setActiveFilter('favorites')}
                            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${activeFilter === 'favorites'
                                ? 'bg-slate-900 text-white'
                                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                                }`}
                        >
                            ❤️ Favorites
                        </button>
                    )}
                    {user && inProgress.length > 0 && (
                        <button
                            onClick={() => setActiveFilter('continue')}
                            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${activeFilter === 'continue'
                                ? 'bg-slate-900 text-white'
                                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                                }`}
                        >
                            ▶️ Continue
                        </button>
                    )}
                    {allCollections.length > 0 && (
                        <button
                            onClick={() => setActiveFilter('collections')}
                            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${activeFilter === 'collections'
                                ? 'bg-slate-900 text-white'
                                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                                }`}
                        >
                            📚 Collections
                        </button>
                    )}

                    {/* Filter Button */}
                    <button
                        onClick={() => setIsFilterOpen(true)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${showCategoryFilter
                            ? 'bg-slate-900 text-white'
                            : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                            }`}
                    >
                        {showCategoryFilter
                            ? `${categories.find(c => c.id === activeFilter)?.emoji} ${categories.find(c => c.id === activeFilter)?.label}`
                            : '🔍 Filter'}
                    </button>
                </div>

                {/* Filter Drawer Modal - Using Portal to escape GlassLayout backdrop-blur stacking context */}
                {typeof window !== 'undefined' && createPortal(
                    <AnimatePresence>
                        {isFilterOpen && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsFilterOpen(false)}
                                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-4"
                            >
                                <motion.div
                                    initial={{ y: "100%" }}
                                    animate={{ y: 0 }}
                                    exit={{ y: "100%" }}
                                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="bg-white/95 backdrop-blur-xl border border-white/20 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative"
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
                                        {categories.map((cat) => (
                                            <button
                                                key={cat.id}
                                                onClick={() => {
                                                    setActiveFilter(cat.id as FilterType);
                                                    setIsFilterOpen(false);
                                                }}
                                                className={`flex flex-col items-center justify-center p-4 rounded-2xl gap-2 transition-all border ${activeFilter === cat.id
                                                    ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-[1.02]'
                                                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                                                    }`}
                                            >
                                                <span className="text-3xl filter drop-shadow-sm">{cat.emoji}</span>
                                                <span className="text-xs font-semibold">{cat.label}</span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Clear Filter */}
                                    {showCategoryFilter && (
                                        <button
                                            onClick={() => {
                                                setActiveFilter('all');
                                                setIsFilterOpen(false);
                                            }}
                                            className="w-full mt-6 py-3 rounded-xl border border-slate-200 text-slate-500 text-sm font-medium hover:bg-slate-50 transition"
                                        >
                                            Clear Filters
                                        </button>
                                    )}
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>,
                    document.body
                )}

                {/* Content Sections */}
                {isShowAll ? (
                    <>
                        {/* Continue Listening */}
                        {user && inProgress.length > 0 && (
                            <HorizontalSlider title="Continue Listening" emoji="▶️">
                                {inProgress.map((story, i) => (
                                    <motion.div
                                        key={story.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.03 * i }}
                                        className="flex-shrink-0 w-36 md:w-44"
                                    >
                                        <StoryCard
                                            story={story}
                                            aspectRatio="square"
                                            progress={story.progress_percent}
                                        />
                                    </motion.div>
                                ))}
                            </HorizontalSlider>
                        )}

                        {/* Favorites */}
                        {user && favorites.length > 0 && (
                            <HorizontalSlider title="Your Favorites" emoji="❤️">
                                {favorites.map((story, i) => (
                                    <motion.div
                                        key={story.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.03 * i }}
                                        className="flex-shrink-0 w-36 md:w-44"
                                    >
                                        <StoryCard story={story} aspectRatio="square" />
                                    </motion.div>
                                ))}
                            </HorizontalSlider>
                        )}

                        {/* Collections */}
                        {allCollections.length > 0 && (
                            <HorizontalSlider title="Collections" emoji="📚">
                                {allCollections.map((collection, i) => (
                                    <motion.div
                                        key={collection.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.03 * i }}
                                        className="flex-shrink-0 w-40 md:w-48"
                                    >
                                        <CollectionCard collection={collection} />
                                    </motion.div>
                                ))}
                            </HorizontalSlider>
                        )}

                        {/* Category Sliders */}
                        {categories.map(category => {
                            const stories = getStoriesByCategory(category.id);
                            if (stories.length === 0) return null;

                            return (
                                <HorizontalSlider key={category.id} title={category.label} emoji={category.emoji}>
                                    {stories.slice(0, 10).map((story, i) => (
                                        <motion.div
                                            key={story.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.03 * i }}
                                            className="flex-shrink-0 w-36 md:w-44"
                                        >
                                            <StoryCard story={story} aspectRatio="square" />
                                        </motion.div>
                                    ))}
                                </HorizontalSlider>
                            );
                        })}
                    </>
                ) : (
                    /* Filtered View (Single Category/Favorites/Continue) */
                    <>
                        {/* Collections for category */}
                        {showCategoryFilter && getCollectionsByCategory(activeFilter).length > 0 && (
                            <HorizontalSlider title="Collections" emoji="📚">
                                {getCollectionsByCategory(activeFilter).map((collection, i) => (
                                    <motion.div
                                        key={collection.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.03 * i }}
                                        className="flex-shrink-0 w-40 md:w-48"
                                    >
                                        <CollectionCard collection={collection} />
                                    </motion.div>
                                ))}
                            </HorizontalSlider>
                        )}

                        {/* Stories Grid for filtered view */}
                        <section>
                            <h2 className="text-lg font-bold text-slate-900 mb-4">
                                {isShowFavorites ? 'Your Favorites'
                                    : isShowContinue ? 'Continue Listening'
                                        : isShowCollections ? 'All Collections'
                                            : categories.find(c => c.id === activeFilter)?.label || 'Stories'}
                            </h2>

                            {/* Show Collections Grid when isShowCollections */}
                            {isShowCollections ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                                    {allCollections.map((collection, i) => (
                                        <motion.div
                                            key={collection.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.03 * Math.min(i, 10) }}
                                        >
                                            <CollectionCard collection={collection} />
                                        </motion.div>
                                    ))}
                                </div>
                            ) : getFilteredData().stories.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                                    {getFilteredData().stories.map((story, i) => (
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
                                            />
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-16 text-center">
                                    <div className="text-4xl mb-4">
                                        {isShowFavorites ? '❤️' : isShowContinue ? '▶️' : '📚'}
                                    </div>
                                    <h3 className="text-lg font-medium text-slate-900">
                                        {isShowFavorites ? 'No favorites yet'
                                            : isShowContinue ? 'Nothing in progress'
                                                : 'No stories in this category'}
                                    </h3>
                                    <p className="text-slate-500 mt-2 max-w-xs mx-auto">
                                        {isShowFavorites ? 'Tap the heart on any story to save it here.'
                                            : isShowContinue ? 'Start listening to something!'
                                                : 'Check back later for new content.'}
                                    </p>
                                    <button
                                        onClick={() => setActiveFilter('all')}
                                        className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-full text-sm font-medium hover:bg-slate-800 transition"
                                    >
                                        Show All
                                    </button>
                                </div>
                            )}
                        </section>
                    </>
                )}
            </div>
        </GlassLayout>
    );
}
