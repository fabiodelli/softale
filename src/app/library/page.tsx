'use client';

import { Suspense } from 'react';

import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getStories, getFavorites, getInProgressStories, getCollections, getUserPlaylists, type Story, type StoryWithProgress, type Collection, type Playlist } from '@/lib/supabase';
import { getRecommendedStories } from '@/lib/recommendations';
import StoryCard from '@/components/StoryCard';
import CollectionCard from '@/components/CollectionCard';
import { usePlayer } from '@/context/PlayerContext';
import { useAuth } from '@/lib/AuthProvider';
import { Heart, Play, Layers, X, Search, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence } from 'framer-motion';
import GlassLayout from '@/components/GlassLayout';
import HorizontalSlider from '@/components/HorizontalSlider';
import PlaylistCard from '@/components/PlaylistCard';
import CreatePlaylistModal from '@/components/modals/CreatePlaylistModal';
import { CATEGORIES, ANIMATION, Z_INDEX } from '@/lib/constants';
import type { FilterType } from '@/types';
import { Plus, ListMusic } from 'lucide-react';



function LibraryContent() {
    const { play } = usePlayer();
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();

    const [allStories, setAllStories] = useState<Story[]>([]);
    const [allCollections, setAllCollections] = useState<Collection[]>([]);
    const [favorites, setFavorites] = useState<Story[]>([]);
    const [inProgress, setInProgress] = useState<StoryWithProgress[]>([]);
    const [recommended, setRecommended] = useState<Story[]>([]);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [searchQuery, setSearchQuery] = useState(searchParams?.get('q') || '');
    const lastPushedQuery = useRef(searchParams?.get('q') || '');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);


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
                const [favs, progress, userPlaylists, recs] = await Promise.all([
                    getFavorites(user.id),
                    getInProgressStories(user.id),
                    getUserPlaylists(user.id),
                    getRecommendedStories(user.id)
                ]);
                setFavorites(favs);
                setInProgress(progress);
                setPlaylists(userPlaylists);
                setRecommended(recs);
            } else {
                setFavorites([]);
                setInProgress([]);
                setRecommended([]);
                setPlaylists([]);
            }
        }
        fetchUserData();
    }, [user]);

    // Sync search query from URL (Read Only - preventing race condition)
    useEffect(() => {
        const q = searchParams?.get('q') || '';
        // If the incoming query matches what we just pushed, ignore it.
        // If it's different, it's an external change (Nav, Back button, etc.), so sync.
        if (q !== lastPushedQuery.current) {
            setSearchQuery(q);
            lastPushedQuery.current = q; // Update ref to match new external truth
        }

        if (q && activeFilter !== 'all') {
            setActiveFilter('all');
        }
    }, [searchParams]);

    // Update URL when internal search input changes (Mobile) - Debounced
    useEffect(() => {
        const timer = setTimeout(() => {
            const currentQ = searchParams?.get('q') || '';
            if (searchQuery !== currentQ) {
                const params = new URLSearchParams(searchParams?.toString());
                if (searchQuery) {
                    params.set('q', searchQuery);
                } else {
                    params.delete('q');
                }

                // Mark this as our intended change
                lastPushedQuery.current = searchQuery;

                router.replace(`/library?${params.toString()}`, { scroll: false });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, router, searchParams]);

    // Helper to filter and sort by search relevancy
    const filterAndSortStories = (stories: Story[]) => {
        if (!searchQuery) return stories;
        const lowerQ = searchQuery.toLowerCase();

        return stories.filter(s =>
            s.title.toLowerCase().includes(lowerQ) ||
            (s.description && s.description.toLowerCase().includes(lowerQ))
        ).sort((a, b) => {
            const aTitle = a.title.toLowerCase();
            const bTitle = b.title.toLowerCase();
            const aStarts = aTitle.startsWith(lowerQ);
            const bStarts = bTitle.startsWith(lowerQ);

            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;
            return 0;
        });
    }

    // Get stories by category with Search
    const getStoriesByCategory = (category: string) => {
        let stories = allStories.filter(s => s.category === category);
        return filterAndSortStories(stories);
    };

    // Get collections by category
    const getCollectionsByCategory = (category: string) => {
        return allCollections.filter(c => c.category === category);
    };

    // Filter logic for specific filter selection
    const isSearching = !!searchQuery;
    const isShowAll = activeFilter === 'all' && !isSearching;
    const isShowFavorites = activeFilter === 'favorites';
    const isShowContinue = activeFilter === 'continue';
    const isShowCollections = activeFilter === 'collections';
    const isShowPlaylists = activeFilter === 'playlists';
    const showCategoryFilter = activeFilter !== 'all' && !isShowFavorites && !isShowContinue && !isShowCollections && !isShowPlaylists;

    const getFilteredData = () => {
        let result = { stories: [] as Story[], collections: [] as Collection[], playlists: [] as Playlist[] };

        if (isShowFavorites) result = { stories: favorites, collections: [], playlists: [] };
        else if (isShowContinue) result = { stories: inProgress, collections: [], playlists: [] };
        else if (isShowCollections) result = { stories: [], collections: allCollections, playlists: [] };
        else if (isShowPlaylists) result = { stories: [], collections: [], playlists: playlists };
        else if (showCategoryFilter) {
            result = {
                stories: getStoriesByCategory(activeFilter),
                collections: getCollectionsByCategory(activeFilter),
                playlists: []
            };
        } else {
            // Fallback or All
            let stories = allStories;
            if (searchQuery) {
                stories = filterAndSortStories(stories);
            }
            result = { stories: stories, collections: allCollections, playlists: [] };
        }

        return result;
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
                {/* Mobile Logo - Scrolls with page, positioned like home */}
                <Link href="/" className="fixed top-4 left-1/2 -translate-x-1/2 md:hidden flex items-center gap-2 group drop-shadow-lg z-50">
                    <Image
                        src="/assets/softale-icon.png"
                        alt="Softale"
                        width={200}
                        height={200}
                        className="h-12 w-auto drop-shadow-lg group-hover:scale-105 transition-transform"
                    />
                    <span
                        className="text-2xl font-semibold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent drop-shadow-lg"
                        style={{ fontFamily: 'Outfit, var(--font-inter), system-ui, sans-serif' }}
                    >
                        Softale
                    </span>
                </Link>

                {/* Header */}
                <div className="mb-6 mt-16 md:mt-0">{/* mt-16 to account for absolute logo */}

                    {/* Title removed as per user request */}

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
                            className={`hidden md:block px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${activeFilter === 'favorites'
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
                            className={`hidden md:block px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${activeFilter === 'continue'
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
                            className={`hidden md:block px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${activeFilter === 'collections'
                                ? 'bg-slate-900 text-white'
                                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                                }`}
                        >
                            📚 Collections
                        </button>
                    )}
                    {user && (
                        <button
                            onClick={() => setActiveFilter('playlists')}
                            className={`hidden md:block px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${activeFilter === 'playlists'
                                ? 'bg-slate-900 text-white'
                                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                                }`}
                        >
                            🎧 Playlists
                        </button>
                    )}

                    {/* Filter Button */}
                    <button
                        onClick={() => setIsFilterOpen(true)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${showCategoryFilter || (!isShowAll && !showCategoryFilter)
                            ? 'bg-slate-900 text-white'
                            : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                            }`}
                    >
                        {showCategoryFilter
                            ? `${CATEGORIES.find(c => c.id === activeFilter)?.emoji} ${CATEGORIES.find(c => c.id === activeFilter)?.label}`
                            : (!isShowAll && !showCategoryFilter) ? '✨ Filters Active' : '🔍 Filters'}
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

                                    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">

                                        {/* Quick Links (Formerly Horizontal Scroll) */}
                                        <section>
                                            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">Quick Access</h4>
                                            <div className="grid grid-cols-2 gap-2">
                                                {user && favorites.length > 0 && (
                                                    <button
                                                        onClick={() => { setActiveFilter('favorites'); setIsFilterOpen(false); }}
                                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${activeFilter === 'favorites'
                                                            ? 'bg-slate-900 text-white border-slate-900'
                                                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'}`}
                                                    >
                                                        <span className="text-xl">❤️</span>
                                                        <span className="font-bold text-sm">Favorites</span>
                                                    </button>
                                                )}
                                                {user && inProgress.length > 0 && (
                                                    <button
                                                        onClick={() => { setActiveFilter('continue'); setIsFilterOpen(false); }}
                                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${activeFilter === 'continue'
                                                            ? 'bg-slate-900 text-white border-slate-900'
                                                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'}`}
                                                    >
                                                        <span className="text-xl">▶️</span>
                                                        <span className="font-bold text-sm">Continue</span>
                                                    </button>
                                                )}
                                                {allCollections.length > 0 && (
                                                    <button
                                                        onClick={() => { setActiveFilter('collections'); setIsFilterOpen(false); }}
                                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${activeFilter === 'collections'
                                                            ? 'bg-slate-900 text-white border-slate-900'
                                                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'}`}
                                                    >
                                                        <span className="text-xl">📚</span>
                                                        <span className="font-bold text-sm">Collections</span>
                                                    </button>
                                                )}
                                                {user && (
                                                    <button
                                                        onClick={() => { setActiveFilter('playlists'); setIsFilterOpen(false); }}
                                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${activeFilter === 'playlists'
                                                            ? 'bg-slate-900 text-white border-slate-900'
                                                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'}`}
                                                    >
                                                        <span className="text-xl">🎧</span>
                                                        <span className="font-bold text-sm">Playlists</span>
                                                    </button>
                                                )}
                                            </div>
                                        </section>
                                        <section>
                                            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">Category</h4>
                                            <div className="grid grid-cols-3 gap-2">
                                                {CATEGORIES.map((cat) => (
                                                    <button
                                                        key={cat.id}
                                                        onClick={() => {
                                                            setActiveFilter(cat.id as FilterType);
                                                            // Don't close immediately if we want to add more filters? 
                                                            // Actually users might expect it. Let's keep it open only if they click tags?
                                                            // For now let's close on category change as it's the main filter.
                                                            setIsFilterOpen(false);
                                                        }}
                                                        className={`flex flex-col items-center justify-center p-3 rounded-xl gap-1 transition-all border ${activeFilter === cat.id
                                                            ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-[1.02]'
                                                            : 'bg-slate-50 text-slate-600 border-transparent hover:bg-white hover:border-slate-200 hover:shadow-sm'
                                                            }`}
                                                    >
                                                        <span className="text-2xl filter drop-shadow-sm">{cat.emoji}</span>
                                                        <span className="text-[10px] uppercase font-bold tracking-wide">{cat.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </section>
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

                        {/* Recommended For You */}
                        {user && recommended.length > 0 && (
                            <HorizontalSlider title="Recommended For You" emoji="🔮">
                                {recommended.map((story, i) => (
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
                        {CATEGORIES.map(category => {
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
                            <h2 className="text-lg font-bold text-white [text-shadow:_0_1px_3px_rgb(0_0_0_/_90%)] mb-4">
                                {isShowFavorites ? 'Your Favorites'
                                    : isShowContinue ? 'Continue Listening'
                                        : isShowCollections ? 'All Collections'
                                            : isShowPlaylists ? 'Your Playlists'
                                                : isSearching ? `Search Results: "${searchQuery}"`
                                                    : CATEGORIES.find(c => c.id === activeFilter)?.label || 'Stories'}
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
                            ) : isShowPlaylists ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        onClick={() => setShowCreatePlaylistModal(true)}
                                        className="cursor-pointer group relative aspect-square rounded-2xl overflow-hidden bg-white/5 border-2 border-dashed border-white/20 hover:border-indigo-400 hover:bg-white/10 transition flex flex-col items-center justify-center text-white/60 hover:text-indigo-300"
                                    >
                                        <Plus className="w-10 h-10 mb-2" />
                                        <span className="font-bold">Create New</span>
                                    </motion.div>
                                    {playlists.map((playlist, i) => (
                                        <motion.div
                                            key={playlist.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.05 * i }}
                                        >
                                            <PlaylistCard playlist={playlist} />
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
                                    <h3 className="text-lg font-medium text-white [text-shadow:_0_1px_3px_rgb(0_0_0_/_90%)]">
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
            <CreatePlaylistModal
                isOpen={showCreatePlaylistModal}
                onClose={() => setShowCreatePlaylistModal(false)}
                onCreated={async () => {
                    if (user) {
                        const data = await getUserPlaylists(user.id);
                        setPlaylists(data);
                    }
                }}
            />
        </GlassLayout>
    );
}

export default function LibraryPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center pt-16">
                <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <LibraryContent />
        </Suspense>
    );
}

