'use client';

import { Story } from '@/lib/supabase';
import { motion } from 'framer-motion';
import FeaturedCard from './FeaturedCard';
import StoryCard from './StoryCard';
import { ChevronLeft, ChevronRight, Play, Lock, MoreVertical } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState, useEffect, useCallback } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { useAuth } from '@/lib/AuthProvider';
import { formatDuration } from '@/lib/formatters';
import { useRouter } from 'next/navigation';
import StoryOptionsModal from './modals/StoryOptionsModal';
import { usePremiumModal } from '@/lib/usePremiumModal';

interface ContentSectionProps {
    title: string;
    subtitle?: string;
    items: Story[];
    type: 'row' | 'grid' | 'mixed';
    delay?: number;
    /** Category filter to use when navigating to Library via "View All" */
    filterCategory?: string;
    displayType?: 'slider' | 'list';
}

export default function ContentSection({
    title,
    subtitle,
    items,
    type,
    delay = 0,
    filterCategory,
    displayType
}: ContentSectionProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    // Drag scroll state using refs for immediate updates (no re-render delays)
    const isDraggingRef = useRef(false);
    const startXRef = useRef(0);
    const scrollLeftStartRef = useRef(0);

    // Drag scroll handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!scrollRef.current || e.button !== 0) return;
        e.preventDefault(); // Prevent browser's default image drag behavior
        isDraggingRef.current = true;
        startXRef.current = e.pageX - scrollRef.current.offsetLeft;
        scrollLeftStartRef.current = scrollRef.current.scrollLeft;
        scrollRef.current.style.cursor = 'grabbing';
        scrollRef.current.style.userSelect = 'none';
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDraggingRef.current || !scrollRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft;
        const walk = (x - startXRef.current) * 1.5;
        scrollRef.current.scrollLeft = scrollLeftStartRef.current - walk;
    };

    const handleMouseUp = () => {
        isDraggingRef.current = false;
        if (scrollRef.current) {
            scrollRef.current.style.cursor = 'grab';
            scrollRef.current.style.userSelect = '';
        }
    };

    const handleMouseLeave = () => {
        isDraggingRef.current = false;
        if (scrollRef.current) {
            scrollRef.current.style.cursor = 'grab';
            scrollRef.current.style.userSelect = '';
        }
    };

    // Check scroll position and update button states
    const updateScrollState = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;

        setCanScrollLeft(el.scrollLeft > 10);
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
    }, []);

    // Initial check and resize observer
    useEffect(() => {
        updateScrollState();

        const el = scrollRef.current;
        if (!el) return;

        el.addEventListener('scroll', updateScrollState, { passive: true });

        const resizeObserver = new ResizeObserver(updateScrollState);
        resizeObserver.observe(el);

        return () => {
            el.removeEventListener('scroll', updateScrollState);
            resizeObserver.disconnect();
        };
    }, [updateScrollState, items]);

    const scroll = (direction: 'left' | 'right') => {
        const el = scrollRef.current;
        if (!el) return;

        const scrollAmount = el.clientWidth * 0.75;
        el.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
    };

    // Handle "View All" click - set sessionStorage for Library page filter
    const handleViewAll = () => {
        if (filterCategory) {
            sessionStorage.setItem('reverie_library_active_filter', filterCategory);
        }
    };

    if (!items || items.length === 0) return null;

    // List View (Compact Rectangles)
    if (displayType === 'list') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay }}
                className="mb-10"
            >
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">{title}</h3>
                        {subtitle && <p className="text-slate-600 font-medium text-sm mt-0.5">{subtitle}</p>}
                    </div>
                    {/* View All */}
                    {filterCategory && (
                        <Link
                            href="/library"
                            onClick={handleViewAll}
                            className="text-sm font-medium text-indigo-600 flex items-center hover:underline hover:text-indigo-700 transition-colors"
                        >
                            View All <ChevronRight className="w-4 h-4 ml-0.5" />
                        </Link>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {items.map((story) => (
                        <CompactStoryCard key={story.id} story={story} />
                    ))}
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="mb-10 group/section"
        >
            {/* Header with Controls */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">{title}</h3>
                        {subtitle && <p className="text-slate-600 font-medium text-sm mt-0.5">{subtitle}</p>}
                    </div>

                    {/* Scroll Controls - Only for row type */}
                    {type === 'row' && items.length > 3 && (
                        <div className="flex items-center gap-1 opacity-0 group-hover/section:opacity-100 transition-opacity duration-200">
                            <button
                                onClick={() => scroll('left')}
                                disabled={!canScrollLeft}
                                aria-label="Scroll left"
                                className={`p-1.5 rounded-full border transition-all ${canScrollLeft
                                    ? 'bg-white/80 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300 shadow-sm'
                                    : 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                                    }`}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => scroll('right')}
                                disabled={!canScrollRight}
                                aria-label="Scroll right"
                                className={`p-1.5 rounded-full border transition-all ${canScrollRight
                                    ? 'bg-white/80 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300 shadow-sm'
                                    : 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                                    }`}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* View All Link */}
                {(type === 'row' || type === 'mixed') && items.length > 4 && filterCategory && (
                    <Link
                        href="/library"
                        onClick={handleViewAll}
                        className="text-sm font-medium text-indigo-600 flex items-center hover:underline hover:text-indigo-700 transition-colors"
                    >
                        View All <ChevronRight className="w-4 h-4 ml-0.5" />
                    </Link>
                )}
            </div>

            {/* Content */}
            {type === 'mixed' ? (
                // Mixed Layout: 1 Featured Banner + Horizontal Slider below
                <div className="flex flex-col gap-8">
                    {/* Featured Banner */}
                    {items.length > 0 && (
                        <div className="w-full">
                            <FeaturedCard story={items[0]} />
                        </div>
                    )}
                    {/* Horizontal Slider (Starting from index 1) */}
                    {items.length > 1 && (
                        <div>
                            {/* Optional Sub-header for the slider part */}
                            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 px-1">More in this section</h4>
                            <div
                                className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide w-full cursor-grab"
                                ref={scrollRef}
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseLeave}
                            >
                                {items.slice(1).map((story) => (
                                    <div key={story.id} className="w-48 md:w-56 flex-shrink-0">
                                        <StoryCard story={story} aspectRatio="square" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : type === 'row' ? (
                // Horizontal Carousel with proper margin handling + drag scroll
                <div
                    ref={scrollRef}
                    className="flex gap-4 overflow-x-auto pb-6 -mx-6 md:-mx-12 px-6 md:px-12 scrollbar-hide cursor-grab"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                >
                    {items.map((story) => (
                        <div key={story.id} className="w-48 md:w-56 flex-shrink-0">
                            <StoryCard story={story} aspectRatio="square" />
                        </div>
                    ))}
                </div>
            ) : (
                // Standard Grid
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {items.map((story) => (
                        <StoryCard key={story.id} story={story} aspectRatio="square" />
                    ))}
                </div>
            )}
        </motion.div>
    );
}

function CompactStoryCard({ story }: { story: Story }) {
    const { play, pause, currentStory, isPlaying } = usePlayer();
    const { user, profile } = useAuth();
    const router = useRouter();
    const { open: openPremiumModal } = usePremiumModal();

    const [showOptions, setShowOptions] = useState(false);

    const isCurrent = currentStory?.id === story.id;
    const isActive = isCurrent && isPlaying;
    const isLocked = story.is_premium && !profile?.is_premium;

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) { router.push('/login'); return; }

        if (isLocked) {
            openPremiumModal();
            return;
        }

        if (isActive) {
            pause();
        } else {
            play(story);
        }
    };

    const handlePremiumClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        openPremiumModal();
    };

    const handleOptionsClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) { router.push('/login'); return; }
        setShowOptions(true);
    };

    return (
        <>
            <div
                onClick={handleClick}
                className={`flex items-stretch h-20 rounded-xl transition-all cursor-pointer group backdrop-blur-xl shadow-sm hover:shadow-md overflow-hidden relative border pr-2
                    ${isActive
                        ? 'bg-indigo-100/90 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                        : 'bg-white/30 hover:bg-white/50 border-white/20'}
                `}
            >
                {/* Thumbnail - Full Height, Square */}
                <div className={`relative w-20 flex-shrink-0 ${isActive ? '' : 'bg-slate-800'}`}>
                    {story.cover_url ? (
                        <img src={story.cover_url} alt={story.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-white/50">🎧</div>
                    )}

                    {/* Premium Badge */}
                    {story.is_premium && (
                        <div className="absolute top-1 left-1 z-20">
                            <button onClick={handlePremiumClick} className="p-1 rounded-full bg-black/60 text-amber-400 backdrop-blur-md border border-amber-500/30">
                                <Lock className="w-2.5 h-2.5" />
                            </button>
                        </div>
                    )}

                    {/* Overlay - Highlight ONLY */}
                    <div className={`absolute inset-0 bg-black/5 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-center px-4 relative">
                    <h4 className={`font-bold text-sm truncate leading-tight pr-8 ${isActive ? 'text-indigo-900 cancel-italic' : 'text-slate-900 group-hover:text-black [text-shadow:0_0_10px_rgba(255,255,255,0.5)]'}`}>
                        {story.title}
                    </h4>
                    <div className={`flex items-center gap-2 text-[11px] mt-0.5 font-bold ${isActive ? 'text-indigo-700' : 'text-slate-700'}`}>
                        <span className="capitalize">{story.category.replace(/_/g, ' ')}</span>
                        <span>•</span>
                        <span>{formatDuration(story.duration)}</span>
                    </div>

                    {/* Unified Action Button (Top Right) */}
                    <div className={`absolute top-0 right-0 z-20 transition-all duration-200
                        ${isActive ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100 pointer-events-none md:group-hover:pointer-events-auto'}
                    `}>
                        <button
                            onClick={handleOptionsClick}
                            className={`p-1.5 rounded-full hover:bg-black/10 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            <StoryOptionsModal
                isOpen={showOptions}
                onClose={() => setShowOptions(false)}
                storyId={story.id}
                storyTitle={story.title}
            />
        </>
    );
}
