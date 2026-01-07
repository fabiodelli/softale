
'use client';

import { Story } from '@/lib/supabase';
import { motion } from 'framer-motion';
import StoryCard from './StoryCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState, useEffect, useCallback } from 'react';

interface ContentSectionProps {
    title: string;
    subtitle?: string;
    items: Story[];
    type: 'row' | 'grid';
    delay?: number;
    /** Category filter to use when navigating to Library via "View All" */
    filterCategory?: string;
}

export default function ContentSection({
    title,
    subtitle,
    items,
    type,
    delay = 0,
    filterCategory
}: ContentSectionProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

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

        const scrollAmount = el.clientWidth * 0.75; // Scroll 75% of visible width
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
                        {subtitle && <p className="text-slate-500 text-sm mt-0.5">{subtitle}</p>}
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
                {type === 'row' && items.length > 4 && filterCategory && (
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
            {type === 'row' ? (
                // Horizontal Carousel with proper margin handling
                <div
                    ref={scrollRef}
                    className="flex gap-4 overflow-x-auto pb-6 -mx-6 md:-mx-12 px-6 md:px-12 scrollbar-hide snap-x scroll-smooth"
                >
                    {items.map((story) => (
                        <div key={story.id} className="w-48 md:w-56 flex-shrink-0 snap-start">
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
